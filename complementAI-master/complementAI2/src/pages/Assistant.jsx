import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chat } from "../services/chat";
import { updateTheme } from "../services/auth";
import AuthButton from "../components/AuthButton";
import { useAuth } from "../contexts/AuthContext";
import "./assistant.css";

/* ===============================
   Persistencia (localStorage)
   =============================== */
const LS_THREADS = "asst_threads_v1";
const now = () => Date.now();

const seedThread = () => ({
  id: String(now()),
  title: "Nueva conversación",
  createdAt: now(),
  messages: [
    {
      id: 1,
      role: "assistant",
      text: "Asistente listo ✅ — Assistant Lite",
      ts: now(),
    },
  ],
});

/* ===============================
   HERO (landing) estilo DeepSeek
   =============================== */
function EmptyHero({ value, setValue, onSend }) {
  return (
    <div className="hero-shell">
      <div className="hero-logo" aria-hidden>
        🜲
      </div>
      <h1 className="hero-title">How can I help you?</h1>

      <div className="hero-composer">
        <textarea
          className="hero-input"
          rows={2}
          placeholder="Message Assistant"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="hero-actions">
          <button className="hero-icon" title="Adjuntar">
            📎
          </button>
          <button className="hero-send" onClick={onSend} title="Enviar">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Página principal
   =============================== */
export default function AssistantPage() {
  const { user, token } = useAuth();

  //clave de almacenamiento por usuario o guest
  const STORAGE_KEY = `asst_threads_v1_${user?.id || "guest"}`;

  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("asst_theme") || "ink"
  );
  useEffect(() => localStorage.setItem("asst_theme", theme), [theme]);

  /** ---------- UI ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  /** ---------- Hilos / historial ---------- */
  const [threads, setThreads] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return saved.length ? saved : [seedThread()];
  });
  const [currentId, setCurrentId] = useState(threads[0].id);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const current = threads.find((t) => t.id === currentId) || threads[0];
  const [messages, setMessages] = useState(current.messages);

  /** refs para auto-scroll */
  const endRef = useRef(null);

  /** ¿hay mensajes de usuario en el hilo? */
  const hasUserMsgs = messages.some((m) => m.role === "user");

  // cuando cambia el usuario (o pasa de guest→logueado), re-carga su propio historial
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setThreads(saved.length ? saved : [seedThread()]);
  }, [STORAGE_KEY]);

  // persiste usando la nueva clave por usuario
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads, STORAGE_KEY]);

  /** re-sincroniza mensajes cuando cambia el hilo activo */
  useEffect(() => {
    setMessages(current.messages || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  /** persiste hilos en localStorage */
  useEffect(() => {
    localStorage.setItem(LS_THREADS, JSON.stringify(threads));
  }, [threads]);

  /** propaga cambios de mensajes al hilo actual */
  useEffect(() => {
    setThreads((prev) =>
      prev.map((t) => (t.id === currentId ? { ...t, messages } : t))
    );
  }, [messages, currentId]);

  /** auto-scroll cuando cambian mensajes o loading */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  /** título inteligente desde el primer mensaje del usuario */
  function smartTitleFrom(text) {
    const oneLine = text.replace(/\s+/g, " ").trim();
    const first = oneLine.split(/[.!?]|$/)[0].trim();
    return (first || oneLine).slice(0, 60) || "Sin título";
  }

  /** enviar mensaje */
  async function handleSend() {
    setErrMsg("");
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: now(), role: "user", text, ts: now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const responseText = await chat([
        {
          role: "system",
          content: "You are ComplementAI, an assistant for project management.",
        },
        { role: "user", content: text },
      ]);
      const aiMsg = {
        id: now() + 1,
        role: "assistant",
        text: responseText,
        ts: now(),
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || "Error al obtener respuesta del asistente");
    } finally {
      setLoading(false);
    }

    // Renombrar hilo si es el primer mensaje del usuario
    const isFirstUserMsg = !messages.some((m) => m.role === "user");
    if (isFirstUserMsg) {
      const newTitle = smartTitleFrom(text);
      setThreads((prev) =>
        prev.map((t) => (t.id === currentId ? { ...t, title: newTitle } : t))
      );
    }
  }

  /** ---------- acciones del historial ---------- */
  function newThread() {
    const t = seedThread();
    setThreads([t, ...threads]);
    setCurrentId(t.id);
    setMessages(t.messages);
  }

  function selectThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    setCurrentId(id);
    setMenuOpenId(null);
    setEditingId(null);
  }

  function deleteThread(id) {
    const next = threads.filter((t) => t.id !== id);
    if (!next.length) {
      const t = seedThread();
      setThreads([t]);
      setCurrentId(t.id);
      setMessages(t.messages);
      return;
    }
    setThreads(next);
    const fallback =
      id === currentId
        ? next[0]
        : next.find((t) => t.id === currentId) || next[0];
    setCurrentId(fallback.id);
    setMessages(fallback.messages);
  }

  function renameThread(id, title) {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title: title.trim() || "Sin título" } : t
      )
    );
  }

  /** ---------- render ---------- */
  return (
    <main
      className={`assistant-screen ${sidebarOpen ? "" : "is-collapsed"}`}
      data-theme={theme}
    >
      {/* Appbar */}
      <div className="asst-appbar">
        <div
          className="asst-appbar-left"
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <button
            className="asst-appbar-icon"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            style={{
              border: 0,
              borderRadius: 12,
              background: "rgba(255,255,255,.12)",
              color: "#fff",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ☰
          </button>
          <div className="asst-appbar-title">📁 Asistente de Proyectos</div>
        </div>

        <div
          className="asst-appbar-actions"
          style={{ display: "flex", gap: 8 }}
        >
          <button
            className="asst-appbar-btn"
            onClick={() =>
              token
                ? navigate("/wizard")
                : navigate("/login", {
                    state: { from: { pathname: "/Wizard" } },
                  })
            }
          >
            Wizard
          </button>
          <button
            className="asst-appbar-btn"
            onClick={() =>
              token
                ? navigate("/dashboard")
                : navigate("/login", {
                    state: { from: { pathname: "/DashBoard" } },
                  })
            }
          >
            Dashboard
          </button>
          <button
            className="asst-appbar-btn"
            onClick={() => setTheme(theme === "ink" ? "plum" : "ink")}
          >
            {theme === "ink" ? "🌸 Plum" : "🩵 Ink"}
          </button>
          <AuthButton logoutRedirectTo="/login" />
        </div>
      </div>

      {/* Layout: sidebar + chat */}
      <div className="asst-wrap">
        {/* Sidebar */}
        <aside className="asst-side">
          <div className="asst-card">
            <div className="asst-side-title">Acciones</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="asst-btn primary" onClick={newThread}>
                + Nuevo chat
              </button>
              <button
                className="asst-btn"
                onClick={() => alert("Exporta historial aquí")}
              >
                Exportar
              </button>
            </div>

            <div className="asst-side-title" style={{ marginTop: 6 }}>
              Historial
            </div>
            <div className="asst-thread-list">
              {threads.map((t) => {
                const active = t.id === currentId;
                const editing = editingId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`asst-thread ${active ? "active" : ""}`}
                    onMouseLeave={() =>
                      setMenuOpenId((id) => (id === t.id ? null : id))
                    }
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.05)",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      className="asst-thread-main"
                      onClick={() => selectThread(t.id)}
                      style={{ minWidth: 0, cursor: "pointer" }}
                    >
                      {editing ? (
                        <input
                          autoFocus
                          className="asst-thread-edit"
                          defaultValue={t.title}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameThread(t.id, e.currentTarget.value);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={(e) => {
                            renameThread(t.id, e.currentTarget.value);
                            setEditingId(null);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,.18)",
                            background: "#111318",
                            color: "#eaeaea",
                          }}
                        />
                      ) : (
                        <>
                          <div
                            className="asst-thread-title"
                            title={t.title}
                            style={{
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.title || "Sin título"}
                          </div>
                          <div
                            className="asst-thread-sub"
                            style={{ fontSize: 12, opacity: 0.7 }}
                          >
                            {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                            {t.messages?.length || 0} msgs
                          </div>
                        </>
                      )}
                    </div>

                    {/* Kebab */}
                    <div
                      className="asst-thread-kebab"
                      style={{ position: "relative" }}
                    >
                      <button
                        className="asst-kebab-btn"
                        onMouseEnter={() => setMenuOpenId(t.id)}
                        onClick={() =>
                          setMenuOpenId((id) => (id === t.id ? null : t.id))
                        }
                        aria-label="Opciones"
                        title="Opciones"
                        style={{
                          border: "1px solid rgba(255,255,255,.18)",
                          background: "transparent",
                          color: "#e5e7eb",
                          borderRadius: 8,
                          padding: "2px 6px",
                          cursor: "pointer",
                        }}
                      >
                        ⋯
                      </button>

                      {menuOpenId === t.id && (
                        <div
                          className="asst-kebab-menu"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "110%",
                            background: "#15151a",
                            border: "1px solid rgba(255,255,255,.12)",
                            borderRadius: 10,
                            padding: 8,
                            display: "grid",
                            gap: 6,
                            zIndex: 5,
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setMenuOpenId(null);
                            }}
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "#eaeaea",
                              textAlign: "left",
                              padding: "6px 8px",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                          >
                            Renombrar
                          </button>
                          <button
                            className="danger"
                            onClick={() => deleteThread(t.id)}
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "#ef4444",
                              textAlign: "left",
                              padding: "6px 8px",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="asst-side-title" style={{ marginTop: 12 }}>
              Contexto
            </div>
            <label className="asst-label">Marco</label>
            <select className="asst-select" defaultValue="PMBOK®">
              <option>PMBOK®</option>
              <option>ISO 21502</option>
              <option>Scrum</option>
            </select>

            <label className="asst-label">Industria</label>
            <input className="asst-input" placeholder="Salud, Retail, Banca…" />
          </div>
        </aside>

        {/* Chat */}
        <section className="asst-chat">
          {!hasUserMsgs ? (
            <EmptyHero value={input} setValue={setInput} onSend={handleSend} />
          ) : (
            <>
              <div className="assistant-chat">
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  const meta = `${isUser ? "Tú" : "Asistente"} • ${new Date(
                    m.ts
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                  return (
                    <div
                      key={m.id}
                      className={`asst-row ${isUser ? "me" : "ai"}`}
                    >
                      {!isUser && <div className="asst-avatar" aria-hidden />}
                      <div className={`asst-block ${isUser ? "me" : "ai"}`}>
                        <div className="asst-meta">{meta}</div>
                        <div className="asst-content">{m.text}</div>
                      </div>
                      {isUser && <div className="asst-avatar me" aria-hidden />}
                    </div>
                  );
                })}
                {loading && (
                  <div className="asst-row ai">
                    <div className="asst-avatar" aria-hidden />
                    <div className="asst-block ai">
                      <div className="asst-meta">Asistente • …</div>
                      <div className="asst-content">Pensando…</div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {errMsg && <div className="asst-error">{errMsg}</div>}

              <div className="asst-composer">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje…"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button onClick={handleSend} disabled={loading}>
                  {loading ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
