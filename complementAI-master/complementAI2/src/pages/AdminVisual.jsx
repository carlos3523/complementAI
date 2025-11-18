import React, { useState } from "react";
import "./assistant.css";

// Este componente simula la vista del administrador de nivel medio.
// Recibe los props de tema y tamaño de fuente para mantener la consistencia.
export default function AdminVisual({ theme = "ink", fontSize = "medium" }) {
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === "ink" ? "plum" : "ink"));
  };

  return (
    // 1. Contenedor Raíz: Asegura que herede el tema y la fuente.
    <main
      className="assistant-screen"
      data-theme={currentTheme}
      data-font-size={fontSize}
    >
      {/* 2. Barra de Aplicación: Uniforme con el resto de la aplicación. */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <div className="asst-appbar-title">💼 Admin Panel Regional</div>
        </div>

        <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
          <button
            className="asst-appbar-btn"
            onClick={toggleTheme}
          >
            {currentTheme === "ink" ? "🌸 Plum" : "🩵 Ink"}
          </button>
          <button className="asst-appbar-btn">Mi Perfil</button>
        </div>
      </div>

      {/* 3. Contenedor Principal (ancho completo) */}
      <div className="asst-wrap" style={{ 
          gridTemplateColumns: "1fr",
          maxWidth: "1600px",
          width: "95vw",
          margin: "0 auto",
      }}>
        <div className="asst-container" style={{ padding: "0" }}>
          {/* Encabezado */}
          <section className="asst-hero" style={{ marginBottom: "2rem" }}>
            <div className="asst-hero-content">
              <h1 className="asst-hero-title">Gestión de Contenido y Tareas</h1>
              <p className="asst-hero-subtitle">
                Tareas pendientes, borradores y acceso rápido a usuarios.
              </p>
            </div>
          </section>

          {/* Contenido: Dividido en 3 columnas principales en escritorio, flexible. */}
          <div className="asst-content" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            
            {/* Tarjeta 1: Resumen de Tareas Pendientes */}
            <div className="asst-section-card" style={{ flex: "1 1 300px" }}>
              <h2 className="asst-title">Tareas Pendientes</h2>
              <ul className="asst-stats-list" style={{ marginTop: "1rem" }}>
                <li className="asst-stat-item">
                  <span>Revisar Borradores:</span>
                  <strong style={{ color: '#f59e0b' }}>3</strong> {/* Destacar el número con un color */}
                </li>
                <li className="asst-stat-item">
                  <span>Tickets de Soporte Abiertos:</span>
                  <strong style={{ color: '#ef4444' }}>7</strong>
                </li>
                <li className="asst-stat-item">
                  <span>Actualizaciones Programadas:</span>
                  <strong>1</strong>
                </li>
                <li className="asst-stat-item">
                  <span>Usuarios Nuevos por Aprobar:</span>
                  <strong>2</strong>
                </li>
              </ul>
            </div>

            {/* Tarjeta 2: Acceso Rápido (Acciones Clave) */}
            <div className="asst-section-card" style={{ flex: "1 1 300px" }}>
              <h2 className="asst-title">Acciones Rápidas</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                <button className="asst-btn primary" style={{ width: '100%' }}>
                  📝 Crear Nuevo Artículo
                </button>
                <button className="asst-btn" style={{ width: '100%' }}>
                  🔍 Buscar Usuarios
                </button>
                <button className="asst-btn" style={{ width: '100%' }}>
                  📧 Enviar Alerta Masiva
                </button>
              </div>
            </div>

            {/* Tarjeta 3: Borradores Recientes */}
            <div className="asst-section-card" style={{ flex: "2 1 450px" }}>
              <h2 className="asst-title">Borradores de Contenido</h2>
              <div className="asst-log-box" style={{ marginTop: "1rem", maxHeight: "200px" }}>
                <div className="asst-log-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>[20:15] Artículo: "Guía de Seguridad"</span>
                    <span style={{ color: 'var(--asst-primary)' }}>Pendiente</span>
                </div>
                <div className="asst-log-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>[Ayer] FAQ: "Preguntas Frecuentes V2"</span>
                    <span style={{ color: 'var(--asst-primary)' }}>En Edición</span>
                </div>
                <div className="asst-log-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>[09:00] Noticia: "Lanzamiento Beta"</span>
                    <span style={{ color: 'var(--asst-muted)' }}>Aprobado</span>
                </div>
              </div>
            </div>

            {/* Tarjeta 4: Resumen de Usuarios Locales (Full Width si es necesario) */}
            <div className="asst-section-card" style={{ flex: "1 1 100%" }}>
                <h2 className="asst-title">Usuarios Recientemente Activos</h2>
                <div className="asst-user-list" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="asst-user-item" style={{ borderBottom: 'none', padding: '10px 0', flex: '1 1 200px' }}>
                        <div className="asst-user-avatar" style={{ background: '#7c3aed' }}></div>
                        <div className="asst-user-info">
                            <span className="asst-user-name">Ana G.</span>
                            <span className="asst-user-status asst-online">Online</span>
                        </div>
                    </div>
                    <div className="asst-user-item" style={{ borderBottom: 'none', padding: '10px 0', flex: '1 1 200px' }}>
                        <div className="asst-user-avatar" style={{ background: '#ec4899' }}></div>
                        <div className="asst-user-info">
                            <span className="asst-user-name">Roberto V.</span>
                            <span className="asst-user-status asst-online">Online</span>
                        </div>
                    </div>
                    <div className="asst-user-item" style={{ borderBottom: 'none', padding: '10px 0', flex: '1 1 200px' }}>
                        <div className="asst-user-avatar" style={{ background: '#06b6d4' }}></div>
                        <div className="asst-user-info">
                            <span className="asst-user-name">Elsa L.</span>
                            <span className="asst-user-status asst-away">Ausente</span>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}