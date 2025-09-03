export async function chat(messages, model = "deepseek/deepseek-chat-v3.1:free") {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model }),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(text);
    }
    const data = await r.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }
