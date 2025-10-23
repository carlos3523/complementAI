// src/pages/Progreso.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectsApi } from "../services/projects";

/* ============== KB por metodología (solo visual) ============== */
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
    mapStage(stage) {
      const s = (stage || "").toLowerCase();
      if (s === "idea") return "Inicio";
      if (s === "planificacion") return "Planificación";
      if (s === "ejecucion") return "Ejecución";
      if (s === "cierre") return "Cierre";
      return "Inicio";
    },
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
    mapStage(stage) {
      const s = (stage || "").toLowerCase();
      if (s === "idea") return "Inicio";
      if (s === "planificacion") return "Planificación";
      if (s === "ejecucion") return "Ejecución";
      if (s === "cierre") return "Cierre";
      return "Inicio";
    },
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
  agil: {
    label: "Scrum / Ágil",
    phases: ["Descubrimiento", "Ejecución Iterativa", "Cierre"],
    mapStage(stage) {
      const s = (stage || "").toLowerCase();
      if (s === "idea" || s === "planificacion") return "Descubrimiento";
      if (s === "ejecucion") return "Ejecución Iterativa";
      if (s === "cierre") return "Cierre";
      return "Descubrimiento";
    },
    artifacts: {
      Descubrimiento: ["Visión de Producto", "Product Backlog"],
      "Ejecución Iterativa": ["Sprint Backlog", "Increment", "DoD/DoR"],
      Cierre: ["Release Notes", "Retro final"],
    },
  },
};

/* ======= estilos ======= */
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 10% 0%, #1a1030 0%, #0b0d10 45%, #080a0d 100%)",
    color: "#fff",
    padding: "24px",
  },
  container: { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 16 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    background: "linear-gradient(180deg,#101215,#0b0d10)",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,.18)",
  },
  sectionTitle: { fontWeight: 600, fontSize: 18, marginBottom: 8 },
  muted: { color: "rgba(255,255,255,.7)" },
  mutedSmall: { color: "rgba(255,255,255,.7)", fontSize: 12 },
  strong: { fontWeight: 700 },
  progressWrap: { display: "grid", gap: 6 },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    background: "rgba(255,255,255,.08)",
  },
  progressBar: {
    height: "100%",
    borderRadius: 8,
    background: "linear-gradient(90deg,#6d28d9,#a21caf)",
  },
  timelineTrack: { display: "grid", gap: 16 },
  timelineItemWrap: {
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    alignItems: "start",
    gap: 12,
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: 11,
    top: -8,
    bottom: -8,
    width: 2,
    borderRadius: 2,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.12)",
  },
  timelineLabel: { display: "grid", gap: 6 },
  phaseTitle: { fontWeight: 600 },
  artifacts: { margin: 0, paddingLeft: 18, color: "rgba(255,255,255,.85)" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,.03)",
  },
  rowTitle: { fontWeight: 600 },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.25)",
    fontSize: 12,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #6d28d9",
    background: "linear-gradient(90deg,#6d28d9,#a21caf)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.15)",
    background: "transparent",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};

