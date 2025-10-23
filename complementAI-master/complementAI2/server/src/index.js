// server/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { auth } from "./routes/auth.js"; // debe exportar: export const auth = Router()
import { projects } from "./routes/projects.js"; // idem
import { requireAuth } from "./middleware/auth.js";

import { query } from "./sql/db.js"; // si tu archivo está en src/db/db.js usa: "../src/db/db.js" o "./db/db.js"

const app = express();

// Middlewares base
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Rutas principales
app.use("/api/auth", auth);
app.use("/api/projects", requireAuth, projects);

// Preferencia de tema
app.patch("/api/user/theme", requireAuth, async (req, res) => {
  try {
    const { theme } = req.body || {};
    if (!["ink", "plum"].includes(theme)) {
      return res.status(400).json({ error: "tema inválido" });
    }
    const { rows } = await query(
      `UPDATE users
       SET theme=$1
       WHERE id=$2
       RETURNING id, email, first_name, last_name, theme`,
      [theme, req.user.id]
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo actualizar el tema" });
  }
});

// Datos del usuario
app.get("/api/user/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, first_name, last_name, theme, created_at
       FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo obtener el usuario" });
  }
});

// 404 genérico
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Arranque
const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`API escuchando en http://localhost:${port}`)
);

//Manejador global de errores - no se quedara el server esperando reiniciar sin contexto si se rompe algo
app.use((err, _req, res, _next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ error: "Error interno" });
});
