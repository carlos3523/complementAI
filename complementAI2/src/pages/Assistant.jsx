import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { chat } from "../services/chat";

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
  const [standard, setStandard] = useState("pmbok");
  const [phase, setPhase] = useState(KB.pmbok.phases[1]);
  const [industry, setIndustry] = useState("");

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

  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const navigate = useNavigate();
  const boxRef = useRef(null);

  const kb = KB[standard];
  const artifacts = kb.artifacts[phase] || [];
  const checks = kb.checks?.[phase] || [];

  // Auto-scroll
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  // Guardar sesión ligera
  useEffect(() => {
    localStorage.setItem(
      "assistant_session",
      JSON.stringify({ standard, phase, industry })
    );
  }, [standard, phase, industry]);

  // Guardar mensajes
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

  // Sugerencias dinámicas
  const dynamicSuggestions = useMemo(() => {
    const setx = new Set(STATIC_SUGGESTIONS);
    artifacts.slice(0, 3).forEach((a) => setx.add("Genera plantilla: " + a));
    return Array.from(setx).slice(0, 8);
  }, [artifacts]);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Enviar mensaje
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setErrMsg("");
    setLoading(true);

    const systemPrompt = `Eres un asistente experto en gestión de proyectos.
    Contexto:
    - Marco: ${kb.label}
    - Fase: ${phase}
    ${industry ? `- Industria: ${industry}` : ""}`;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));

    const payload = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: text },
    ];

    const thinking = {
      id: Date.now() + 1,
      role: "assistant",
      text: "Pensando…",
      ts: Date.now(),
      thinking: true,
    };
    setMessages((m) => [...m, thinking]);

    try {
      const content = await chat(payload);
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
            ? { ...mm, thinking: false, text: "⚠️ No pude consultar a la IA." }
            : mm
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const ChatMessage = ({ m }) => {
    const isUser = m.role === "user";
    const meta = `${isUser ? "Tú" : "Asistente"} • ${formatTime(
      m.ts || Date.now()
    )}`;

    const toHTML = (() => {
      try {
        // usa marked si existe, si no fallback simple
        // @ts-ignore
        const html = window.marked
          ? window.marked.parse(m.text || "")
          : (m.text || "").replace(/\n/g, "<br/>");
        return { __html: html };
      } catch {
        return { __html: (m.text || "").replace(/\n/g, "<br/>") };
      }
    })();

    return (
      <div className={`msg-row ${isUser ? "right" : "left"}`}>
        {/* avatar del asistente a la izquierda */}
        {!isUser && <div className="avatar" aria-hidden />}

        {/* >>> Usuario: mantiene BURBUJA */}
        {isUser ? (
          <div className="bubble user">
            <div className="bubble-meta">
              <span className="who">{meta}</span>
            </div>
            <div
              className={`bubble-text ${m.thinking ? "muted" : ""}`}
              dangerouslySetInnerHTML={toHTML}
            />
          </div>
        ) : (
          /* >>> Asistente: SIN burbuja (solo texto plano con meta) */
          <div className="assistant-plain">
            <div className="bubble-meta">
              <span className="who">{meta}</span>
            </div>
            <div
              className={`bubble-text ${m.thinking ? "muted" : ""} markdown`}
              dangerouslySetInnerHTML={toHTML}
            />
          </div>
        )}

        {/* avatar del usuario a la derecha */}
        {isUser && <div className="avatar user" aria-hidden />}
      </div>
    );
  };

  return (
    <main className="assistant">
      <div className="assistant-wrap">
        {/* 🟣 Sección del chat (ahora a la izquierda) */}
        <section className="assistant-main">
          <div className="assistant-card">
            <div ref={boxRef} className="assistant-chat">
              {messages.map((m) => (
                <ChatMessage key={m.id} m={m} />
              ))}
              {loading && (
                <div className="msg-row left">
                  <div className="avatar" aria-hidden />
                  <div className="assistant-plain">
                    <div className="bubble-meta">
                      <span className="who">Asistente</span>
                      <span className="time">{formatTime(Date.now())}</span>
                    </div>
                    <div className="bubble-text muted">Pensando…</div>
                  </div>
                </div>
              )}
            </div>

            {errMsg && <div className="assistant-error">{errMsg}</div>}

            <div className="assistant-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="assistant-input flex1"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                className="assistant-btn"
                disabled={loading}
              >
                {loading ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </section>

        {/* 🟡 Panel lateral de contexto (ahora a la derecha) */}
        <aside className="assistant-side">
          <div className="assistant-card">
            <div className="assistant-subtitle">Contexto</div>

            <label className="assistant-label">Marco de trabajo</label>
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value);
                setPhase(KB[e.target.value].phases[0]);
              }}
              className="assistant-select"
            >
              <option value="pmbok">{KB.pmbok.label}</option>
              <option value="iso21502">{KB.iso21502.label}</option>
              <option value="scrum">{KB.scrum.label}</option>
            </select>

            <label className="assistant-label">Fase</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="assistant-select"
            >
              {kb.phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label className="assistant-label">Industria (opcional)</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Salud, Retail, Banca…"
              className="assistant-input"
            />

            <div className="assistant-divider" />

            <div className="assistant-chips">
              {dynamicSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="assistant-chip"
                  onClick={() =>
                    setInput((prev) => (prev ? prev + "\n" + s : s))
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
