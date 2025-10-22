import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
// Asume que esta ruta es correcta y que translations.js existe
import { translations } from "../translations"; 

/* ---------- util & i18n setup ---------- */

/** Carga el idioma del usuario, usado para inicializar el estado del componente. */
const getLanguage = () => {
    try {
        const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
        return savedPrefs.language || "es";
    } catch {
        return "es";
    }
};

/**
 * Función T() para traducir texto usando la configuración global de idioma (fuera de React).
 * @param {string} lang - Código de idioma actual.
 * @param {string} key - Clave de traducción.
 * @param {string} fallback - Texto por defecto.
 * @returns {string} Texto traducido o fallback.
 */
const T_GLOBAL = (lang, key, fallback = key) => {
    if (!translations[lang] || !translations[lang][key]) return fallback;
    return translations[lang][key];
};

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

function mapPhaseToStage(phase, lang) {
  const T = (key, fallback) => T_GLOBAL(lang, key, fallback);

  if (!phase) return T("MAP_STAGE_IDEA", "idea");
  const p = phase.toLowerCase();

  // Usamos las claves de traducción para la lógica de mapeo
  if (p.includes(T("MAP_STAGE_IDEA", "inicio").toLowerCase()) || p.includes("descubr")) return T("MAP_STAGE_IDEA", "idea");
  if (p.includes(T("MAP_STAGE_PLAN", "plan").toLowerCase())) return T("MAP_STAGE_PLAN", "planificacion");
  if (p.includes(T("MAP_STAGE_EXEC", "ejec").toLowerCase())) return T("MAP_STAGE_EXEC", "ejecucion");
  if (p.includes(T("MAP_STAGE_CLOSE", "cierre").toLowerCase())) return T("MAP_STAGE_CLOSE", "cierre");
  // Monitoreo/Control se mapea a Planificación por convención en este modelo
  if (p.includes("monitoreo") || p.includes("control")) return T("MAP_STAGE_PLAN", "planificacion"); 
  return T("MAP_STAGE_IDEA", "idea");
}

