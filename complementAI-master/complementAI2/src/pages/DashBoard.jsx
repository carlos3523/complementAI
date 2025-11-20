import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../components/AuthButton"; 
import { translations } from "../i18n/translations"; 

// -------------------------------------------------------------
// Utilidades y Almacenamiento (SIN CAMBIOS)
// -------------------------------------------------------------

/**
 * Carga las preferencias del asistente para obtener el idioma y el tema.
 */
const loadAssistantPrefs = () => {
    try {
        const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
        const theme = localStorage.getItem("asst_theme") || "ink"; // Cargar el tema actual
        return { language: savedPrefs.language || "es", theme };
    } catch {
        return { language: "es", theme: "ink" };
    }
};

const getLanguage = () => loadAssistantPrefs().language;

const T_GLOBAL = (key, fallback = key) => {
    const lang = getLanguage();
    if (!translations[lang] || !translations[lang][key]) return fallback;
    return translations[lang][key];
};

const generateUniqueId = () =>
    (crypto?.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const STORAGE_KEY = "projects";

const projectStore = {
    get: () => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        const list = data ? JSON.parse(data) : [];
        return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (error) {
        console.error("Error al leer proyectos de localStorage:", error);
        return [];
      }
    },
    set: (list) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (error) {
        console.error("Error al escribir proyectos en localStorage:", error);
      }
    },
    remove: (id) => {
      const list = projectStore.get();
      const updatedList = list.filter((p) => p.id !== id);
      projectStore.set(updatedList);
      return updatedList;
    },
};

const formatCreationDate = (timestamp) => {
    if (!timestamp) return T_GLOBAL("DATE_UNKNOWN", "Fecha desconocida");
    return new Date(timestamp).toLocaleDateString(getLanguage(), {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// -------------------------------------------------------------
// Componente de la Tarjeta de Proyecto (CLASES MODERNIZADAS)
// -------------------------------------------------------------

const ProjectCard = React.memo(
  ({ project, onDuplicate, onDelete, onEditInWizard, onOpenInAssistant, T }) => {
    const formattedDate = useMemo(
      () => formatCreationDate(project.createdAt),
      [project.createdAt]
    );

    const handleEdit = useCallback(
      () => onEditInWizard(project.id),
      [onEditInWizard, project.id]
    );
    const handleOpen = useCallback(
      () => onOpenInAssistant(project),
      [onOpenInAssistant, project]
    );
    const handleDuplicateClick = useCallback(
      () => onDuplicate(project.id),
      [onDuplicate, project.id]
    );
    const handleDeleteClick = useCallback(
      () => onDelete(project.id),
      [onDelete, project.id]
    );

    const remainingTemplates = (project.templates || []).length - 5;
    const moreTemplatesText = T("MORE_TEMPLATES", "...y {count} más").replace("{count}", remainingTemplates);


    return (
      // 🎯 Usamos asst-card para el estilo de tarjeta del sidebar
      <article className="asst-card project-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--asst-border)', paddingBottom: '12px', marginBottom: '12px' }}>
          <div className="card-info">
            <h3 className="project-name" style={{ fontSize: '1.2em', margin: '0 0 6px', fontWeight: 'bold', color: 'var(--asst-primary)' }}>{project.name}</h3>
            <div className="project-date" style={{ fontSize: '0.85em', color: 'var(--asst-muted)', marginBottom: '8px' }}>
              {T("LAST_MODIFIED", "Última modificación: ")} {formattedDate}
            </div>
            <div className="project-badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* 🎯 Usamos asst-btn para el estilo de badge/tag */}
              <span className="asst-btn" style={{ fontSize: '0.75em', padding: '4px 8px', background: 'var(--asst-surface-2)', border: '1px solid var(--asst-border)' }}>
                {(project.methodology || "N/A").toUpperCase()}
              </span>
              <span className="asst-btn" style={{ fontSize: '0.75em', padding: '4px 8px', background: 'var(--asst-surface-2)', border: '1px solid var(--asst-border)' }}>{project.stage || "N/A"}</span>
              {project.domain && (
                <span className="asst-btn" style={{ fontSize: '0.75em', padding: '4px 8px', background: 'transparent', color: 'var(--asst-muted)' }}>{project.domain}</span>
              )}
            </div>
          </div>

          <div className="card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
            {/* 🎯 Usamos asst-btn.primary para el botón principal */}
            <button className="asst-btn primary" onClick={handleOpen}>
              💡 {T("ASSISTANT_BTN_OPEN", "Abrir en Asistente")}
            </button>
            {/* 🎯 Usamos asst-btn para botones secundarios */}
            <button className="asst-btn" onClick={handleEdit}>
              📝 {T("WIZARD_BTN_EDIT", "Editar en Wizard")}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <button className="asst-btn" onClick={handleDuplicateClick} style={{ flex: 1 }}>
                📄 {T("DUPLICATE_BTN", "Duplicar")}
              </button>
              {/* Usamos un estilo directo para danger, ya que asst-btn no tiene .danger */}
              <button style={{ background: '#dc2626', color: '#fff' }} className="asst-btn" onClick={handleDeleteClick}>
                🗑️ {T("DELETE_BTN", "Eliminar")}
              </button>
            </div>
          </div>
        </div>

        {/* Muestra las plantillas */}
        {(project.templates || []).length > 0 && (
          <div className="card-templates">
            <div className="muted template-title" style={{ fontWeight: 'bold', color: 'var(--asst-muted)' }}>
              {T("TEMPLATES_TITLE", "Plantillas")} ({project.templates.length})
            </div>
            <ul className="template-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {(project.templates || []).slice(0, 5).map((t, index) => (
                // 🎯 Usamos el estilo asst-btn para los ítems de plantilla
                <li key={t.name || index} className="asst-btn" style={{ padding: '6px 10px', fontSize: '0.8em', background: 'var(--asst-surface-2)', border: '1px solid var(--asst-border)' }}>
                  {t.name}
                </li>
              ))}
              {remainingTemplates > 0 && (
                <li className="asst-btn muted" style={{ padding: '6px 10px', fontSize: '0.8em', background: 'transparent', color: 'var(--asst-muted)', border: 'none' }}>
                  {moreTemplatesText}
                </li>
               )}
            </ul>
          </div>
        )}
      </article>
    );
  }
);

