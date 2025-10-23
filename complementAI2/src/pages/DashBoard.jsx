import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
// Asume que esta ruta es correcta y que translations.js existe
import { translations } from "../translations"; 

// -------------------------------------------------------------
// Utilidades y Almacenamiento
// -------------------------------------------------------------

/**
 * Carga las preferencias del asistente para obtener el idioma.
 * @returns {string} El código de idioma ('es' por defecto).
 */
const getLanguage = () => {
    try {
        const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
        return savedPrefs.language || "es";
    } catch {
        return "es";
    }
};

const T_GLOBAL = (key, fallback = key) => {
    const lang = getLanguage();
    // Manejo básico de internacionalización fuera del componente React
    if (!translations[lang] || !translations[lang][key]) return fallback;
    return translations[lang][key];
};

/**
 * Genera un ID único (UUID v4 si está disponible, o un fallback basado en tiempo).
 * @returns {string} Un ID único.
 */
const generateUniqueId = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const STORAGE_KEY = "projects";

/**
 * Módulo de gestión de proyectos en localStorage.
 */
const projectStore = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      // Asegura que los proyectos se ordenen por fecha de creación (más reciente primero)
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

/**
 * Formatea una marca de tiempo (timestamp) en un formato legible.
 * @param {number} timestamp - El timestamp de creación.
 * @returns {string} La fecha y hora formateada.
 */