/* ---------- generador de sugerencias ---------- */
function suggest({ stage, methodology, domain }, lang) {
  const T = (key, fallback) => T_GLOBAL(lang, key, fallback);
  
  // Traducción de los textos base
  const base = {
    [T_GLOBAL(lang, "MAP_STAGE_IDEA", "idea")]: [ // Usamos la clave traducida para el objeto
      {
        name: T("TPL_CHARTER_NAME", "Project Charter / Acta"),
        why: T("TPL_CHARTER_WHY", "Define propósito, alcance y riesgos iniciales."),
      },
      {
        name: T("TPL_STAKEHOLDER_NAME", "Matriz de Interesados"),
        why: T("TPL_STAKEHOLDER_WHY", "Identifica y prioriza stakeholders."),
      },
      {
        name: T("TPL_BMC_NAME", "Business Model Canvas"),
        why: T("TPL_BMC_WHY", "Alinea propuesta de valor y segmentos."),
      },
    ],
    [T_GLOBAL(lang, "MAP_STAGE_PLAN", "planificacion")]: [
      { name: T("TPL_WBS_NAME", "WBS / EDT"), why: T("TPL_WBS_WHY", "Estructura del trabajo por entregables.") },
      {
        name: T("TPL_SCHEDULE_NAME", "Cronograma (Gantt)"),
        why: T("TPL_SCHEDULE_WHY", "Secuencia, dependencias y duración."),
      },
      {
        name: T("TPL_RISK_NAME", "Matriz de Riesgos"),
        why: T("TPL_RISK_WHY", "Probabilidad e impacto con respuestas."),
      },
      { name: T("TPL_COMMS_NAME", "Plan de Comunicaciones"), why: T("TPL_COMMS_WHY", "Qué, cómo y cuándo informar.") },
    ],
    [T_GLOBAL(lang, "MAP_STAGE_EXEC", "ejecucion")]: [
      { name: T("TPL_MEETING_NAME", "Actas de Reunión"), why: T("TPL_MEETING_WHY", "Trazabilidad de acuerdos y tareas.") },
      { name: T("TPL_CHANGE_NAME", "Control de Cambios"), why: T("TPL_CHANGE_WHY", "Impacto en alcance/tiempo/costo.") },
      { name: T("TPL_KPI_NAME", "KPIs del Proyecto"), why: T("TPL_KPI_WHY", "Seguimiento del desempeño.") },
    ],
    [T_GLOBAL(lang, "MAP_STAGE_CLOSE", "cierre")]: [
      { name: T("TPL_CLOSURE_NAME", "Informe de Cierre"), why: T("TPL_CLOSURE_WHY", "Resultados y lecciones aprendidas.") },
      { name: T("TPL_ACCEPTANCE_NAME", "Acta de Aceptación"), why: T("TPL_ACCEPTANCE_WHY", "Entrega formal y conformidad.") },
    ],
  };

  // Traducción de los textos específicos de metodología
  const agile = [
    {
      name: T("TPL_AGILE_VISION_NAME", "Product Vision & Roadmap (Ágil)"),
      why: T("TPL_AGILE_VISION_WHY", "Visión compartida e hitos."),
    },
    { name: T("TPL_BACKLOG_NAME", "Backlog Priorizado"), why: T("TPL_BACKLOG_WHY", "Ordenado por valor y esfuerzo.") },
    { name: T("TPL_DOR_DOD_NAME", "DoR/DoD"), why: T("TPL_DOR_DOD_WHY", "Criterios de entrada/salida por historia.") },
  ];
  const pmbok = [
    {
      name: T("TPL_SCOPE_PLAN_NAME", "Plan de Gestión del Alcance"),
      why: T("TPL_SCOPE_PLAN_WHY", "Criterios y control del alcance."),
    },
    { name: T("TPL_BUDGET_NAME", "Presupuesto / EVM"), why: T("TPL_BUDGET_WHY", "Base de costos y medición de valor.") },
  ];
  const iso = [
    {
      name: T("TPL_ISO_PLAN_NAME", "Plan de Dirección (ISO 21502)"),
      why: T("TPL_ISO_PLAN_WHY", "Enfoque integral según ISO."),
    },
    { name: T("TPL_BENEFITS_NAME", "Gestión de Beneficios"), why: T("TPL_BENEFITS_WHY", "Alineación con la estrategia.") },
  ];
  const software = [
    { name: T("TPL_SRS_NAME", "SRS (Requisitos)"), why: T("TPL_SRS_WHY", "Requisitos claros y verificables.") },
    {
      name: T("TPL_ARCHITECTURE_NAME", "Diagrama de Arquitectura"),
      why: T("TPL_ARCHITECTURE_WHY", "Componentes, módulos e integraciones."),
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
  const [language, setLanguage] = useState(getLanguage()); // Estado para el idioma

  // FUNCIÓN T que usa el estado 'language'
  const T = (key, fallback = key) => T_GLOBAL(language, key, fallback);


  // formulario
  const [form, setForm] = useState({
    name: "",
    methodology: "agil", // agil | pmbok | iso21502
    stage: T("MAP_STAGE_IDEA", "idea"), // idea | planificacion | ejecucion | cierre
    domain: T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase(), // software, salud, etc.
  });

  // prellenar desde /wizard?standard=...&phase=...&domain=...
  useEffect(() => {
    const std = search.get("standard");
    const ph = search.get("phase");
    const dom = search.get("domain");

    // Se usa el idioma actual (language) para el mapeo
    setForm((f) => ({
      ...f,
      methodology: mapStandardToMethodology(std) || f.methodology,
      stage: mapPhaseToStage(ph, language) || f.stage, // Pasamos language
      domain: dom || f.domain,
    }));
  }, [search, language]); // Añadimos language como dependencia

  // sugerencias dinámicas
  // Pasamos language a la función suggest
  const templates = useMemo(() => suggest(form, language), [form, language]);

  function handleSave() {
    const projects = JSON.parse(localStorage.getItem("projects") || "[]");
    
    // Usamos T() para el nombre por defecto
    const defaultName = T("DEFAULT_PROJECT_NAME", "Proyecto ") + new Date().toLocaleDateString();

    const project = {
      id: newId(),
      name: form.name || defaultName,
      methodology: form.methodology,
      stage: form.stage,
      domain: form.domain,
      templates: templates.map((t) => ({ name: t.name, why: t.why })),
      createdAt: Date.now(),
    };
    localStorage.setItem("projects", JSON.stringify([project, ...projects]));
    navigate("/dashboard");
  }

  // Mapeo de valores internos a textos traducidos para el render
  const translatedStages = {
      [T("MAP_STAGE_IDEA", "idea")]: T("OPT_STAGE_IDEA", "Idea / Inicio"),
      [T("MAP_STAGE_PLAN", "planificacion")]: T("OPT_STAGE_PLAN", "Planificación"),
      [T("MAP_STAGE_EXEC", "ejecucion")]: T("OPT_STAGE_EXEC", "Ejecución"),
      [T("MAP_STAGE_CLOSE", "cierre")]: T("OPT_STAGE_CLOSE", "Cierre"),
  };
  
  // Mapeo de dominio
  const translatedDomains = {
      [T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase()]: T("OPT_DOMAIN_SOFTWARE", "Software"),
      [T("OPT_DOMAIN_HEALTH", "salud").toLowerCase()]: T("OPT_DOMAIN_HEALTH", "Salud"),
      [T("OPT_DOMAIN_RETAIL", "retail").toLowerCase()]: T("OPT_DOMAIN_RETAIL", "Retail"),
      [T("OPT_DOMAIN_BANKING", "banca").toLowerCase()]: T("OPT_DOMAIN_BANKING", "Banca"),
      [T("OPT_DOMAIN_EDUCATION", "educacion").toLowerCase()]: T("OPT_DOMAIN_EDUCATION", "Educación"),
      [T("OPT_DOMAIN_OTHER", "otro").toLowerCase()]: T("OPT_DOMAIN_OTHER", "Otro"),
  };

  // Construcción del texto de contexto para las sugerencias
  const contextText = T("SUGGESTIONS_CONTEXT", "Según <b>{methodology}</b> y fase <b>{stage}</b>")
      .replace("{methodology}", form.methodology.toUpperCase())
      .replace("{stage}", translatedStages[form.stage] || form.stage);

  const domainText = form.domain && form.domain !== "otro"
      ? T("SUGGESTIONS_DOMAIN", " · dominio: {domain}").replace("{domain}", translatedDomains[form.domain] || form.domain)
      : "";


  return (
    <main className="wizard">
      <div className="wrap">
        {/* Panel izquierdo: formulario */}
        <aside className="panel">
          {/* T() en el título */}
          <div className="side-title">{T("WIZARD_TITLE", "Nuevo proyecto")}</div>
          {/* T() en la ayuda */}
          <p className="side-help">
            {T("WIZARD_HELP", "Completa el contexto y revisa las plantillas sugeridas.")}
          </p>

          <div className="grid2" style={{ marginTop: 12 }}>
            <div>
              {/* T() en la etiqueta */}
              <label className="label">{T("LABEL_NAME", "Nombre")}</label>
              <input
                className="input"
                /* T() en el placeholder */
                placeholder={T("PH_NAME", "Mi proyecto")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              {/* T() en la etiqueta */}
              <label className="label">{T("LABEL_METHODOLOGY", "Metodología")}</label>
              <select
                className="input"
                value={form.methodology}
                onChange={(e) =>
                  setForm({ ...form, methodology: e.target.value })
                }
              >
                {/* T() en las opciones */}
                <option value="agil">{T("OPT_AGILE", "Ágil (Scrum/Kanban)")}</option>
                <option value="pmbok">{T("OPT_PMBOK", "PMBOK")}</option>
                <option value="iso21502">{T("OPT_ISO", "ISO 21502")}</option>
              </select>
            </div>

            <div>
              {/* T() en la etiqueta */}
              <label className="label">{T("LABEL_STAGE", "Fase")}</label>
              <select
                className="input"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {/* T() en las opciones de fase */}
                <option value={T("MAP_STAGE_IDEA", "idea")}>{T("OPT_STAGE_IDEA", "Idea / Inicio")}</option>
                <option value={T("MAP_STAGE_PLAN", "planificacion")}>{T("OPT_STAGE_PLAN", "Planificación")}</option>
                <option value={T("MAP_STAGE_EXEC", "ejecucion")}>{T("OPT_STAGE_EXEC", "Ejecución")}</option>
                <option value={T("MAP_STAGE_CLOSE", "cierre")}>{T("OPT_STAGE_CLOSE", "Cierre")}</option>
              </select>
            </div>

            <div>
              {/* T() en la etiqueta */}
              <label className="label">{T("LABEL_DOMAIN", "Industria / dominio")}</label>
              <select
                className="input"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                {/* T() en las opciones de dominio */}
                <option value={T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase()}>{T("OPT_DOMAIN_SOFTWARE", "Software")}</option>
                <option value={T("OPT_DOMAIN_HEALTH", "salud").toLowerCase()}>{T("OPT_DOMAIN_HEALTH", "Salud")}</option>
                <option value={T("OPT_DOMAIN_RETAIL", "retail").toLowerCase()}>{T("OPT_DOMAIN_RETAIL", "Retail")}</option>
                <option value={T("OPT_DOMAIN_BANKING", "banca").toLowerCase()}>{T("OPT_DOMAIN_BANKING", "Banca")}</option>
                <option value={T("OPT_DOMAIN_EDUCATION", "educacion").toLowerCase()}>{T("OPT_DOMAIN_EDUCATION", "Educación")}</option>
                <option value={T("OPT_DOMAIN_OTHER", "otro").toLowerCase()}>{T("OPT_DOMAIN_OTHER", "Otro")}</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link to="/assistant" className="btn-ghost">
              {/* T() en el botón de atrás */}
              {T("BTN_BACK", "← Volver al Asistente")}
            </Link>
            <button className="btn-primary" onClick={handleSave}>
              {/* T() en el botón de guardar */}
              {T("BTN_SAVE", "Guardar proyecto")}
            </button>
          </div>
        </aside>

        {/* Panel derecho: sugerencias */}
        <section className="panel">
          {/* T() en el título */}
          <div className="side-title">{T("SUGGESTIONS_TITLE", "Plantillas sugeridas")}</div>
          {/* T() en la ayuda (usando dangerouslySetInnerHTML para los <b>) */}
          <p 
              className="side-help"
              // Usamos dangerouslySetInnerHTML para renderizar los tags <b> dentro de la traducción
              dangerouslySetInnerHTML={{ __html: contextText + domainText }}
          />

          {templates.length === 0 ? (
            /* T() en estado vacío */
            <p className="muted">{T("SUGGESTIONS_EMPTY", "No hay sugerencias para este contexto.")}</p>
          ) : (
            <ul className="list">
              {/* Los textos t.name y t.why ya vienen traducidos desde suggest() */}
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