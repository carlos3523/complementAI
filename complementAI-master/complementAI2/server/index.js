//* server/index.js (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "pg";

// PostgreSQL
const { Pool } = pkg;

// .env desde /server/.env sin importar cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ Falta OPENROUTER_API_KEY en server/.env");
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

const app = express();


// logger simple
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Middlewares base
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);

// --- Auth simple de ejemplo ---
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    const result = await pool.query(
      `INSERT INTO users (nombre, apellido, email, password, rol)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, nombre, apellido, email, rol, fecha_creacion`,
      [nombre, apellido, email, password, "usuario"]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "El email ya existe" });
    }
    return res.status(500).json({ error: "Error al crear usuario" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    const result = await pool.query(
      "SELECT id, nombre, apellido, email FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// --- Chat: devuelve SIEMPRE { content: string } ---
app.post("/api/chat", async (req, res) => {
  try {
    let { messages, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Faltan messages" });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY no configurada" });
    }

    // Evita modelos ":free" (suelen gatillar 429). Usa tu preferido.
    const preferredModel = (model || "deepseek/deepseek-chat-v3.1").replace(/:free$/i, "");

    const baseHeaders = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:5173",
      "X-Title": process.env.SITE_NAME || "ComplementAI",
    };

    async function callOpenRouter(modelToUse) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          model: modelToUse,
          messages,
          temperature: 0.2,
        }),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { ok: r.ok, status: r.status, text, json, headers: r.headers };
    }

    // 1) Intento con el modelo preferido (sin :free)
    let resp = await callOpenRouter(preferredModel);

    // 1.a) Si 404 por data policy, reintenta con auto
    const policy404 =
      resp.status === 404 &&
      typeof resp.text === "string" &&
      resp.text.toLowerCase().includes("no endpoints found matching your data policy");
    if (policy404) {
      console.warn("[OpenRouter] 404 por data policy -> openrouter/auto");
      resp = await callOpenRouter("openrouter/auto");
    }

    // 1.b) Si 429, propaga con detalle
    if (resp.status === 429) {
      const msg = resp.json?.error?.message || resp.text || "Rate limit (429)";
      const reset = resp.headers?.get?.("x-ratelimit-reset-requests") || "";
      return res.status(429).json({
        error: `Límite de solicitudes alcanzado. ${msg}`,
        retry_after: reset,
      });
    }

    // 2) Si falla, intenta una vez con openrouter/auto
    if (!resp.ok) {
      console.warn("[OpenRouter] fallo con modelo. Probando openrouter/auto…");
      const alt = await callOpenRouter("openrouter/auto");

      if (alt.status === 429) {
        const msg = alt.json?.error?.message || alt.text || "Rate limit (429)";
        return res.status(429).json({ error: `Límite de solicitudes alcanzado. ${msg}` });
      }
      if (!alt.ok) {
        return res.status(alt.status).json({
          error: alt.json?.error?.message || alt.text || "Upstream error",
        });
      }

      const contentAlt = alt.json?.choices?.[0]?.message?.content;
      if (!contentAlt || !contentAlt.trim()) {
        return res.status(502).json({ error: "El modelo devolvió una respuesta vacía (alt)" });
      }
      return res.json({ content: contentAlt });
    }

    // 3) OK principal
    const content = resp.json?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      return res.status(502).json({ error: "El modelo devolvió una respuesta vacía" });
    }
    return res.json({ content });
  } catch (err) {
    console.error("ERR /api/chat", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// pequeño healthcheck opcional
app.get("/api/ping", (_, res) => res.json({ ok: true }));

app.listen(PORT, () =>
  console.log("✅ API running on http://localhost:" + PORT)
);
