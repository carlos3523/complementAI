import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chat } from "../services/chat";
import { updateTheme } from "../services/auth";
import AuthButton from "../components/AuthButton";
import { useAuth } from "../contexts/AuthContext";
import "./assistant.css";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../i18n/translations";

/* ===============================
    Persistencia (localStorage)
    =============================== */
const LS_THREADS = "asst_threads_v1";
const now = () => Date.now();

// --- Función auxiliar (copiada de AuthButton para cargar preferencias)
function loadAssistantPrefs() {
  const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
  return {
    assistantStyle: savedPrefs.style || "detallado",
    showEmojis: savedPrefs.emojis ?? true,
    showTimestamps: savedPrefs.timestamps ?? true,
    autoScroll: savedPrefs.autoscroll ?? true, // 👈 Carga la preferencia de auto-scroll
    language: savedPrefs.language || "es",
    fontSize: savedPrefs.fontSize || "medium",
  };
}
// ---

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
    HERO (landing)
    =============================== */
function EmptyHero({ value, setValue, onSend, fontSizeClass }) {
  const { language } = useLanguage();
  const t = translations[language];
  

  return (
    <div className="hero-shell">
      <div className="hero-logo" aria-hidden>
        🜲
      </div>
      <h1 className="hero-title">{t.heroTitle}</h1>

      <div className="hero-composer" data-font-size={fontSizeClass}>
        <textarea
          className="hero-input"
          rows={2}
          placeholder={t.writeMessage}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
              return;
            }

            // Tab y Shift+Tab
            if (e.key === "Tab") {
              e.preventDefault();
              const { selectionStart, selectionEnd, value } = e.target;
              const before = value.substring(0, selectionStart);
              const after = value.substring(selectionEnd);

              if (e.shiftKey) {
                if (before.endsWith("  ")) {
                  e.target.value = before.slice(0, -2) + after;
                  e.target.selectionStart = e.target.selectionEnd = selectionStart - 2;
                }
              } else {
                e.target.value = before + "  " + after;
                e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
              }

              // Mantener sincronizado el estado
              const event = new Event("input", { bubbles: true });
              e.target.dispatchEvent(event);
            }
          }}
        />

        <div className="hero-actions">
          <button className="hero-icon" title={t.attach}>
            📎
          </button>
          <button className="hero-send" onClick={onSend} title={t.send}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

  function SpeechButton({ message, speak, synthRef }) {
    // Usamos el ID del mensaje para saber qué mensaje se está reproduciendo.
    // Esto asegura que solo el botón del mensaje activo sepa su estado.
    const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

    const handleSpeak = () => {
        if (!isSpeakingLocal) {
            // Detenemos cualquier reproducción anterior antes de empezar una nueva.
            // Esto es crucial para que el botón se reactive.
            synthRef.current.cancel(); 

            const utter = new SpeechSynthesisUtterance(message.text);
            utter.lang = window.navigator.language || 'es-ES';
            utter.rate = 1;
            utter.pitch = 1;
            
            // 💡 Cuando empieza a hablar, actualiza el estado local
            utter.onstart = () => setIsSpeakingLocal(true); 
            
            // 💡 Cuando termina o es cancelado, actualiza el estado local
            utter.onend = () => setIsSpeakingLocal(false); 
            utter.onpause = () => setIsSpeakingLocal(false);
            utter.onresume = () => setIsSpeakingLocal(true);
            
            synthRef.current.speak(utter);
        } else {
            // Si ya está hablando (isSpeakingLocal es true), cancela
            synthRef.current.cancel();
            setIsSpeakingLocal(false);
        }
    };

    return (
        <button
            className="asst-speak-btn"
            onClick={handleSpeak}
            title={isSpeakingLocal ? "Detener voz" : "Reproducir voz"}
            // El botón ya no se deshabilita globalmente
            style={{ 
                marginLeft: '10px', 
                fontSize: '1.2em', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'currentColor', // Hereda el color del texto
                opacity: isSpeakingLocal ? 1 : 0.6 // Pequeño estilo para indicar estado
            }}
        >
            {isSpeakingLocal ? "⏹️" : "🔊"}
        </button>
    );
}

/* ===============================
    Página principal
    =============================== */
