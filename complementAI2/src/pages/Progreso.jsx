// src/pages/Progreso.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import UserMenu from "../components/UserMenu"; // Asegúrate de que la ruta sea correcta
import { translations } from "../translations"; // Asegúrate de tener este archivo con las claves

// === KB compacto (igual estructura que tu Assistant) ===
const KB = {
    // ... (KB permanece igual)
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

export default function Progreso() {
    const navigate = useNavigate();

    // 🎯 1. ESTADO PARA IDIOMA (Cargado desde prefs del assistant)
    const [language, setLanguage] = useState("es");

    // 🎯 2. FUNCIÓN T()
    const T = (key, fallback = key) => {
        // Devuelve el texto plano si es un nombre de artefacto/fase (no traducible por clave)
        if (typeof translations[key] !== 'object' && !translations[language] || !translations[language][key]) {
            if (key === fallback) return fallback;
            if (!translations[language] || !translations[language][key]) return fallback;
        }
        return translations[language][key];
    };

    // 1) Traer contexto y preferencias desde Assistant
    const [ctx, setCtx] = useState(() => {
        const savedSession = JSON.parse(localStorage.getItem("assistant_session") || "null");
        const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
        
        // Inicializa el idioma con las preferencias guardadas
        const initialLang = savedPrefs.language || "es";
        setLanguage(initialLang); 

        return {
            standard: savedSession?.standard || "pmbok",
            phase: savedSession?.phase || KB.pmbok.phases[0],
            industry: savedSession?.industry || "",
        };
    });

    // sincroniza si el usuario vuelve desde Assistant
    useEffect(() => {
        const onFocus = () => {
            const savedSession = JSON.parse(localStorage.getItem("assistant_session") || "null");
            const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");

            // Sincronizar idioma
            const newLang = savedPrefs.language || "es";
            setLanguage(newLang);

            if (savedSession) setCtx({
                standard: savedSession.standard || "pmbok",
                phase: savedSession.phase || KB.pmbok.phases[0],
                industry: savedSession.industry || "",
            });
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    const kb = KB[ctx.standard];

    // 🎯 Usar T() para traducir el nombre de la fase (si existe)
    const currentPhaseLabel = T(ctx.phase, ctx.phase); 
    // 🎯 Usar T() para traducir los nombres de las fases y encontrar el índice
    const phaseIndex = useMemo(() => {
        const phases = kb.phases.map(p => T(p, p));
        return phases.findIndex(p => p === currentPhaseLabel);
    }, [kb, currentPhaseLabel]);
    
    const total = kb.phases.length;
    const percent = Math.round(((phaseIndex + 1) / total) * 100);

    // 2) Construir timeline (con traducciones)
    const timeline = useMemo(() => {
        return kb.phases.map((p, i) => {
            // Traducir el nombre de la fase
            const title = T(p, p); 
            const status = i < phaseIndex ? "done" : i === phaseIndex ? "current" : "next";
            // Traducir los artefactos
            const artifacts = (kb.artifacts?.[p] || []).map(a => T(a, a)).slice(0, 3); // top 3 para no saturar
            return { id: p, title, status, artifacts };
        });
    }, [kb, phaseIndex, T]); // <-- Dependencia en T para que se reactive al cambiar idioma

    return (
        <main className="progreso-page">
            <div className="progreso-container">
                {/* Header */}
                <div className="progreso-header">
                    <div>
                        {/* 🎯 T() */}
                        <h1 className="progreso-h1">{T("PROGRESS_TITLE", "Progreso del Proyecto")}</h1>
                        <div className="progreso-muted">
                            {/* 🎯 T() */}
                            {T("FRAMEWORK_LABEL", "Marco")}: <strong>{kb.label}</strong>
                            {/* 🎯 T() */}
                            {ctx.industry ? <> • {T("INDUSTRY_LABEL", "Industria")}: <strong>{ctx.industry}</strong></> : null}
                        </div>
                    </div>
                    {/* Estilo combinado para flex/gap/wrap (debe ser reubicado en CSS si es posible) */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {/* 🎯 T() */}
                        <button className="progreso-ghost-btn" onClick={() => navigate("/assistant")}>← {T("GO_TO_ASSISTANT_BTN", "Ir al Assistant")}</button>
                        {/* 🎯 T() */}
                        <button className="progreso-primary-btn" onClick={() => navigate(`/wizard?standard=${ctx.standard}&phase=${ctx.phase}`)}>{T("OPEN_WIZARD_BTN", "Abrir Wizard")}</button>
                    </div>
                </div>

                {/* Barra progreso */}
                <div className="progreso-card">
                    {/* 🎯 T() */}
                    <div className="progreso-section-title">{T("GLOBAL_PROGRESS_TITLE", "Avance global")}</div>
                    <div className="progreso-progress-wrap">
                        <div className="progreso-progress-track">
                            {/* Estilo inline para el porcentaje dinámico */}
                            <div className="progreso-progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        {/* Estilo combinado para flex/justify (debe ser reubicado en CSS si es posible) */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                            {/* 🎯 T() */}
                            <span className="progreso-muted">{T("CURRENT_PHASE_LABEL", "Fase actual")}: <strong>{currentPhaseLabel}</strong></span>
                            <span className="progreso-strong">{percent}%</span>
                        </div>
                    </div>
                </div>

                {/* Línea temporal */}
                <div className="progreso-card">
                    {/* 🎯 T() */}
                    <div className="progreso-section-title">{T("TIMELINE_TITLE", "Línea temporal por fases")}</div>

                    {/* bullets horizontales */}
                    <div className="progreso-timeline-track">
                        {timeline.map((t, i) => (
                            <div key={t.id} className="progreso-timeline-item-wrap">
                                {/* Conector */}
                                {i > 0 && <span className={`progreso-connector ${i < phaseIndex ? 'done' : 'next'}`} />}

                                {/* Punto */}
                                <div className={`progreso-dot ${t.status}`} />

                                {/* Etiqueta */}
                                <div className="progreso-timeline-label">
                                    <div className="progreso-phase-title">
                                        {/* 🎯 T() - Traducción del estado de la fase */}
                                        {t.title} {t.status === "current" ? `• ${T("STATUS_CURRENT", "Actual")}` : t.status === "done" ? `• ${T("STATUS_DONE", "Completada")}` : `• ${T("STATUS_NEXT", "Próxima")}`}
                                    </div>
                                    {t.artifacts.length > 0 && (
                                        <ul className="progreso-artifacts">
                                            {t.artifacts.map(a => <li key={a}>{a}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista vertical resumida */}
                <div className="progreso-card">
                    {/* 🎯 T() */}
                    <div className="progreso-section-title">{T("SUMMARY_TITLE", "Resumen por etapa")}</div>
                    {/* Estilo combinado para grid/gap (debe ser reubicado en CSS si es posible) */}
                    <div style={{ display: "grid", gap: 12 }}>
                        {timeline.map((t, i) => (
                            <div key={t.id} className="progreso-row">
                                <span className={`progreso-badge ${t.status}`}>
                                    {i + 1}/{total}
                                </span>
                                <div style={{ flex: 1 }}>{/* Estilo inline para flex (propiedad funcional) */}
                                    <div className="progreso-row-title">{t.title}</div>
                                    <div className="progreso-muted-small">
                                        {/* 🎯 T() - Traducción del estado */}
                                        {t.status === "current" ? T("STATUS_IN_EXECUTION", "En ejecución") : t.status === "done" ? T("STATUS_FINALIZED", "Finalizada") : T("STATUS_PENDING", "Pendiente")}
                                    </div>
                                </div>
                                {/* 🎯 T() - Traducción de 'Artefacto clave' */}
                                {t.artifacts[0] && <div className="progreso-muted-small">{T("KEY_ARTIFACT_LABEL", "Artefacto clave")}: <strong>{t.artifacts[0]}</strong></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🎯 T() - Tip final */}
                <div className="progreso-muted" style={{ marginTop: 4 }}>
                    {T("PROGRESS_TIP", "Tip: cambia el marco/fase en el Assistant y vuelve a esta vista — se actualizará automáticamente.")}
                </div>
            </div>
        </main>
    );
}

// Nota: Elimina la constante 'styles' de aquí.