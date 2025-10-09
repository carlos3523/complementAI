// server/index.js (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import the pg library to connect to PostgreSQL
import pkg from "pg";

// extract Pool from pg (ESM style)
const { Pool } = pkg;

// 👇 asegura que cargue server/.env sin importar desde dónde ejecutes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ Falta OPENROUTER_API_KEY en server/.env");
}

// configure a pool of connections to PostgreSQL using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.SITE_URL || "http://localhost:5173" }));

// endpoint to register a new user
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    // insert user into the database
    // incluimos el rol para que por defecto sea "usuario"
    // y dejamos que la columna fecha_creacion se establezca mediante el valor por defecto en la base
    const result = await pool.query(
      "INSERT INTO users (nombre, apellido, email, password, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, apellido, email, rol, fecha_creacion",
      [nombre, apellido, email, password, "usuario"]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    // si hay violación de clave única (email duplicado), error code "23505"
    if (err.code === "23505") {
      return res.status(409).json({ error: "El email ya existe" });
    }
    return res.status(500).json({ error: "Error al crear usuario" });
  }
});

// endpoint to iniciar sesión
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

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "deepseek/deepseek-chat-v3.1:free" } = req.body;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "",
        "X-Title": process.env.SITE_NAME || "ComplementAI",
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenRouter error", r.status, text);
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log("✅ API running on http://localhost:" + PORT));