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

const app = express();

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

    // Reemplázalo con la llamada a OpenRouter que ya tienes en tu otro server.
    return res.json({ content: "Chat OK (simulado desde src/index.js)" });
  } catch (err) {
    console.error("ERR /api/chat", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   Debug user
   ========================= */
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
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`🚀 API escuchando en http://localhost:${port}`);
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