import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
// Asume que esta ruta es correcta y que translations.js existe
import AuthButton from "../components/AuthButton"; // Asegúrate de que la ruta sea correcta
import { translations } from "../i18n/translations"; // Asegúrate de tener este archivo con las claves

function buildAuthHeader() {
  try {
    // Intento moderno: auth_user con token
    const stored = JSON.parse(localStorage.getItem("auth_user") || "{}");
    const tokenFromAuthUser = stored?.token;

    // Intento legacy: "token" directo
    const tokenFromLS = localStorage.getItem("token");

    const token = tokenFromAuthUser || tokenFromLS;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    const tokenFromLS = localStorage.getItem("token");
    return tokenFromLS ? { Authorization: `Bearer ${tokenFromLS}` } : {};
  }
}

/* ---------- util & i18n setup ---------- */

/** Carga el idioma y el tema del usuario. */
const loadAssistantPrefs = () => {
  try {
    const savedPrefs = JSON.parse(
      localStorage.getItem("assistant_prefs") || "{}"
    );
    const theme = localStorage.getItem("asst_theme") || "ink"; // Cargar el tema actual
    return { language: savedPrefs.language || "es", theme };
  } catch {
    return { language: "es", theme: "ink" };
  }
};

const getLanguage = () => loadAssistantPrefs().language;

/**
 * Función T() para traducir texto usando la configuración global de idioma (fuera de React).
 */
const T_GLOBAL = (lang, key, fallback = key) => {
  if (!translations[lang] || !translations[lang][key]) return fallback;
  return translations[lang][key];
};

const newId = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  String(Date.now()) + Math.random().toString(36).slice(2);

function mapStandardToMethodology(std) {
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
  if (
    p.includes(T("MAP_STAGE_IDEA", "inicio").toLowerCase()) ||
    p.includes("descubr")
  )
    return T("MAP_STAGE_IDEA", "idea");
  if (p.includes(T("MAP_STAGE_PLAN", "plan").toLowerCase()))
    return T("MAP_STAGE_PLAN", "planificacion");
  if (p.includes(T("MAP_STAGE_EXEC", "ejec").toLowerCase()))
    return T("MAP_STAGE_EXEC", "ejecucion");
  if (p.includes(T("MAP_STAGE_CLOSE", "cierre").toLowerCase()))
    return T("MAP_STAGE_CLOSE", "cierre");
  if (p.includes("monitoreo") || p.includes("control"))
    return T("MAP_STAGE_PLAN", "planificacion");
  return T("MAP_STAGE_IDEA", "idea");
}

