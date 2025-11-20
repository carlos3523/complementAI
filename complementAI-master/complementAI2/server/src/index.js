// server/src/index.js
// Servidor principal estable y compatible con Webpay
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Importación segura de módulos (NO aborta el servidor)
import { auth } from "./routes/auth.js";
import { projects } from "./routes/projects.js";
import { payments } from "./routes/payments.js";
import { query, pool } from "./sql/db.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

const rawModel = process.env.DEFAULT_MODEL || "deepseek/deepseek-chat-v3.1";

/* =========================
   Middlewares base
   ========================= */
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  })
);
app.options("*", cors());

/* =========================
   Rutas base
   ========================= */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* =========================
   Rutas principales existentes
   ========================= */
app.use("/api/auth", auth);
app.use("/api/projects", requireAuth, projects);

// Auth
if (auth) app.use("/api/auth", auth);
else console.warn("⚠️ /api/auth no cargó.");

// Projects
if (projects) app.use("/api/projects", projects);
else console.warn("⚠️ /api/projects no cargó.");

// Payments (Webpay)
if (payments) {
  app.use("/api/payments", payments);
  console.log("✅ /api/payments registrado y activo");
} else {
  console.warn("⚠️ /api/payments deshabilitado");
}

/* =========================
   Chat (simulado)
   ========================= */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Faltan messages" });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY no configurada" });
    }


        // Modelo por defecto y sin sufijo :free (reduce 429)
    const model = (rawModel || "deepseek/deepseek-chat-v3.1").replace(/:free$/i, "");

    // Helper: fetch con timeout (30s)
    async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...opts, signal: controller.signal });
      } finally {
        clearTimeout(id);
      }
    }

    async function callOpenRouter(modelToUse) {
      const r = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:5173",
          "X-Title": process.env.SITE_NAME || "ComplementAI",
        },
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

    // 1) Intento con el modelo preferido
    let resp = await callOpenRouter(model);

    // 1.a) 404 por data policy -> fallback a auto
    const policy404 =
      resp.status === 404 &&
      typeof resp.text === "string" &&
      resp.text.toLowerCase().includes("no endpoints found matching your data policy");
    if (policy404) {
      resp = await callOpenRouter("openrouter/auto");
    }

    // 1.b) 429 -> propagar claramente
    if (resp.status === 429) {
      const msg = resp.json?.error?.message || resp.text || "Rate limit (429)";
      const h = resp.headers;
      return res
        .status(429)
        .set({
          "x-ratelimit-remaining-requests": h?.get?.("x-ratelimit-remaining-requests") || "",
          "x-ratelimit-reset-requests": h?.get?.("x-ratelimit-reset-requests") || "",
        })
        .json({ error: `Límite de solicitudes alcanzado. ${msg}` });
    }

    // 2) Si falla, un intento más con auto
    if (!resp.ok) {
      const alt = await callOpenRouter("openrouter/auto");

      if (alt.status === 429) {
        const msg = alt.json?.error?.message || alt.text || "Rate limit (429)";
        const h2 = alt.headers;
        return res
          .status(429)
          .set({
            "x-ratelimit-remaining-requests": h2?.get?.("x-ratelimit-remaining-requests") || "",
            "x-ratelimit-reset-requests": h2?.get?.("x-ratelimit-reset-requests") || "",
          })
          .json({ error: `Límite de solicitudes alcanzado. ${msg}` });
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

    // Reemplázalo con la llamada a OpenRouter que ya tienes en tu otro server.
    return res.json({ content: "Chat OK (simulado desde src/index.js)" });
  } catch (err) {
    console.error("ERR /api/chat", err);
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "Timeout al consultar el modelo (504)" });
    }
    return res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   Debug user
   ========================= */

app.get("/api/user/me", requireAuth, async (req, res) => {
  try {
    // Primero por id que viene en el token
    let rs = await query(
      `select id, email, first_name, last_name, theme, created_at
       from users
       where id=$1`,
      [req.user.id]
    );

    // Fallback por email (por si tienes datos antiguos con ids distintos)
    if (!rs.rows[0] && req.user.email) {
      console.warn("[/api/user/me] id no encontrado, probando por email:", req.user.email);
      rs = await query(
        `select id, email, first_name, last_name, theme, created_at
         from users
         where email=$1`,
        [req.user.email]
      );
    }

    if (!rs.rows[0]) return res.sendStatus(404);
    return res.json(rs.rows[0]);
  } catch (e) {
    console.error("[/api/user/me]", e);
    return res.status(500).json({ error: "No se pudo obtener el usuario" });
  }
});
   
app.get("/api/debug/whoami", (_req, res) => {
  res.json({ message: "Implementa requireAuth aquí si deseas" });
});

/* =========================
   404 y errores
   ========================= */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ error: "Error interno" });
});

/* =========================
   Arranque del servidor
   ========================= */
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});

/* =========================
   Apagado limpio
   ========================= */
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor…");
  await pool.end().catch(() => {});
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Cerrando servidor…");
  await pool.end().catch(() => {});
  process.exit(0);
});

// Add debugging logs for better traceability
console.log("Starting server with the following environment variables:");
console.log(`PORT: ${process.env.PORT}`);
console.log(`CLIENT_ORIGIN: ${process.env.CLIENT_ORIGIN}`);
console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? "[REDACTED]" : "Not Set"}`);
console.log(`DEFAULT_MODEL: ${rawModel}`);

// Ensure all required environment variables are set
if (!process.env.OPENROUTER_API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY is not set. The server may not function correctly.");
}
if (!process.env.CLIENT_ORIGIN) {
  console.warn("WARNING: CLIENT_ORIGIN is not set. Defaulting to http://localhost:5173.");
}