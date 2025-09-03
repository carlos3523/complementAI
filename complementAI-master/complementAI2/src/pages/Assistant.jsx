import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../style.css"; // <-- estilos separados con tu tema oscuro
import { chat } from "../services/chat"; // <-- cliente que llama a /api/chat

// --- KB mínimo de metodologías ---
const KB = {
  pmbok: {
    label: "PMBOK®",
    phases: ["Inicio", "Planificación", "Ejecución", "Monitoreo y Control", "Cierre"],
    artifacts: {
      Inicio: ["Acta de Constitución", "Identificación de Stakeholders", "Caso de Negocio"],
      Planificación: ["WBS/EDT", "Cronograma (Gantt)", "Presupuesto", "Plan de Riesgos", "Plan de Calidad", "Comunicaciones"],
      Ejecución: ["Gestión de Cambios", "Reportes de Avance"],
      "Monitoreo y Control": ["EVM (PV, EV, AC)", "Seguimiento de Riesgos", "Control de Calidad"],
      Cierre: ["Informe Final", "Lecciones Aprendidas"],
    },
    checks: {
      Inicio: ["Sponsor definido", "Objetivos SMART", "Stakeholders priorizados"],
      Planificación: ["Línea base alcance-tiempo-costo", "Riesgos con respuesta", "Matriz RACI"],
    },
  },
  iso21502: {
    label: "ISO 21502",
    phases: ["Inicio", "Planificación", "Ejecución", "Monitoreo y Control", "Cierre"],
    artifacts: {
      Inicio: ["Mandato del Proyecto"],
      Planificación: ["Plan de Dirección", "Gestión de Beneficios", "Gestión de Interesados"],
      Ejecución: ["Gestión de Recursos", "Adquisiciones"],
      "Monitoreo y Control": ["Revisión de Beneficios", "Aseguramiento"],
      Cierre: ["Transferencia Operacional"],
    },
    checks: {
      Planificación: ["Beneficios vinculados a estrategia", "Controles de calidad definidos"],
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
      "Ejecución Iterativa": ["Ceremonias activas", "Backlog priorizado", "DoD aplicado"],
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
  const [phase, setPhase] = useState(KB.pmbok.phases[1]); // Planificación
  const [industry, setIndustry] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", text: "Asistente listo ✅ — Assistant Lite" },
  ]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const kb = KB[standard];
  const artifacts = kb.artifacts[phase] || [];
  const checks = (kb.checks && kb.checks[phase]) || [];

  const navigate = useNavigate();

  function openWizard() {
    const qs = new URLSearchParams({
      standard,
      phase,
      domain: industry || "",
    }).toString();
    navigate(`/wizard?${qs}`);
  }

  // autoscroll
  const boxRef = useRef(null);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  // cargar sesión guardada
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("assistant_session") || "null");
    if (saved) {
      setStandard(saved.standard ?? "pmbok");
      setPhase(saved.phase ?? KB.pmbok.phases[1]);
      setIndustry(saved.industry ?? "");
      setMessages(saved.messages ?? []);
    }
  }, []);

  // guardar sesión
  useEffect(() => {
    localStorage.setItem(
      "assistant_session",
      JSON.stringify({ standard, phase, industry, messages })
    );
  }, [standard, phase, industry, messages]);

  const dynamicSuggestions = useMemo(() => {
    const setx = new Set(STATIC_SUGGESTIONS);
    artifacts.slice(0, 3).forEach((a) => setx.add("Genera plantilla: " + a));
    return Array.from(setx).slice(0, 8);
  }, [artifacts]);

  // --- Nueva versión con IA: envía a backend (/api/chat) usando OpenRouter ---
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    // 1) agrega el mensaje del usuario a la vista
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setErrMsg("");
    setLoading(true);

    try {
      // 2) Construye el contexto de sistema (metodología/fase/industria)
      const systemPrompt =
        `Eres un asistente experto en gestión de proyectos. ` +
        `Responde en español claro, con pasos accionables y listas cuando convenga. ` +
        `Usa el contexto del usuario si existe. Evita divagar.\n\n` +
        `Contexto:\n` +
        `- Marco: ${kb.label}\n` +
        `- Fase: ${phase}\n` +
        (industry ? `- Industria: ${industry}\n` : ``) +
        (artifacts.length ? `- Artefactos esperados: ${artifacts.join(", ")}\n` : ``) +
        (checks.length ? `- Checks clave: ${checks.join(", ")}\n` : ``);

      // 3) Mapea historial local -> formato OpenAI
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-8) // limitar contexto para no enviar demasiado
        .map((m) => ({ role: m.role, content: m.text }));

      const payload = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: text },
      ];

      // 4) Llama a la API (tu backend)
      const content = await chat(payload /*, "deepseek/deepseek-chat-v3.1:free"*/);

      // 5) Pega la respuesta al chat
      const aiMsg = { id: Date.now() + 1, role: "assistant", text: content || "…" };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      console.error(e);
      setErrMsg("Ocurrió un error consultando a la IA. Intenta de nuevo.");
      // Respuesta de fallback breve
      setMessages((m) => [
        ...m,
        { id: Date.now() + 2, role: "assistant", text: "No pude consultar a la IA ahora. ¿Quieres reintentar?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function saveAsProject() {
    const projects = JSON.parse(localStorage.getItem("projects") || "[]");
    const name = `Asistente · ${KB[standard].label} · ${phase}`;
    const templates = (KB[standard].artifacts[phase] || []).map((a) => ({
      name: a,
      why: "Sugerido por contexto del asistente",
    }));
    const project = {
      id: (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()),
      name,
      stage: phase,
      methodology: standard,
      domain: "general",
      templates,
      createdAt: Date.now(),
    };
    localStorage.setItem("projects", JSON.stringify([project, ...projects]));
    alert("Proyecto guardado. Revísalo en el Dashboard.");
  }

  return (
    <main className="assistant">
      <div className="assistant-wrap">
        <div className="appbar">
          <div className="appbar-left">
            <button className="appbar-btn" onClick={openWizard}>
              Abrir Wizard
            </button>
            <div className="appbar-title">📁 Asistente de Proyectos</div>
          </div>
          <button className="appbar-btn ghost" onClick={() => navigate("/dashboard")}>
            Volver al Dashboard
          </button>
        </div>

        {/* Sidebar */}
        <aside className="assistant-column">
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
                  onClick={() => setInput((prev) => (prev ? prev + "\n" + s : s))}
                >
                  {s}
                </button>
              ))}
            </div>

            <button className="assistant-btn success" onClick={saveAsProject}>
              Guardar como proyecto
            </button>
          </div>

          <div className="assistant-card">
            <div className="assistant-subtitle">Conocimiento · {kb.label}</div>
            <div className="assistant-meta">Fase: {phase}</div>

            {artifacts.length > 0 && (
              <>
                <div className="assistant-meta-strong">Artefactos</div>
                <ul className="assistant-list">
                  {artifacts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </>
            )}

            {checks.length > 0 && (
              <>
                <div className="assistant-meta-strong">Checks</div>
                <ul className="assistant-list">
                  {checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Chat */}
        <section className="assistant-column">
          <div className="assistant-card">
            <div ref={boxRef} className="assistant-chat">
              {messages.map((m) => (
                <div key={m.id} className={`assistant-msg ${m.role === "user" ? "right" : "left"}`}>
                  <span className="who">{m.role}:</span> <span>{m.text}</span>
                </div>
              ))}
              {loading && (
                <div className="assistant-msg left">
                  <span className="who">assistant:</span> <span>… pensando</span>
                </div>
              )}
            </div>

            {errMsg && <div className="assistant-error">{errMsg}</div>}

            <div className="assistant-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe y presiona Enter…"
                className="assistant-input flex1"
                disabled={loading}
              />
              <button onClick={handleSend} className="assistant-btn" disabled={loading}>
                {loading ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