const formatCreationDate = (timestamp) => {
  if (!timestamp) return T_GLOBAL("DATE_UNKNOWN", "Fecha desconocida"); // 🎯 T() en utilidad
  return new Date(timestamp).toLocaleDateString(getLanguage(), { // 🎯 Usa el idioma de la configuración
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// -------------------------------------------------------------
// Componente de la Tarjeta de Proyecto
// -------------------------------------------------------------

const ProjectCard = React.memo(
  ({ project, onDuplicate, onDelete, onEditInWizard, onOpenInAssistant, T }) => {
    // Cálculo memoizado de la fecha
    const formattedDate = useMemo(
      () => formatCreationDate(project.createdAt),
      [project.createdAt]
    );

    // Optimizaciones con useCallback
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

    // Lógica para el texto "...y X más"
    const remainingTemplates = (project.templates || []).length - 5;
    const moreTemplatesText = T("MORE_TEMPLATES", "...y {count} más").replace("{count}", remainingTemplates);


    return (
      <article className="panel project-card">
        <div className="card-header">
          <div className="card-info">
            <h3 className="project-name">{project.name}</h3>
            {/* 🎯 T() para el texto de fecha */}
            <div className="project-date">
              {T("LAST_MODIFIED", "Última modificación: ")} {formattedDate}
            </div>
            <div className="project-badges">
              <span className="badge">
                {(project.methodology || "N/A").toUpperCase()}
              </span>
              <span className="badge">{project.stage || "N/A"}</span>
              {project.domain && (
                <span className="badge subtle">{project.domain}</span>
              )}
            </div>
          </div>

          <div className="card-actions">
            {/* 🎯 T() en botones de acción */}
            <button className="btn-ghost" onClick={handleEdit}>
              {T("WIZARD_BTN_EDIT", "📝 Editar en Wizard")}
            </button>
            <button className="btn-ghost" onClick={handleOpen}>
              {T("ASSISTANT_BTN_OPEN", "💡 Abrir en Asistente")}
            </button>
            <button className="btn-ghost" onClick={handleDuplicateClick}>
              {T("DUPLICATE_BTN", "📄 Duplicar")}
            </button>
            <button className="btn-danger" onClick={handleDeleteClick}>
              {T("DELETE_BTN", "🗑️ Eliminar")}
            </button>
          </div>
        </div>

        {/* Muestra las plantillas */}
        {(project.templates || []).length > 0 && (
          <div className="card-templates">
            <div className="muted template-title">
              {/* 🎯 T() en el título de plantillas */}
              {T("TEMPLATES_TITLE", "Plantillas")} ({project.templates.length})
            </div>
            <ul className="template-list">
              {(project.templates || []).slice(0, 5).map((t, index) => (
                // Usar index como fallback para key si 't.name' no es único
                <li key={t.name || index} className="template-item">
                  {t.name}
                </li>
              ))}
              {remainingTemplates > 0 && (
                <li className="template-item muted">
                  {/* 🎯 T() en el texto de "X más" */}
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
// Componente Principal: DashBoard
// -------------------------------------------------------------

export default function DashBoard() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState("es"); // 🎯 Nuevo estado para el idioma
  const navigate = useNavigate();

  // 🎯 FUNCIÓN T QUE TRADUCE (usa el estado 'language')
  const T = (key, fallback = key) => {
      // Si la clave no está definida o el idioma no existe, devuelve el fallback
      if (!translations[language] || !translations[language][key]) return fallback;
      return translations[language][key];
  };

  // Carga inicial de proyectos y configuración de idioma
  useEffect(() => {
    setIsLoading(true);
    // 🎯 Cargar el idioma desde las preferencias del asistente (si existe)
    setLanguage(getLanguage()); 
    setProjects(projectStore.get());
    setIsLoading(false);
  }, []);

  // Handlers
  const handleDelete = useCallback((id) => {
    // 🎯 T() en el alert
    if (!window.confirm(T("DELETE_CONFIRM", "¿Estás seguro de que quieres eliminar este proyecto?")))
      return;
    const updatedList = projectStore.remove(id);
    setProjects(updatedList);
  }, [T]); // 🎯 Añade T a las dependencias si se usa en useCallback/useMemo

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
      // 🎯 T() en el sufijo de copia
      name: `${projectToDuplicate.name}${T("DUPLICATE_SUFFIX", " (copia)")}`,
      createdAt: Date.now(), // Actualiza la fecha de creación/modificación
    };

    // Agrega el proyecto duplicado y reordena
    const updated = [cloned, ...list];
    projectStore.set(updated);
    setProjects(updated);
  }, [T]); // 🎯 Añade T a las dependencias

  const handleOpenInAssistant = useCallback(
    (p) => {
      // Usando URLSearchParams para un manejo limpio de query strings
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
        <div className="panel loading-state">
          {/* 🎯 T() en el mensaje de carga */}
          {T("LOADING_MSG", "Cargando proyectos... ⏳")}
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="panel empty-state">
          {/* 🎯 T() en el estado vacío */}
          <div className="side-title">{T("EMPTY_TITLE", "Aún no tienes proyectos 😔")}</div>
          <p className="muted">
            {/* 🎯 T() en el cuerpo del estado vacío */}
            {T("EMPTY_BODY_1", "Crea uno desde el")}{" "}
            <Link to="/wizard">Wizard</Link> {T("EMPTY_BODY_2", "o usa el")}{" "}
            <Link to="/assistant">Asistente</Link> {T("EMPTY_BODY_3", "y guarda como proyecto.")}
          </p>
        </div>
      );
    }

    return (
      <div className="cards">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onEditInWizard={handleEditInWizard}
            onOpenInAssistant={handleOpenInAssistant}
            T={T} // 🎯 PASAMOS LA FUNCIÓN T A ProjectCard
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
    T, // 🎯 Añade T a las dependencias
  ]);

  return (
    <main className="dashboard">
      <div className="assistant-wrap">
        <header className="appbar dashboard-header">
          <div className="appbar-left">
            <h1 className="appbar-title">
              <span role="img" aria-label="folder">
                📂
              </span>{" "}
              {/* 🎯 T() en el título de la app */}
              {T("APP_TITLE", "Tus proyectos")}
            </h1>
          </div>
          <Link to="/wizard" className="appbar-btn primary-btn">
            {/* 🎯 T() en el botón de nuevo proyecto */}
            {T("NEW_PROJECT_BTN", "✨ Nuevo Proyecto")}
          </Link>
        </header>

        {content}
      </div>
    </main>
  );
}