// src/pages/Assistant.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { chat } from "../services/chat";
import { useLayoutEffect } from "react";
// --- KB mínimo de metodologías ---
const KB = {
  pmbok: {
    label: "PMBOK®",
    phases: [
      "Inicio",
      "Planificación",
      "Ejecución",
      "Monitoreo y Control",
      "Cierre",
    ],
    artifacts: {
      Inicio: [
        "Acta de Constitución",
        "Identificación de Stakeholders",
        "Caso de Negocio",
      ],
      Planificación: [
        "WBS/EDT",
        "Cronograma (Gantt)",
        "Presupuesto",
        "Plan de Riesgos",
        "Plan de Calidad",
        "Comunicaciones",
      ],
      Ejecución: ["Gestión de Cambios", "Reportes de Avance"],
      "Monitoreo y Control": [
        "EVM (PV, EV, AC)",
        "Seguimiento de Riesgos",
        "Control de Calidad",
      ],
      Cierre: ["Informe Final", "Lecciones Aprendidas"],
    },
    checks: {
      Inicio: [
        "Sponsor definido",
        "Objetivos SMART",
        "Stakeholders priorizados",
      ],
      Planificación: [
        "Línea base alcance-tiempo-costo",
        "Riesgos con respuesta",
        "Matriz RACI",
      ],
    },
  },
  iso21502: {
    label: "ISO 21502",
    phases: [
      "Inicio",
      "Planificación",
      "Ejecución",
      "Monitoreo y Control",
      "Cierre",
    ],
    artifacts: {
      Inicio: ["Mandato del Proyecto"],
      Planificación: [
        "Plan de Dirección",
        "Gestión de Beneficios",
        "Gestión de Interesados",
      ],
      Ejecución: ["Gestión de Recursos", "Adquisiciones"],
      "Monitoreo y Control": ["Revisión de Beneficios", "Aseguramiento"],
      Cierre: ["Transferencia Operacional"],
    },
    checks: {
      Planificación: [
        "Beneficios vinculados a estrategia",
        "Controles de calidad definidos",
      ],
    },
  },
  scrum: {
    label: "Scrum / Ágil",
    phases: ["Descubrimiento", "Ejecución Iterativa", "Cierre"],
    artifacts: {
      Descubrimiento: ["Visión de Producto", "Product Backlog"],
      "Ejecución Iterativa": ["Sprint Backlog", "Increment", "DoD/DoR"],
      Cierre: ["Release Notes", "Retro final"],
    },
    checks: {
      "Ejecución Iterativa": [
        "Ceremonias activas",
        "Backlog priorizado",
        "DoD aplicado",
      ],
    },
  },
};

const STATIC_SUGGESTIONS = [
  "Genera el Acta de Constitución",
  "Crea la WBS/EDT",
  "Propón cronograma inicial",
  "Arma el registro de riesgos",
  "Diseña la matriz RACI",
];

