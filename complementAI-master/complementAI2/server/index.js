// server/index.js (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 👇 asegura que cargue server/.env sin importar desde dónde ejecutes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ Falta OPENROUTER_API_KEY en server/.env");
}

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.SITE_URL || "http://localhost:5173" }));

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