import React, { useState } from "react";
import "./assistant.css";
// Si se usa de forma aislada, es necesario definir estados:
// Asumo 'ink' y 'medium' como valores por defecto si no se reciben por props.

export default function SuperAdminVisual({ theme = "ink", fontSize = "medium" }) {
  // Estado y lógica mínima para simular la barra de aplicación (Appbar)
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  // Función para cambiar de tema (solo simulación)
  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === "ink" ? "plum" : "ink"));
  };

  return (
    // 1. Usar la clase raíz 'assistant-screen' y los data-atributos
    <main
      className="assistant-screen"
      data-theme={currentTheme}
      data-font-size={fontSize}
    >
      {/* 2. Barra de aplicación (copiada de AssistantPage para coherencia) */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <div className="asst-appbar-title">👑 Superadmin Dashboard</div>
        </div>

        <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
          {/* Botón para cambiar de tema (simulado) */}
          <button
            className="asst-appbar-btn"
            onClick={toggleTheme}
          >
            {currentTheme === "ink" ? "🌸 Plum" : "🩵 Ink"}
          </button>
          <button className="asst-appbar-btn">Ajustes</button>
          {/* Aquí iría un componente de usuario o AuthButton */}
        </div>
      </div>

      {/* 3. El contenido del Dashboard se envuelve en 'asst-wrap' o directamente en 'asst-container' */}
      {/* Usaré asst-container ya que no hay sidebar de chat, pero aseguro el padding y centrado. */}
      <div className="asst-wrap" style={{ 
          gridTemplateColumns: "1fr", // Forzar a una sola columna para ancho completo
          maxWidth: "1600px",
          width: "95vw",
          margin: "0 auto",
      }}>
        {/* Usamos asst-container solo para el padding interno y centrado en la cuadrícula */}
        <div className="asst-container" style={{ padding: "0" }}>
          <section className="asst-hero" style={{ marginBottom: "2rem" }}>
            <div className="asst-hero-content">
              <h1 className="asst-hero-title">Vista General del Sistema</h1>
              <p className="asst-hero-subtitle">
                Datos clave y estado del servicio.
              </p>
            </div>
          </section>

          {/* El contenido de las tarjetas */}
          <div className="asst-content" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {/* Tarjeta 1: Usuarios Activos */}
            <div className="asst-section-card" style={{ flex: "1 1 350px" }}>
              <h2 className="asst-title">Usuarios activos</h2>
              <div className="asst-user-list" style={{ marginTop: "1rem" }}>
                <div className="asst-user-item">
                  <div className="asst-user-avatar"></div>
                  <div className="asst-user-info">
                    <span className="asst-user-name">María R.</span>
                    <span className="asst-user-status asst-online">Activo</span>
                  </div>
                </div>

                <div className="asst-user-item">
                  <div className="asst-user-avatar"></div>
                  <div className="asst-user-info">
                    <span className="asst-user-name">Jorge P.</span>
                    <span className="asst-user-status asst-away">Ausente</span>
                  </div>
                </div>

                <div className="asst-user-item">
                  <div className="asst-user-avatar"></div>
                  <div className="asst-user-info">
                    <span className="asst-user-name">Lucía M.</span>
                    <span className="asst-user-status asst-online">Activo</span>
                  </div>
                </div>

                <div className="asst-user-item">
                  <div className="asst-user-avatar"></div>
                  <div className="asst-user-info">
                    <span className="asst-user-name">Administrador 002</span>
                    <span className="asst-user-status asst-offline">Desconectado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Estadísticas */}
            <div className="asst-section-card" style={{ flex: "1 1 350px" }}>
              <h2 className="asst-title">Estadísticas</h2>
              <ul className="asst-stats-list" style={{ marginTop: "1rem" }}>
                <li className="asst-stat-item">
                  <span>Total de usuarios:</span>
                  <strong>128</strong>
                </li>
                <li className="asst-stat-item">
                  <span>Usuarios activos ahora:</span>
                  <strong>42</strong>
                </li>
                <li className="asst-stat-item">
                  <span>Reportes en revisión:</span>
                  <strong>5</strong>
                </li>
                <li className="asst-stat-item">
                  <span>Mantenimiento programado:</span>
                  <strong>No</strong>
                </li>
              </ul>
            </div>

            {/* Tarjeta 3: Registro Reciente (Full Width) */}
            <div className="asst-section-card" style={{ flex: "1 1 100%" }}>
              <h2 className="asst-title">Registro reciente</h2>
              <div className="asst-log-box" style={{ marginTop: "1rem" }}>
                <div className="asst-log-item">[12:04] Usuario "Carlos" inició sesión</div>
                <div className="asst-log-item">[12:03] Se actualizó la lista de permisos</div>
                <div className="asst-log-item">[11:58] Usuario "Admin 001" cerró sesión</div>
                <div className="asst-log-item">[11:55] Nuevo usuario registrado</div>
                <div className="asst-log-item">[11:41] Sincronización completada</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}