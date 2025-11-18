import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./assistant.css"; 

// Datos simulados de alertas que vendrían de un WebSocket en producción
const initialAlerts = [
  { id: 1, type: "Lenguaje Ofensivo", content: "El usuario 'Rogue' usó un término vetado en el chat global.", user: "UserA", status: "Pendiente" },
  { id: 2, type: "Spam", content: "El usuario 'AdBot' envió 5 enlaces no solicitados en 30 segundos.", user: "BotY", status: "Pendiente" },
  { id: 3, type: "Resuelto", content: "El ticket #459 por acoso fue cerrado por Admin.", user: "System", status: "Cerrado" },
];

export default function ModeratorVisual({ initialTheme = "ink", fontSize = "medium" }) {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  
  // Estado de la cola de alertas (simula datos en tiempo real)
  const [liveAlerts, setLiveAlerts] = useState(initialAlerts);

  // Lógica de cambio de tema (Diseño de la página)
  const toggleTheme = () => {
    const newTheme = currentTheme === "ink" ? "plum" : "ink";
    setCurrentTheme(newTheme);
    // En una aplicación real, actualizarías el localStorage o el contexto global aquí.
  };

  // Función para simular la llegada de una nueva notificación del sistema
  const addTestAlert = () => {
    const newId = Date.now();
    const newAlert = {
        id: newId, 
        type: "Nueva Infracción", 
        content: `Contenido detectado: [Mensaje Nuevo ${newId.toString().slice(-4)}]`, 
        user: `Usuario${Math.floor(Math.random() * 100)}`, 
        status: "Pendiente"
    };
    setLiveAlerts(prev => [newAlert, ...prev]);
  };
  
  // Función que el moderador usa para iniciar el reporte formal basado en la alerta
  const startReportProcess = (alertId) => {
    const alertData = liveAlerts.find(a => a.id === alertId);
    if (!alertData || alertData.status !== "Pendiente") return;
    
    // Aquí se enviaría el moderador a una vista/modal de 'Crear Reporte' con los datos precargados
    const confirmReport = window.confirm(
        `¿Deseas formalizar el reporte para: "${alertData.content}" (Usuario: ${alertData.user})?`
    );

    if (confirmReport) {
      // Marcar la alerta como "En Proceso" o eliminarla de la cola
      setLiveAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, status: "En Proceso" } : a
      ));
      // En una aplicación real, se navegaría a la página de formalización:
      // navigate('/report/new', { state: { alertData } });
    }
  };
  
  // Filtra alertas pendientes para contarlas
  const pendingAlerts = liveAlerts.filter(a => a.status === 'Pendiente').length;


  return (
    <main
      className="assistant-screen"
      data-theme={currentTheme}
      data-font-size={fontSize}
    >
      {/* 1. Barra de Aplicación con el Botón de Cambio de Diseño */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <div className="asst-appbar-title">🛡️ Panel de Alertas ({pendingAlerts} Pendientes)</div>
        </div>

        <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
          {/* Botón de cambio de diseño/tema */}
          <button
            className="asst-appbar-btn"
            onClick={toggleTheme}
            title="Cambiar diseño de la página"
          >
            {currentTheme === "ink" ? "🌸 Cambiar a Plum" : "🩵 Cambiar a Ink"}
          </button>
          <button 
             className="asst-appbar-btn" 
             onClick={() => navigate('/dashboard')}
          >
             Volver a Dashboard
          </button>
        </div>
      </div>

      {/* 2. Contenido Principal: Cola de Notificaciones */}
      <div className="asst-wrap" style={{ 
          gridTemplateColumns: "1fr",
          maxWidth: "1000px",
          width: "90vw",
          margin: "0 auto",
      }}>
        <div className="asst-container" style={{ padding: "20px 0" }}>
          
          <section className="asst-hero" style={{ marginBottom: "2rem" }}>
            <div className="asst-hero-content">
              <h1 className="asst-hero-title">Monitoreo de Chat en Vivo</h1>
              <p className="asst-hero-subtitle">
                Haz clic en una alerta **Pendiente** para iniciar el proceso de reporte formal.
              </p>
            </div>
          </section>

          {/* Botón para simular la notificación entrante */}
          <button className="asst-btn primary" onClick={addTestAlert} style={{ marginBottom: '20px' }}>
              Simular Notificación de Infracción
          </button>
          
          {/* Tarjeta de la Cola de Alertas */}
          <div className="asst-section-card">
            <h2 className="asst-title">Cola de Notificaciones de Chat</h2>
            <div className="asst-log-box" style={{ marginTop: "1rem" }}>
              
              {liveAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="asst-log-item"
                  onClick={() => startReportProcess(alert.id)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: alert.status === 'Pendiente' ? 'pointer' : 'default',
                    // Destacar alertas pendientes
                    borderLeft: alert.status === 'Pendiente' ? '4px solid #ef4444' : '4px solid transparent',
                    paddingLeft: '10px',
                    opacity: alert.status === 'Cerrado' ? 0.6 : 1,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold' }}>[{alert.type}]</span> 
                    {' '}{alert.content}
                    <div style={{ fontSize: '0.85em', color: 'var(--asst-muted)' }}>
                       Usuario involucrado: {alert.user}
                    </div>
                  </div>
                  <span style={{ 
                      color: alert.status === 'Pendiente' ? '#ef4444' : (alert.status === 'En Proceso' ? '#f59e0b' : '#059669'),
                      fontWeight: 'bold'
                  }}>
                    {alert.status}
                  </span>
                </div>
              ))}

              {liveAlerts.length === 0 && (
                  <div style={{ padding: '10px', textAlign: 'center', color: 'var(--asst-muted)' }}>
                      No hay alertas de chat pendientes. ¡Todo tranquilo!
                  </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}