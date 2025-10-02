import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../style.css"; // <-- estilos separados con tu tema oscuro

/** ====== KB mínima ====== */
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
  },
  scrum: {
    label: "Scrum / Ágil",
    phases: ["Descubrimiento", "Ejecución Iterativa", "Cierre"],
    artifacts: {
      Descubrimiento: ["Visión de Producto", "Product Backlog"],
      "Ejecución Iterativa": ["Sprint Backlog", "Increment", "DoD/DoR"],
      Cierre: ["Release Notes", "Retro final"],
    },
  },
};

/** ====== Utils ====== */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const LS_CHATS = "assistant_chats_v1";
const LS_COLLAPSED = "assistant_sidebar_collapsed";

function loadChats() {
  try {
    const raw = localStorage.getItem(LS_CHATS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveChats(chats) {
  localStorage.setItem(LS_CHATS, JSON.stringify(chats));
}

/** ====== Componente principal ====== */
export default function AssistantChat() {
  const navigate = useNavigate();

  // Persistimos el estado del sidebar
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(LS_COLLAPSED) === "1"
  );
  useEffect(() => {
    localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0");
  }, [collapsed]);

  const [chats, setChats] = useState(() => {
    const saved = loadChats();
    if (saved.length) return saved;
    const initial = {
      id: uid(),
      title: "Nuevo chat",
      standard: "pmbok",
      phase: KB.pmbok.phases[1],
      industry: "",
      messages: [
        { id: uid(), role: "assistant", text: "¿Qué quieres lograr? 😊" },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return [initial];
  });
  const [activeId, setActiveId] = useState(() => chats[0]?.id);
  const active = chats.find((c) => c.id === activeId);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => saveChats(chats), [chats]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages]);

  const kb = useMemo(() => KB[active?.standard || "pmbok"], [active?.standard]);
  const artifacts = useMemo(
    () => kb?.artifacts?.[active?.phase] || [],
    [kb, active?.phase]
  );

  function newChat() {
    const c = {
      id: uid(),
      title: "Nuevo chat",
      standard: "pmbok",
      phase: KB.pmbok.phases[1],
      industry: "",
      messages: [
        { id: uid(), role: "assistant", text: "¿Qué quieres lograr? 😊" },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function deleteChat(id) {
    const next = chats.filter((c) => c.id !== id);
    setChats(next);
    if (id === activeId && next.length) setActiveId(next[0].id);
  }

  function renameChat(id, title) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      )
    );
  }

  function updateActive(patch) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, ...patch, updatedAt: Date.now() } : c
      )
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !active) return;

    const userMsg = { id: uid(), role: "user", text };
    const ctx = `Estándar: ${kb.label} · Fase: ${active.phase}${
      active.industry ? " · Industria: " + active.industry : ""
    }`;
    const suggestion =
      artifacts.slice(0, 3).join(", ") || "definamos el entregable inmediato.";
    const botMsg = {
      id: uid(),
      role: "assistant",
      text: `Recibido. ${ctx}\nSiguientes pasos sugeridos: ${suggestion}`,
    };

    const title =
      active.title === "Nuevo chat"
        ? text.length > 28
          ? text.slice(0, 28) + "…"
          : text
        : active.title;

    updateActive({ title, messages: [...active.messages, userMsg, botMsg] });
    setDraft("");
  }

  function handleSaveProject() {
    if (!active) return;
    const name =
      active.title === "Nuevo chat"
        ? `${kb.label} · ${active.phase}`
        : active.title;
    const templates = artifacts.map((a) => ({
      name: a,
      why: "Sugerido por contexto",
    }));
    const project = {
      id: uid(),
      name,
      methodology: active.standard,
      stage: active.phase,
      domain: active.industry || "general",
      templates,
      createdAt: Date.now(),
    };
    const list = JSON.parse(localStorage.getItem("projects") || "[]");
    localStorage.setItem("projects", JSON.stringify([project, ...list]));
    alert("Proyecto guardado. Puedes verlo en el Dashboard.");
    navigate("/dashboard");
  }

  if (!active) return null;

  return (
    <div className={`asst-layout ${collapsed ? "collapsed" : ""}`}>
      {/* ===== Sidebar ===== */}
      <aside className="asst-sidebar">
        <div className="asst-sidebar-top">
          <div className="asst-row">
            <button
              className="btn btn-ghost icon-btn"
              aria-label={collapsed ? "Expandir panel" : "Colapsar panel"}
              title={collapsed ? "Expandir" : "Colapsar"}
              onClick={() => setCollapsed((v) => !v)}
            >
              ☰
            </button>
            {!collapsed && (
              <button className="btn btn-primary" onClick={newChat}>
                ＋ Nuevo chat
              </button>
            )}
          </div>

          <div className="asst-shortcuts">
            {!collapsed && <div className="asst-shortcuts-title">Accesos</div>}
            <Link className="asst-shortcut" to="/wizard" title="Wizard">
              <span className="emoji">🧭</span>
              {!collapsed && <span>Wizard</span>}
            </Link>
            <Link className="asst-shortcut" to="/dashboard" title="Dashboard">
              <span className="emoji">📂</span>
              {!collapsed && <span>Dashboard</span>}
            </Link>
            <Link className="asst-shortcut" to="/" title="Home">
              <span className="emoji">🏠</span>
              {!collapsed && <span>Home</span>}
            </Link>
          </div>
        </div>

        <div className="asst-history">
          {!collapsed && (
            <div className="asst-history-title">Conversaciones</div>
          )}
          <ul>
            {chats.map((c) => (
              <li
                key={c.id}
                className={`asst-chat-item ${
                  c.id === activeId ? "active" : ""
                }`}
                title={c.title}
              >
                <button
                  onClick={() => setActiveId(c.id)}
                  className="asst-chat-title line-2"
                >
                  {c.title}
                </button>
                {!collapsed && (
                  <div className="asst-chat-actions">
                    <button
                      title="Renombrar"
                      onClick={() => {
                        const t = prompt("Renombrar chat:", c.title);
                        if (t && t.trim()) renameChat(c.id, t.trim());
                      }}
                    >
                      ✏️
                    </button>
                    <button title="Eliminar" onClick={() => deleteChat(c.id)}>
                      🗑️
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {!collapsed && (
          <div className="asst-sidebar-foot">
            <div className="muted">ComplementAI · MVP</div>
          </div>
        )}
      </aside>

      {/* ===== Main ===== */}
      <main className="asst-main">
        {/* Topbar */}
        <header className="asst-topbar">
          <div className="asst-topbar-left">
            <div className="asst-title">{active.title}</div>
          </div>
          <div className="asst-topbar-controls">
            <select
              value={active.standard}
              onChange={(e) => {
                const std = e.target.value;
                const firstPhase = KB[std].phases[0];
                updateActive({ standard: std, phase: firstPhase });
              }}
              title="Marco de trabajo"
            >
              <option value="pmbok">{KB.pmbok.label}</option>
              <option value="iso21502">{KB.iso21502.label}</option>
              <option value="scrum">{KB.scrum.label}</option>
            </select>

            <select
              value={active.phase}
              onChange={(e) => updateActive({ phase: e.target.value })}
              title="Fase"
            >
              {kb.phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <input
              value={active.industry}
              onChange={(e) => updateActive({ industry: e.target.value })}
              placeholder="Industria (opcional)"
            />

            <button className="btn btn-ghost" onClick={handleSaveProject}>
              💾 Guardar proyecto
            </button>
          </div>
        </header>

        {/* Mensajes */}
        <section className="asst-chat-area">
          {/* Mensajes (scroll) */}
          <div className="asst-scroll" ref={scrollRef}>
            {active.messages.map((m) => (
              <div key={m.id} className={`asst-msg ${m.role}`}>
                <div className="bubble">
                  {m.text.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sugerencias pegadas encima del composer */}
          <div className="asst-chipbar">
            {artifacts.slice(0, 4).map((a) => (
              <button
                key={a}
                className="asst-chip"
                onClick={() =>
                  setDraft((prev) =>
                    prev
                      ? prev + `\nGenera plantilla: ${a}`
                      : `Genera plantilla: ${a}`
                  )
                }
              >
                Genera plantilla: {a}
              </button>
            ))}
          </div>

          {/* Composer fijo abajo */}
          <div className="asst-composer">
            <div className="asst-compose-row">
              <textarea
                className="asst-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un mensaje (Shift+Enter para nueva línea)…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <button className="asst-send" onClick={handleSend}>
                Enviar ▶
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
