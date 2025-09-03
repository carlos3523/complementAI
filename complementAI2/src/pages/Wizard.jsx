import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

/* ---------- util ---------- */
const newId = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  String(Date.now()) + Math.random().toString(36).slice(2);

function mapStandardToMethodology(std) {
  // valores que pueden venir del Assistant
  if (!std) return "agil";
  const s = std.toLowerCase();
  if (s.includes("scrum") || s.includes("ágil") || s === "agil") return "agil";
  if (s.includes("iso")) return "iso21502";
  return "pmbok";
}
function mapPhaseToStage(phase) {
  if (!phase) return "idea";
  const p = phase.toLowerCase();
  if (p.includes("inicio") || p.includes("descubr")) return "idea";
  if (p.includes("plan")) return "planificacion";
  if (p.includes("ejec")) return "ejecucion";
  if (p.includes("cierre")) return "cierre";
  if (p.includes("monitoreo") || p.includes("control")) return "planificacion";
  return "idea";
}

/* ---------- generador de sugerencias ---------- */
function suggest({ stage, methodology, domain }) {
  const base = {
    idea: [
      {
        name: "Project Charter / Acta",
        why: "Define propósito, alcance y riesgos iniciales.",
      },
      {
        name: "Matriz de Interesados",
        why: "Identifica y prioriza stakeholders.",
      },
      {
        name: "Business Model Canvas",
        why: "Alinea propuesta de valor y segmentos.",
      },
    ],
    planificacion: [
      { name: "WBS / EDT", why: "Estructura del trabajo por entregables." },
      {
        name: "Cronograma (Gantt)",
        why: "Secuencia, dependencias y duración.",
      },
      {
        name: "Matriz de Riesgos",
        why: "Probabilidad e impacto con respuestas.",
      },
      { name: "Plan de Comunicaciones", why: "Qué, cómo y cuándo informar." },
    ],
    ejecucion: [
      { name: "Actas de Reunión", why: "Trazabilidad de acuerdos y tareas." },
      { name: "Control de Cambios", why: "Impacto en alcance/tiempo/costo." },
      { name: "KPIs del Proyecto", why: "Seguimiento del desempeño." },
    ],
    cierre: [
      { name: "Informe de Cierre", why: "Resultados y lecciones aprendidas." },
      { name: "Acta de Aceptación", why: "Entrega formal y conformidad." },
    ],
  };

  const agile = [
    {
      name: "Product Vision & Roadmap (Ágil)",
      why: "Visión compartida e hitos.",
    },
    { name: "Backlog Priorizado", why: "Ordenado por valor y esfuerzo." },
    { name: "DoR/DoD", why: "Criterios de entrada/salida por historia." },
  ];
  const pmbok = [
    {
      name: "Plan de Gestión del Alcance",
      why: "Criterios y control del alcance.",
    },
    { name: "Presupuesto / EVM", why: "Base de costos y medición de valor." },
  ];
  const iso = [
    {
      name: "Plan de Dirección (ISO 21502)",
      why: "Enfoque integral según ISO.",
    },
    { name: "Gestión de Beneficios", why: "Alineación con la estrategia." },
  ];
  const software = [
    { name: "SRS (Requisitos)", why: "Requisitos claros y verificables." },
    {
      name: "Diagrama de Arquitectura",
      why: "Componentes, módulos e integraciones.",
    },
  ];

  let list = [...(base[stage] || [])];

  const meth = methodology === "scrum" ? "agil" : methodology;
  if (meth === "agil") list = [...agile, ...list];
  if (meth === "pmbok") list = [...pmbok, ...list];
  if (meth === "iso21502") list = [...iso, ...list];

  if ((domain || "").toLowerCase().includes("software"))
    list = [...software, ...list];

  // dedupe por nombre
  const seen = new Set();
  return list.filter((t) => (seen.has(t.name) ? false : seen.add(t.name)));
}

/* ---------- página ---------- */
export default function Wizard() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // formulario
  const [form, setForm] = useState({
    name: "",
    methodology: "agil", // agil | pmbok | iso21502
    stage: "idea", // idea | planificacion | ejecucion | cierre
    domain: "software", // libre; usamos opciones comunes
  });

  // prellenar desde /wizard?standard=...&phase=...&domain=...
  useEffect(() => {
    const std = search.get("standard");
    const ph = search.get("phase");
    const dom = search.get("domain");
    setForm((f) => ({
      ...f,
      methodology: mapStandardToMethodology(std) || f.methodology,
      stage: mapPhaseToStage(ph) || f.stage,
      domain: dom || f.domain,
    }));
  }, [search]);

  // sugerencias dinámicas
  const templates = useMemo(() => suggest(form), [form]);

  function handleSave() {
    const projects = JSON.parse(localStorage.getItem("projects") || "[]");
    const project = {
      id: newId(),
      name: form.name || `Proyecto ${new Date().toLocaleDateString()}`,
      methodology: form.methodology,
      stage: form.stage,
      domain: form.domain,
      templates: templates.map((t) => ({ name: t.name, why: t.why })),
      createdAt: Date.now(),
    };
    localStorage.setItem("projects", JSON.stringify([project, ...projects]));
    navigate("/dashboard");
  }

  return (
    <main className="wizard">
      <div className="wrap">
        {/* Panel izquierdo: formulario */}
        <aside className="panel">
          <div className="side-title">Nuevo proyecto</div>
          <p className="side-help">
            Completa el contexto y revisa las plantillas sugeridas.
          </p>

          <div className="grid2" style={{ marginTop: 12 }}>
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                placeholder="Mi proyecto"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Metodología</label>
              <select
                className="input"
                value={form.methodology}
                onChange={(e) =>
                  setForm({ ...form, methodology: e.target.value })
                }
              >
                <option value="agil">Ágil (Scrum/Kanban)</option>
                <option value="pmbok">PMBOK</option>
                <option value="iso21502">ISO 21502</option>
              </select>
            </div>

            <div>
              <label className="label">Fase</label>
              <select
                className="input"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                <option value="idea">Idea / Inicio</option>
                <option value="planificacion">Planificación</option>
                <option value="ejecucion">Ejecución</option>
                <option value="cierre">Cierre</option>
              </select>
            </div>

            <div>
              <label className="label">Industria / dominio</label>
              <select
                className="input"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                <option value="software">Software</option>
                <option value="salud">Salud</option>
                <option value="retail">Retail</option>
                <option value="banca">Banca</option>
                <option value="educacion">Educación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link to="/assistant" className="btn-ghost">
              ← Volver al Asistente
            </Link>
            <button className="btn-primary" onClick={handleSave}>
              Guardar proyecto
            </button>
          </div>
        </aside>

        {/* Panel derecho: sugerencias */}
        <section className="panel">
          <div className="side-title">Plantillas sugeridas</div>
          <p className="side-help">
            Según <b>{form.methodology.toUpperCase()}</b> y fase{" "}
            <b>{form.stage}</b>
            {form.domain ? ` · dominio: ${form.domain}` : ""}.
          </p>

          {templates.length === 0 ? (
            <p className="muted">No hay sugerencias para este contexto.</p>
          ) : (
            <ul className="list">
              {templates.map((t) => (
                <li key={t.name}>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {t.why}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