/* ---------- generador de sugerencias (sin cambios estructurales) ---------- */
function suggest({ stage, methodology, domain }, lang) {
  const T = (key, fallback) => T_GLOBAL(lang, key, fallback);

  // Traducción de los textos base
  const base = {
    [T_GLOBAL(lang, "MAP_STAGE_IDEA", "idea")]: [
      // Usamos la clave traducida para el objeto
      {
        name: T("TPL_CHARTER_NAME", "Project Charter / Acta"),
        why: T(
          "TPL_CHARTER_WHY",
          "Define propósito, alcance y riesgos iniciales."
        ),
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
      {
        name: T("TPL_WBS_NAME", "WBS / EDT"),
        why: T("TPL_WBS_WHY", "Estructura del trabajo por entregables."),
      },
      {
        name: T("TPL_SCHEDULE_NAME", "Cronograma (Gantt)"),
        why: T("TPL_SCHEDULE_WHY", "Secuencia, dependencias y duración."),
      },
      {
        name: T("TPL_RISK_NAME", "Matriz de Riesgos"),
        why: T("TPL_RISK_WHY", "Probabilidad e impacto con respuestas."),
      },
      {
        name: T("TPL_COMMS_NAME", "Plan de Comunicaciones"),
        why: T("TPL_COMMS_WHY", "Qué, cómo y cuándo informar."),
      },
    ],
    [T_GLOBAL(lang, "MAP_STAGE_EXEC", "ejecucion")]: [
      {
        name: T("TPL_MEETING_NAME", "Actas de Reunión"),
        why: T("TPL_MEETING_WHY", "Trazabilidad de acuerdos y tareas."),
      },
      {
        name: T("TPL_CHANGE_NAME", "Control de Cambios"),
        why: T("TPL_CHANGE_WHY", "Impacto en alcance/tiempo/costo."),
      },
      {
        name: T("TPL_KPI_NAME", "KPIs del Proyecto"),
        why: T("TPL_KPI_WHY", "Seguimiento del desempeño."),
      },
    ],
    [T_GLOBAL(lang, "MAP_STAGE_CLOSE", "cierre")]: [
      {
        name: T("TPL_CLOSURE_NAME", "Informe de Cierre"),
        why: T("TPL_CLOSURE_WHY", "Resultados y lecciones aprendidas."),
      },
      {
        name: T("TPL_ACCEPTANCE_NAME", "Acta de Aceptación"),
        why: T("TPL_ACCEPTANCE_WHY", "Entrega formal y conformidad."),
      },
    ],
  };

  const agile = [
    {
      name: T("TPL_AGILE_VISION_NAME", "Product Vision & Roadmap (Ágil)"),
      why: T("TPL_AGILE_VISION_WHY", "Visión compartida e hitos."),
    },
    {
      name: T("TPL_BACKLOG_NAME", "Backlog Priorizado"),
      why: T("TPL_BACKLOG_WHY", "Ordenado por valor y esfuerzo."),
    },
    {
      name: T("TPL_DOR_DOD_NAME", "DoR/DoD"),
      why: T("TPL_DOR_DOD_WHY", "Criterios de entrada/salida por historia."),
    },
  ];
  const pmbok = [
    {
      name: T("TPL_SCOPE_PLAN_NAME", "Plan de Gestión del Alcance"),
      why: T("TPL_SCOPE_PLAN_WHY", "Criterios y control del alcance."),
    },
    {
      name: T("TPL_BUDGET_NAME", "Presupuesto / EVM"),
      why: T("TPL_BUDGET_WHY", "Base de costos y medición de valor."),
    },
  ];
  const iso = [
    {
      name: T("TPL_ISO_PLAN_NAME", "Plan de Dirección (ISO 21502)"),
      why: T("TPL_ISO_PLAN_WHY", "Enfoque integral según ISO."),
    },
    {
      name: T("TPL_BENEFITS_NAME", "Gestión de Beneficios"),
      why: T("TPL_BENEFITS_WHY", "Alineación con la estrategia."),
    },
  ];
  const software = [
    {
      name: T("TPL_SRS_NAME", "SRS (Requisitos)"),
      why: T("TPL_SRS_WHY", "Requisitos claros y verificables."),
    },
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

  const seen = new Set();
  return list.filter((t) => (seen.has(t.name) ? false : seen.add(t.name)));
}

/* ---------- página ---------- */
export default function Wizard() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [language, setLanguage] = useState(getLanguage());
  const [theme, setTheme] = useState(loadAssistantPrefs().theme); // 🎯 Estado para el tema

  // Carga inicial del tema
  useEffect(() => {
    setTheme(loadAssistantPrefs().theme);
  }, []);

  const T = useCallback(
    (key, fallback = key) => T_GLOBAL(language, key, fallback),
    [language]
  );

  // formulario
  const [form, setForm] = useState({
    name: "",
    methodology: "agil",
    stage: T("MAP_STAGE_IDEA", "idea"),
    domain: T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase(),
  });

  // prellenar desde URL
  useEffect(() => {
    const std = search.get("standard");
    const ph = search.get("phase");
    const dom = search.get("domain");

    setForm((f) => ({
      ...f,
      methodology: mapStandardToMethodology(std) || f.methodology,
      stage: mapPhaseToStage(ph, language) || f.stage,
      domain: dom || f.domain,
    }));
  }, [search, language]);

  // sugerencias dinámicas
  const templates = useMemo(() => suggest(form, language), [form, language]);

  const PROJECTS_KEY_BASE = "projects";
  const AUTH_KEY = "auth_user";

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const getProjectsKey = () => {
    const user = getCurrentUser();
    if (!user) return `${PROJECTS_KEY_BASE}_guest`;
    const identifier = user.id || user.email;
    return `${PROJECTS_KEY_BASE}_${identifier}`;
  };

  async function handleSave() {
    try {
      const defaultName =
        T("DEFAULT_PROJECT_NAME", "Proyecto ") +
        new Date().toLocaleDateString();

      const payload = {
        name: form.name || defaultName,
        methodology: form.methodology,
        stage: form.stage,
        domain: form.domain,
        templates: templates.map((t) => ({ name: t.name, why: t.why })),
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(), // 👈 AÑADIDO
        },
        credentials: "include", // 👈 está bien dejarlo
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("Error guardando proyecto. Status:", res.status, errText);
        alert("Error guardando proyecto");
        return;
      }

      // const created = await res.json(); // si quieres usar la respuesta

      navigate("/dashboard");
    } catch (err) {
      console.error("Error guardando proyecto (catch):", err);
      alert("Error guardando proyecto");
    }
  }
  // Mapeo de valores internos a textos traducidos para el render
  const translatedStages = {
    [T("MAP_STAGE_IDEA", "idea")]: T("OPT_STAGE_IDEA", "Idea / Inicio"),
    [T("MAP_STAGE_PLAN", "planificacion")]: T(
      "OPT_STAGE_PLAN",
      "Planificación"
    ),
    [T("MAP_STAGE_EXEC", "ejecucion")]: T("OPT_STAGE_EXEC", "Ejecución"),
    [T("MAP_STAGE_CLOSE", "cierre")]: T("OPT_STAGE_CLOSE", "Cierre"),
  };

  // Mapeo de dominio
  const translatedDomains = {
    [T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase()]: T(
      "OPT_DOMAIN_SOFTWARE",
      "Software"
    ),
    [T("OPT_DOMAIN_HEALTH", "salud").toLowerCase()]: T(
      "OPT_DOMAIN_HEALTH",
      "Salud"
    ),
    [T("OPT_DOMAIN_RETAIL", "retail").toLowerCase()]: T(
      "OPT_DOMAIN_RETAIL",
      "Retail"
    ),
    [T("OPT_DOMAIN_BANKING", "banca").toLowerCase()]: T(
      "OPT_DOMAIN_BANKING",
      "Banca"
    ),
    [T("OPT_DOMAIN_EDUCATION", "educacion").toLowerCase()]: T(
      "OPT_DOMAIN_EDUCATION",
      "Educación"
    ),
    [T("OPT_DOMAIN_OTHER", "otro").toLowerCase()]: T(
      "OPT_DOMAIN_OTHER",
      "Otro"
    ),
  };

  // Construcción del texto de contexto para las sugerencias
  const contextText = T(
    "SUGGESTIONS_CONTEXT",
    "Según <b>{methodology}</b> y fase <b>{stage}</b>"
  )
    .replace("{methodology}", form.methodology.toUpperCase())
    .replace("{stage}", translatedStages[form.stage] || form.stage);

  const domainText =
    form.domain && form.domain !== "otro"
      ? T("SUGGESTIONS_DOMAIN", " · dominio: {domain}").replace(
          "{domain}",
          translatedDomains[form.domain] || form.domain
        )
      : "";

  return (
    // 🎯 Usamos assistant-screen y data-theme
    <main className="assistant-screen" data-theme={theme}>
      {/* 🎯 Implementamos la barra superior del asistente */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <h1 className="asst-appbar-title">
            <span role="img" aria-label="folder">
              ✨
            </span>{" "}
            {T("WIZARD_TITLE", "Nuevo proyecto")}
          </h1>
        </div>
        <div
          className="asst-appbar-actions"
          style={{ display: "flex", gap: 8 }}
        >
          <Link
            to="/dashboard"
            className="asst-appbar-btn"
            style={{
              background: "var(--asst-surface-2)",
              color: "var(--asst-text)",
              border: "1px solid var(--asst-border)",
            }}
          >
            {T("BTN_VIEW_DASHBOARD", "📂 Ver Proyectos")}
          </Link>
          <AuthButton logoutRedirectTo="/login" />
        </div>
      </div>

      {/* 🎯 Usamos asst-wrap para centrar y aplicar el diseño de GRID (Sidebar + Chat) */}
      <div
        className="asst-wrap"
        style={{ maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* Panel izquierdo: formulario (Simula el asst-side) */}
        <aside className="asst-card" style={{ gridColumn: "span 1" }}>
          <div
            className="asst-side-title"
            style={{ fontSize: "1.2em", fontWeight: "bold" }}
          >
            {T("WIZARD_TITLE", "Nuevo proyecto")}
          </div>

          <p
            className="asst-label"
            style={{
              fontSize: "1em",
              color: "var(--asst-muted)",
              marginBottom: "16px",
            }}
          >
            {T(
              "WIZARD_HELP",
              "Completa el contexto y revisa las plantillas sugeridas."
            )}
          </p>

          <div
            className="grid2"
            style={{
              marginTop: 12,
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <div>
              {/* 🎯 Usamos asst-label y asst-input */}
              <label className="asst-label">{T("LABEL_NAME", "Nombre")}</label>
              <input
                className="asst-input"
                placeholder={T("PH_NAME", "Mi proyecto")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="asst-label">
                {T("LABEL_METHODOLOGY", "Metodología")}
              </label>
              <select
                className="asst-input asst-select"
                value={form.methodology}
                onChange={(e) =>
                  setForm({ ...form, methodology: e.target.value })
                }
              >
                <option value="agil">
                  {T("OPT_AGILE", "Ágil (Scrum/Kanban)")}
                </option>
                <option value="pmbok">{T("OPT_PMBOK", "PMBOK")}</option>
                <option value="iso21502">{T("OPT_ISO", "ISO 21502")}</option>
              </select>
            </div>

            <div>
              <label className="asst-label">{T("LABEL_STAGE", "Fase")}</label>
              <select
                className="asst-input asst-select"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                <option value={T("MAP_STAGE_IDEA", "idea")}>
                  {T("OPT_STAGE_IDEA", "Idea / Inicio")}
                </option>
                <option value={T("MAP_STAGE_PLAN", "planificacion")}>
                  {T("OPT_STAGE_PLAN", "Planificación")}
                </option>
                <option value={T("MAP_STAGE_EXEC", "ejecucion")}>
                  {T("OPT_STAGE_EXEC", "Ejecución")}
                </option>
                <option value={T("MAP_STAGE_CLOSE", "cierre")}>
                  {T("OPT_STAGE_CLOSE", "Cierre")}
                </option>
              </select>
            </div>

            <div>
              <label className="asst-label">
                {T("LABEL_DOMAIN", "Industria / dominio")}
              </label>
              <select
                className="asst-input asst-select"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                <option
                  value={T("OPT_DOMAIN_SOFTWARE", "software").toLowerCase()}
                >
                  {T("OPT_DOMAIN_SOFTWARE", "Software")}
                </option>
                <option value={T("OPT_DOMAIN_HEALTH", "salud").toLowerCase()}>
                  {T("OPT_DOMAIN_HEALTH", "Salud")}
                </option>
                <option value={T("OPT_DOMAIN_RETAIL", "retail").toLowerCase()}>
                  {T("OPT_DOMAIN_RETAIL", "Retail")}
                </option>
                <option value={T("OPT_DOMAIN_BANKING", "banca").toLowerCase()}>
                  {T("OPT_DOMAIN_BANKING", "Banca")}
                </option>
                <option
                  value={T("OPT_DOMAIN_EDUCATION", "educacion").toLowerCase()}
                >
                  {T("OPT_DOMAIN_EDUCATION", "Educación")}
                </option>
                <option value={T("OPT_DOMAIN_OTHER", "otro").toLowerCase()}>
                  {T("OPT_DOMAIN_OTHER", "Otro")}
                </option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            {/* 🎯 Usamos asst-btn y asst-btn.primary */}
            <Link to="/assistant" className="asst-btn">
              {T("BTN_BACK", "← Volver al Asistente")}
            </Link>
            <button className="asst-btn primary" onClick={handleSave}>
              {T("BTN_SAVE", "Guardar proyecto")}
            </button>
          </div>
        </aside>

        {/* Panel derecho: sugerencias (Simula el área de chat) */}
        <section className="asst-card" style={{ gridColumn: "span 1" }}>
          <div
            className="asst-side-title"
            style={{ fontSize: "1.2em", fontWeight: "bold" }}
          >
            {T("SUGGESTIONS_TITLE", "Plantillas sugeridas")}
          </div>

          {/* Estilo para el texto de ayuda del asistente */}
          <p
            className="asst-label"
            style={{
              color: "var(--asst-primary)",
              marginBottom: "20px",
              fontSize: "0.9em",
            }}
            dangerouslySetInnerHTML={{ __html: contextText + domainText }}
          />

          {templates.length === 0 ? (
            <p className="asst-muted" style={{ color: "var(--asst-muted)" }}>
              {T("SUGGESTIONS_EMPTY", "No hay sugerencias para este contexto.")}
            </p>
          ) : (
            <ul className="list" style={{ listStyle: "none", padding: 0 }}>
              {templates.map((t) => (
                // 🎯 Estilo de lista moderno
                <li
                  key={t.name}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--asst-border)",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--asst-text)" }}>
                    {t.name}
                  </div>
                  <div
                    className="asst-muted"
                    style={{ fontSize: 14, color: "var(--asst-muted)" }}
                  >
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