export default function AssistantPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const STORAGE_KEY = `asst_threads_v1_${user?.id || "guest"}`;
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("asst_theme") || "ink"
  );
  useEffect(() => localStorage.setItem("asst_theme", theme), [theme]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [threads, setThreads] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return saved.length ? saved : [seedThread()];
  });
  const [currentId, setCurrentId] = useState(threads[0].id);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [fontSize, setFontSize] = useState("medium");
  const [showTimestamps, setShowTimestamps] = useState(true); 
  const [autoScroll, setAutoScroll] = useState(true); // 👈 NUEVO ESTADO para auto-scroll

  const current = threads.find((t) => t.id === currentId) || threads[0];
  const [messages, setMessages] = useState(current.messages);
  const endRef = useRef(null);

  const hasUserMsgs = messages.some((m) => m.role === "user");

  // FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DESDE AUTHBUTTON
  function refreshConfig() {
    const prefs = loadAssistantPrefs();
    setFontSize(prefs.fontSize);
    setShowTimestamps(prefs.showTimestamps);
    setAutoScroll(prefs.autoScroll); // 👈 Actualiza el estado de auto-scroll
  }

  // Cargar configuración inicial
  useEffect(() => {
    refreshConfig();
  }, []);


  /* ===============================
      VOZ: Lectura y reconocimiento
      =============================== */
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === "es" ? "es-ES" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta reconocimiento de voz 😢");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === "es" ? "es-ES" : "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    synthRef.current.cancel();
    synthRef.current.speak(utter);
  };

  /* ===============================
      Persistencia e interacciones
      =============================== */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setThreads(saved.length ? saved : [seedThread()]);
  }, [STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads, STORAGE_KEY]);

  useEffect(() => {
    setMessages(current.messages || []);
  }, [currentId]);

  useEffect(() => {
    setThreads((prev) =>
      prev.map((t) => (t.id === currentId ? { ...t, messages } : t))
    );
  }, [messages, currentId]);

  // 👈 USO CONDICIONAL DEL AUTO-SCROLL
  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, autoScroll]); // Depende de messages, loading y autoScroll

  function smartTitleFrom(text) {
    const oneLine = text.replace(/\s+/g, " ").trim();
    const first = oneLine.split(/[.!?]|$/)[0].trim();
    return (first || oneLine).slice(0, 60) || t.untitled;
  }

  async function handleSend() {
    setErrMsg("");
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: now(), role: "user", text, ts: now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Usar el historial de conversación para dar contexto
      const conversationHistory = current.messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const responseText = await chat([
        { role: "system", content: "You are ComplementAI, a project assistant." },
        ...conversationHistory.slice(1), 
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
      setErrMsg(err.message || t.errorResponse);
    } finally {
      setLoading(false);
    }

    const isFirstUserMsg = !messages.some((m) => m.role === "user");
    if (isFirstUserMsg) {
      const newTitle = smartTitleFrom(text);
      setThreads((prev) =>
        prev.map((t) => (t.id === currentId ? { ...t, title: newTitle } : t))
      );
    }
  }

  function newThread() {
    const t0 = seedThread();
    setThreads([t0, ...threads]);
    setCurrentId(t0.id);
    setMessages(t0.messages);
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
      const t0 = seedThread();
      setThreads([t0]);
      setCurrentId(t0.id);
      setMessages(t0.messages);
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
        t.id === id ? { ...t, title: title.trim() || t.untitled } : t
      )
    );
  }

  /* ===============================
      Render principal
      =============================== */
  return (
    <main
      className={`assistant-screen ${sidebarOpen ? "" : "is-collapsed"}`}
      data-theme={theme}
      data-font-size={fontSize} 
    >
      {/* Appbar */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <button
            className="asst-appbar-icon"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? t.hidePanel : t.showPanel}
          >
            ☰
          </button>
          <div className="asst-appbar-title">📁 {t.projectAssistant}</div>
        </div>

        <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
          <button
            className="asst-appbar-btn"
            onClick={() =>
              token
                ? navigate("/wizard")
                : navigate("/login", { state: { from: { pathname: "/Wizard" } } })
            }
          >
            Wizard
          </button>
          <button
            className="asst-appbar-btn"
            onClick={() =>
              token
                ? navigate("/dashboard")
                : navigate("/login", { state: { from: { pathname: "/DashBoard" } } })
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
          <AuthButton logoutRedirectTo="/login" refreshConfig={refreshConfig} />
        </div>
      </div>

      {/* Layout */}
      <div className="asst-wrap">
        {/* Sidebar */}
        <aside className="asst-side">
          <div className="asst-card">
            <div className="asst-side-title">{t.actions}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="asst-btn primary" onClick={newThread}>
                + {t.newChat}
              </button>
              <button
                className="asst-btn"
                onClick={() => alert("Exporta historial aquí")}
              >
                {t.export}
              </button>
              <button
                className="asst-btn"
                onClick={() =>
                  token
                    ? navigate("/Progreso")
                    : navigate("/login", { state: { from: { pathname: "/Progreso" } } })
                }
              >
                {t.progress || "Progreso"}
              </button>
            </div>

            <div className="asst-side-title" style={{ marginTop: 6 }}>
              {t.history}
            </div>
            <div className="asst-thread-list">
              {threads.map((t0) => {
                const active = t0.id === currentId;
                const editing = editingId === t0.id;
                return (
                  <div
                    key={t0.id}
                    className={`asst-thread ${active ? "active" : ""}`}
                    onMouseLeave={() =>
                      setMenuOpenId((id) => (id === t0.id ? null : id))
                    }
                  >
                    <div
                      className="asst-thread-main"
                      onClick={() => selectThread(t0.id)}
                      style={{ minWidth: 0, cursor: "pointer" }}
                    >
                      {editing ? (
                        <input
                          autoFocus
                          className="asst-thread-edit"
                          defaultValue={t0.title}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameThread(t0.id, e.currentTarget.value);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={(e) => {
                            renameThread(t0.id, e.currentTarget.value);
                            setEditingId(null);
                          }}
                        />
                      ) : (
                        <>
                          <div className="asst-thread-title" title={t0.title}>
                            {t0.title || t.untitled}
                          </div>
                          <div className="asst-thread-sub">
                            {new Date(t0.createdAt).toLocaleDateString()} ·{" "}
                            {t0.messages?.length || 0} msgs
                          </div>
                        </>
                      )}
                    </div>

                    <div className="asst-thread-kebab">
                      <button
                        className="asst-kebab-btn"
                        onMouseEnter={() => setMenuOpenId(t0.id)}
                        onClick={() =>
                          setMenuOpenId((id) => (id === t0.id ? null : t0.id))
                        }
                        aria-label={t.options}
                        title={t.options}
                      >
                        ⋯
                      </button>

                      {menuOpenId === t0.id && (
                        <div className="asst-kebab-menu">
                          <button
                            onClick={() => {
                              setEditingId(t0.id);
                              setMenuOpenId(null);
                            }}
                          >
                            {t.rename}
                          </button>
                          <button
                            className="danger"
                            onClick={() => deleteThread(t0.id)}
                          >
                            {t.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="asst-side-title" style={{ marginTop: 12 }}>
              {t.framework}
            </div>
            <select className="asst-select" defaultValue="PMBOK®">
              <option>PMBOK®</option>
              <option>ISO 21502</option>
              <option>Scrum</option>
            </select>

            <div className="asst-side-title" style={{ marginTop: 12 }}>
              {t.industry}
            </div>
            <input
              className="asst-input"
              placeholder="Salud, Retail, Banca…"
            />
          </div>
        </aside>

        {/* Chat */}
        <section className="asst-chat">
          {!hasUserMsgs ? (
            <EmptyHero value={input} setValue={setInput} onSend={handleSend} fontSizeClass={fontSize} />
          ) : (
            <>
              <div className="assistant-chat" data-font-size={fontSize}>
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  
                  // Lógica para incluir/excluir marca de tiempo
                  const timeString = showTimestamps
                    ? new Date(m.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  
                  // Crear la metadata condicionalmente
                  const meta = `${isUser ? "Tú" : t.projectAssistant}${
                    showTimestamps ? ` • ${timeString}` : ""
                  }`;

                  return (
                    <div
                      key={m.id}
                      className={`asst-row ${isUser ? "me" : "ai"}`}
                    >
                      {!isUser && <div className="asst-avatar" />}
                      <div className={`asst-block ${isUser ? "me" : "ai"}`}>
                        <div className="asst-meta">{meta}</div> 
                        <div className="asst-content">{m.text}</div>
                        {!isUser && <SpeechButton message={m} speak={speak} synthRef={synthRef} />}
                      </div>
                      {isUser && <div className="asst-avatar me" />}
                    </div>
                  );
                })}
                {loading && (
                  <div className="asst-row ai">
                    <div className="asst-avatar" />
                    <div className="asst-block ai">
                      <div className="asst-meta">{t.projectAssistant} • …</div>
                      <div className="asst-content">{t.thinking}</div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {errMsg && <div className="asst-error">{errMsg}</div>}

              {/* 🎤 Compositor con voz */}
              <div className="asst-composer" data-font-size={fontSize}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.writeMessage}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                      return;
                    }

                    // Tab y Shift+Tab
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const { selectionStart, selectionEnd, value } = e.target;
                      const before = value.substring(0, selectionStart);
                      const after = value.substring(end);

                      if (e.shiftKey) {
                        if (before.endsWith("  ")) {
                          e.target.value = before.slice(0, -2) + after;
                          e.target.selectionStart = e.target.selectionEnd = selectionStart - 2;
                        }
                      } else {
                        e.target.value = before + "  " + after;
                        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
                      }

                      const event = new Event("input", { bubbles: true });
                      e.target.dispatchEvent(event);
                    }
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <button onClick={toggleListening} title="Hablar">
                    {listening ? "🎙️ Grabando..." : "🎤"}
                  </button>
                  <button onClick={handleSend} disabled={loading}>
                    {loading ? t.sending : t.send}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}