// -------------------------------------------------------------
// Componente Principal: DashBoard (CLASES MODERNIZADAS)
// -------------------------------------------------------------

export default function DashBoard() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("ink"); // 🎯 Nuevo estado para el tema
  const navigate = useNavigate();

  const T = useCallback((key, fallback = key) => {
      if (!translations[language] || !translations[language][key]) return fallback;
      return translations[language][key];
  }, [language]); 

  // Carga inicial de proyectos, configuración de idioma y tema
  useEffect(() => {
    setIsLoading(true);
    const prefs = loadAssistantPrefs();
    setLanguage(prefs.language);
    setTheme(prefs.theme); // 🎯 Cargar el tema
    setProjects(projectStore.get());
    setIsLoading(false);
  }, []);

  // Handlers (SIN CAMBIOS ESTRUCTURALES)
  const handleDelete = useCallback((id) => {
    if (!window.confirm(T("DELETE_CONFIRM", "¿Estás seguro de que quieres eliminar este proyecto?")))
      return;
    const updatedList = projectStore.remove(id);
    setProjects(updatedList);
  }, [T]); 

  const handleDuplicate = useCallback((id) => {
    const list = projectStore.get();
    const projectToDuplicate = list.find((x) => x.id === id);

    if (!projectToDuplicate) {
      console.warn(`Proyecto con ID ${id} no encontrado para duplicar.`);
      return;
    }

    const cloned = {
      ...projectToDuplicate,
      id: generateUniqueId(),
      name: `${projectToDuplicate.name}${T("DUPLICATE_SUFFIX", " (copia)")}`,
      createdAt: Date.now(), 
    };

    const updated = [cloned, ...list];
    projectStore.set(updated);
    setProjects(updated);
  }, [T]); 

  const handleOpenInAssistant = useCallback(
    (p) => {
      const params = new URLSearchParams({
        standard: p.methodology || "",
        phase: p.stage || "",
        domain: p.domain || "",
      });
      navigate(`/assistant?${params.toString()}`);
    },
    [navigate]
  );

  const handleEditInWizard = useCallback(
    (id) => {
      navigate(`/wizard?id=${id}`);
    },
    [navigate]
  );

  // Contenido dinámico (memoizado)
  const content = useMemo(() => {
    if (isLoading) {
      return (
        // 🎯 Usamos asst-card para la carga
        <div className="asst-card loading-state" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="asst-side-title">{T("LOADING_MSG", "Cargando proyectos... ⏳")}</div>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        // 🎯 Usamos asst-card para el estado vacío
        <div className="asst-card empty-state" style={{ padding: '30px', textAlign: 'center' }}>
          <div className="asst-side-title" style={{ fontSize: '1.2em' }}>{T("EMPTY_TITLE", "Aún no tienes proyectos 😔")}</div>
          <p className="muted" style={{ color: 'var(--asst-muted)' }}>
            {T("EMPTY_BODY_1", "Crea uno desde el")}{" "}
            <Link to="/wizard" style={{ color: 'var(--asst-primary)' }}>Wizard</Link> {T("EMPTY_BODY_2", "o usa el")}{" "}
            <Link to="/assistant" style={{ color: 'var(--asst-primary)' }}>Asistente</Link> {T("EMPTY_BODY_3", "y guarda como proyecto.")}
          </p>
        </div>
      );
    }

    return (
      // 🎯 Grid para las tarjetas de proyectos
      <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '20px 0' }}>
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onEditInWizard={handleEditInWizard}
            onOpenInAssistant={handleOpenInAssistant}
            T={T}
          />
        ))}
      </div>
    );
  }, [
    isLoading,
    projects,
    handleDelete,
    handleDuplicate,
    handleEditInWizard,
    handleOpenInAssistant,
    T,
  ]);

  return (
    // 🎯 Usamos assistant-screen y data-theme
    <main className="assistant-screen" data-theme={theme}>
      {/* 🎯 Usamos asst-appbar para la cabecera */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <h1 className="asst-appbar-title">
            <span role="img" aria-label="folder">
              📂
            </span>{" "}
            {T("APP_TITLE", "Tus proyectos")}
          </h1>
        </div>
        <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
          <Link to="/wizard" className="asst-appbar-btn" style={{ background: 'var(--asst-primary)', color: '#111' }}>
            {T("NEW_PROJECT_BTN", "✨ Nuevo Proyecto")}
          </Link>
          <AuthButton logoutRedirectTo="/login" /> {/* Agregamos AuthButton para consistencia */}
        </div>
      </div>

      {/* 🎯 Usamos asst-wrap para centrar el contenido y aplicar el máximo ancho */}
      <div className="asst-wrap" style={{ gridTemplateColumns: '1fr', maxWidth: '1200px', margin: '0 auto' }}>
        {content}
      </div>
    </main>
  );
}