/* ======= componente ======= */
export default function Progreso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await projectsApi.list();
        const p = all.find((x) => String(x.id) === String(id));
        if (mounted) setProject(p || null);
      } catch (e) {
        alert(e.message || "No se pudo cargar el proyecto");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading)
    return <main style={{ padding: 24, color: "#fff" }}>Cargando…</main>;
  if (!project)
    return (
      <main style={{ padding: 24, color: "#fff" }}>
        <p>No se encontró el proyecto.</p>
        <button onClick={() => navigate("/dashboard")}>← Volver</button>
      </main>
    );

  // === lógica de progreso ===
  const kb = KB[(project.methodology || "pmbok").toLowerCase()] || KB.pmbok;
  const visiblePhase = kb.mapStage(project.stage);
  const phases = kb.phases;
  const phaseIndex = Math.max(
    0,
    phases.findIndex((x) => x === visiblePhase)
  );
  const total = phases.length || 1;
  const percent = Math.round(((phaseIndex + 1) / total) * 100);
  const timeline = phases.map((ph, i) => {
    const status =
      i < phaseIndex ? "done" : i === phaseIndex ? "current" : "next";
    const artifacts = (kb.artifacts?.[ph] || []).slice(0, 3);
    return { id: ph, title: ph, status, artifacts };
  });
  const wizardHref =
    `/wizard?standard=${encodeURIComponent(project.methodology || "pmbok")}` +
    `&phase=${encodeURIComponent(project.stage || "")}` +
    (project.domain ? `&domain=${encodeURIComponent(project.domain)}` : "");

  // === render ===
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Progreso del Proyecto</h1>
            <div style={styles.muted}>
              <b>{project.name}</b> — Marco: <strong>{kb.label}</strong>
              {project.domain ? (
                <>
                  {" "}
                  · Dominio: <strong>{project.domain}</strong>
                </>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              style={styles.ghostBtn}
              onClick={() => navigate("/assistant")}
            >
              ← Ir al Assistant
            </button>
            <button
              style={styles.primaryBtn}
              onClick={() => navigate(wizardHref)}
            >
              Abrir Wizard
            </button>
          </div>
        </div>

        {/* Barra progreso */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Avance global</div>
          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${percent}%` }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <span style={styles.muted}>
                Fase actual: <strong>{visiblePhase}</strong>
              </span>
              <span style={styles.strong}>{percent}%</span>
            </div>
          </div>
        </div>

        {/* Línea temporal */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Línea temporal por fases</div>
          <div style={styles.timelineTrack}>
            {timeline.map((t, i) => (
              <div key={t.id} style={styles.timelineItemWrap}>
                {i > 0 && (
                  <span
                    style={{
                      ...styles.connector,
                      background:
                        t.status === "done"
                          ? "rgba(34,197,94,.8)"
                          : "rgba(255,255,255,.18)",
                    }}
                  />
                )}
                <div
                  style={{
                    ...styles.dot,
                    background:
                      t.status === "done"
                        ? "#22c55e"
                        : t.status === "current"
                        ? "#60a5fa"
                        : "rgba(255,255,255,.35)",
                    boxShadow:
                      t.status === "current"
                        ? "0 0 0 6px rgba(96,165,250,.15)"
                        : "none",
                  }}
                />
                <div style={styles.timelineLabel}>
                  <div style={styles.phaseTitle}>
                    {t.title}{" "}
                    {t.status === "current"
                      ? "• Actual"
                      : t.status === "done"
                      ? "• Completada"
                      : "• Próxima"}
                  </div>
                  {t.artifacts.length > 0 && (
                    <ul style={styles.artifacts}>
                      {t.artifacts.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen vertical */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Resumen por etapa</div>
          <div style={{ display: "grid", gap: 12 }}>
            {timeline.map((t, i) => (
              <div key={t.id} style={styles.row}>
                <span
                  style={{
                    ...styles.badge,
                    borderColor:
                      t.status === "current"
                        ? "#60a5fa"
                        : t.status === "done"
                        ? "#22c55e"
                        : "rgba(255,255,255,.25)",
                    background:
                      t.status === "current"
                        ? "rgba(96,165,250,.15)"
                        : t.status === "done"
                        ? "rgba(34,197,94,.12)"
                        : "transparent",
                  }}
                >
                  {i + 1}/{phases.length}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={styles.rowTitle}>{t.title}</div>
                  <div style={styles.mutedSmall}>
                    {t.status === "current"
                      ? "En ejecución"
                      : t.status === "done"
                      ? "Finalizada"
                      : "Pendiente"}
                  </div>
                </div>
                {t.artifacts[0] && (
                  <div style={styles.mutedSmall}>
                    Artefacto clave: <strong>{t.artifacts[0]}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...styles.muted, marginTop: 4 }}>
          Tip: si editas este proyecto en el Wizard y cambias la fase, aquí
          verás el avance actualizado.
        </div>
      </div>
    </main>
  );
}
