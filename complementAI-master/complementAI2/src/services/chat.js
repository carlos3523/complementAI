// src/services/chat.js
const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_URL) ||
  "http://localhost:8787"; // 👈 Cambia aquí si tu server NO está en 8787

export async function chat(messages, model = "deepseek/deepseek-chat-v3.1") {
  const url = `${API_BASE.replace(/\/$/, "")}/api/chat`;
  console.log("[chat] POST", url); // 👈 verás a dónde está pegando

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  });

  if (!r.ok) {
    // intenta json; si no, texto
    try {
      const err = await r.json();
      console.error("[chat] error JSON:", err);
      throw new Error(err?.error || `Error HTTP ${r.status}`);
    } catch {
      const txt = await r.text().catch(() => "");
      console.error("[chat] error TEXT:", txt);
      throw new Error(txt || `Error HTTP ${r.status}`);
    }
  }

  const data = await r.json();
  const content = data?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Respuesta del servidor inválida");
  }
  return content;
}