export default function AssistantPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("assistant_sidebar") === "collapsed"
  );
  useEffect(() => {
    localStorage.setItem(
      "assistant_sidebar",
      sidebarCollapsed ? "collapsed" : "open"
    );
  }, [sidebarCollapsed]);
  // Contexto
  const [standard, setStandard] = useState("pmbok");
  const [phase, setPhase] = useState(KB.pmbok.phases[1]); // Planificación
  const [industry, setIndustry] = useState("");

  // Chat estado
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Asistente listo ✅ — Assistant Lite",
      ts: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Historial (múltiples hilos)
  const [threads, setThreads] = useState([]); // [{id,title,createdAt,messages:[]}]
  const [currentThreadId, setCurrentThreadId] = useState(null);

  const kb = KB[standard];
  const artifacts = kb.artifacts[phase] || [];
  const checks = (kb.checks && kb.checks[phase]) || [];

  const navigate = useNavigate();
  const boxRef = useRef(null);
  const bottomRef = useRef(null);

  function openWizard() {
    const qs = new URLSearchParams({
      standard,
      phase,
      domain: industry || "",
    }).toString();
    navigate(`/wizard?${qs}`);
  }

  /* Auto-scroll cuando cambian mensajes o loading */
  useLayoutEffect(() => {
    // espera al siguiente frame para que el DOM pinte
    requestAnimationFrame(() => {
      if (bottomRef.current) bottomRef.current.scrollIntoView({ block: "end" });
      else if (boxRef.current)
        boxRef.current.scrollTop = boxRef.current.scrollHeight;
    });
  }, [messages, loading]);
  // Cargar sesión + historial
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("assistant_session") || "null"
    );
    if (saved) {
      setStandard(saved.standard ?? "pmbok");
      setPhase(saved.phase ?? KB.pmbok.phases[1]);
      setIndustry(saved.industry ?? "");
    }
    const storedThreads = JSON.parse(
      localStorage.getItem("assistant_threads") || "[]"
    );
    const storedCurrent = localStorage.getItem("assistant_current_thread");

    if (storedThreads.length) {
      setThreads(storedThreads);
      const t =
        storedThreads.find((x) => x.id === storedCurrent) || storedThreads[0];
      setCurrentThreadId(t.id);
      setMessages(t.messages);
    } else {
      const init = {
        id: String(Date.now()),
        title: "Nueva conversación",
        createdAt: Date.now(),
        messages: [
          {
            id: 1,
            role: "assistant",
            text: "Asistente listo ✅ — Assistant Lite",
            ts: Date.now(),
          },
        ],
      };
      setThreads([init]);
      setCurrentThreadId(init.id);
      setMessages(init.messages);
      localStorage.setItem("assistant_threads", JSON.stringify([init]));
      localStorage.setItem("assistant_current_thread", init.id);
    }
  }, []);

  // Guardar contexto ligero
  useEffect(() => {
    localStorage.setItem(
      "assistant_session",
      JSON.stringify({ standard, phase, industry })
    );
  }, [standard, phase, industry]);

  // Persistir mensajes dentro del hilo actual
  useEffect(() => {
    if (!currentThreadId) return;
    setThreads((prev) => {
      const copy = prev.map((t) =>
        t.id === currentThreadId ? { ...t, messages } : t
      );
      localStorage.setItem("assistant_threads", JSON.stringify(copy));
      return copy;
    });
  }, [messages, currentThreadId]);

  const dynamicSuggestions = useMemo(() => {
    const setx = new Set(STATIC_SUGGESTIONS);
    artifacts.slice(0, 3).forEach((a) => setx.add("Genera plantilla: " + a));
    return Array.from(setx).slice(0, 8);
  }, [artifacts]);

  // === Historial: utilidades ===
  function newThread() {
    const t = {
      id: String(Date.now()),
      title: "Nueva conversación",
      createdAt: Date.now(),
      messages: [
        {
          id: Date.now(),
          role: "assistant",
          text: "¡Nuevo chat! ¿En qué te ayudo?",
          ts: Date.now(),
        },
      ],
    };
    setThreads((prev) => {
      const next = [t, ...prev];
      localStorage.setItem("assistant_threads", JSON.stringify(next));
      return next;
    });
    setCurrentThreadId(t.id);
    setMessages(t.messages);
  }

  function selectThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    setCurrentThreadId(id);
    setMessages(t.messages);
  }

  function deleteThread(id) {
    const next = threads.filter((t) => t.id !== id);
    setThreads(next);
    localStorage.setItem("assistant_threads", JSON.stringify(next));
    if (next.length) {
      setCurrentThreadId(next[0].id);
      setMessages(next[0].messages);
    } else {
      newThread();
    }
  }

  function exportThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    const blob = new Blob([JSON.stringify(t, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assistant-thread-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Enviar a la IA via services/chat ---
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setErrMsg("");
    setLoading(true);

    // renombrar conversación si es nueva
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === currentThreadId &&
        (t.title === "Nueva conversación" || !t.title)
          ? { ...t, title: text.slice(0, 60) }
          : t
      );
      localStorage.setItem("assistant_threads", JSON.stringify(next));
      return next;
    });

    const systemPrompt = `Eres un asistente experto en gestión de proyectos.
Responde SIEMPRE en Markdown, compacto y accionable.`;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));

    const payload = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: text },
    ];

    // “Pensando…”
    const thinking = {
      id: Date.now() + 1,
      role: "assistant",
      text: "Pensando…",
      ts: Date.now(),
      thinking: true,
    };
    setMessages((m) => [...m, thinking]);

    try {
      const content = await chat(payload); // llama a tu /api/chat
      setMessages((m) =>
        m.map((mm) =>
          mm.thinking ? { ...mm, thinking: false, text: content || "…" } : mm
        )
      );
    } catch (e) {
      console.error(e);
      setErrMsg("Ocurrió un error consultando a la IA. Intenta de nuevo.");
      setMessages((m) =>
        m.map((mm) =>
          mm.thinking
            ? {
                ...mm,
                thinking: false,
                text: "⚠️ No pude consultar a la IA ahora. ¿Quieres reintentar?",
              }
            : mm
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 🎯 Render de cada burbuja
  const ChatMessage = ({ m }) => {
    const isUser = m.role === "user";
    const meta = `${isUser ? "Tú" : "Asistente"} • ${formatTime(
      m.ts || Date.now()
    )}`;
    return (
      <div className={`msg-row ${isUser ? "right" : "left"}`}>
        {!isUser && <div className="avatar" aria-hidden />}
        <div className={`bubble ${isUser ? "user" : "assistant"}`}>
          <div className="bubble-meta">
            <span className="who">{meta}</span>
          </div>
          <div className={`bubble-text ${m.thinking ? "muted" : ""} markdown`}>
            {String(m.text || "")}
          </div>
        </div>
        {isUser && <div className="avatar user" aria-hidden />}
      </div>
    );
  };

  const kbPanel = (
    <div className="panel">
      <div className="side-title">Contexto</div>

      <label className="label">Marco de trabajo</label>
      <select
        value={standard}
        onChange={(e) => {
          setStandard(e.target.value);
          setPhase(KB[e.target.value].phases[0]);
        }}
      >
        <option value="pmbok">{KB.pmbok.label}</option>
        <option value="iso21502">{KB.iso21502.label}</option>
        <option value="scrum">{KB.scrum.label}</option>
      </select>

      <label className="label" style={{ marginTop: 8 }}>
        Fase
      </label>
      <select value={phase} onChange={(e) => setPhase(e.target.value)}>
        {KB[standard].phases.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <label className="label" style={{ marginTop: 8 }}>
        Industria (opcional)
      </label>
      <input
        className="input"
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        placeholder="Salud, Retail, Banca…"
      />

      <div className="chips">
        {dynamicSuggestions.map((s, i) => (
          <button
            key={i}
            className="chip"
            onClick={() => setInput((prev) => (prev ? prev + "\n" + s : s))}
          >
            {s}
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={openWizard}>
        Abrir Wizard
      </button>
      <button
        className="btn-ghost"
        style={{ marginLeft: 8 }}
        onClick={() => navigate("/dashboard")}
      >
        Volver al Dashboard
      </button>

      <div className="muted" style={{ marginTop: 12 }}>
        Conocimiento · {kb.label}
      </div>
      <div className="muted">Fase: {phase}</div>

      {artifacts.length > 0 && (
        <>
          <div className="badge" style={{ marginTop: 8 }}>
            Artefactos
          </div>
          <ul className="list">
            {artifacts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
      {checks.length > 0 && (
        <>
          <div className="badge subtle" style={{ marginTop: 6 }}>
            Checks
          </div>
          <ul className="list">
            {checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <main
      className={`assistant chat-shell right-side ${
        sidebarCollapsed ? "collapsed" : ""
      }`}
    >
      {/* Sidebar izquierda (Historial) */}
      <aside className="sidebar">
        <button
          className={`side-toggle ${sidebarCollapsed ? "collapsed" : ""}`}
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label="Alternar panel"
        >
          {sidebarCollapsed ? "◂" : "▸"}
        </button>
        <div className="panel">
          <div className="side-title">Historial</div>
          <div className="side-actions">
            <button className="btn-primary" onClick={newThread}>
              Nuevo chat
            </button>
          </div>

          <div className="thread-list">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`thread-item ${
                  t.id === currentThreadId ? "active" : ""
                }`}
                onClick={() => selectThread(t.id)}
                title={`${new Date(t.createdAt).toLocaleString()} · ${
                  t.messages?.length || 0
                } msgs`}
              >
                <div className="thread-title">{t.title || "Sin título"}</div>
                <div className="thread-kebab">
                  <button
                    className="mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportThread(t.id);
                    }}
                  >
                    ⭳
                  </button>
                  <button
                    className="mini danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(t.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <div className="muted">No hay conversaciones.</div>
            )}
          </div>
        </div>

        {kbPanel}
      </aside>

      {/* Columna central: Chat */}
      <section className="chat-main">
        {/* Header “pestañas” estilo ChatGPT/Gemini */}
        <header className="chat-header">
          <div className="chat-tabs">
            <button className="tab active">Chat</button>
            <button className="tab" onClick={openWizard}>
              Wizard
            </button>
            <button className="tab" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
          </div>
        </header>

        {/* Mensajes */}
        <div ref={boxRef} className="messages">
          {messages.map((m) => (
            <ChatMessage key={m.id} m={m} />
          ))}
          {loading && (
            <div className="msg-row left">
              <div className="avatar" />
              <div className="bubble assistant">
                <div className="bubble-meta">
                  <span className="who">
                    Asistente • {formatTime(Date.now())}
                  </span>
                </div>
                <div className="bubble-text muted">Pensando…</div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {errMsg && <div className="assistant-error">{errMsg}</div>}

        {/* Composer anclado abajo */}
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu mensaje…"
            rows={1}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading}>
            {loading ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </section>
    </main>
  );
}
