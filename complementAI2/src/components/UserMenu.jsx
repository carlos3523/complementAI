// UserMenu.jsx

import React, { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle"; // 👈 Importamos ThemeToggle

// Componente: Menú desplegable y modal de configuración
// Recibe refreshConfig del AssistantPage
export default function UserMenu({ refreshConfig }) {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    // Estados locales para el modal de configuración
    const [assistantStyle, setAssistantStyle] = useState("detallado");
    const [showEmojis, setShowEmojis] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);

    // Cargar usuario y preferencias al montar
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("auth_user") || "null");
        if (storedUser) {
            setUser(storedUser);
        }
        
        // Cargar las preferencias del asistente para inicializar el modal
        const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
        setAssistantStyle(savedPrefs.style || "detallado");
        setShowEmojis(savedPrefs.emojis ?? true);
        setShowTimestamps(savedPrefs.timestamps ?? true);
        setAutoScroll(savedPrefs.autoscroll ?? true);
        
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("auth_user");
        window.location.reload(); 
    };

    // Función para guardar los cambios y notificar al componente padre
    const handleSaveConfig = () => {
        const prefs = {
          style: assistantStyle,
          emojis: showEmojis,
          timestamps: showTimestamps,
          autoscroll: autoScroll,
        };
        localStorage.setItem("assistant_prefs", JSON.stringify(prefs));

        setShowConfig(false); // Cerrar modal

        // Llama a la función en AssistantPage para forzar la relectura de las demás prefs
        if (refreshConfig) {
            refreshConfig(); 
        }
    };

    if (!user) return null; 

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U';

    return (
        <div className="user-menu">
            <button className="user-avatar" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="avatar-circle">{initials}</div>
                <span>{user.name || "Usuario Demo"}</span>
            </button>
            
            {menuOpen && (
                <div className="menu-dropdown">
                    {/* 🎯 INTEGRACIÓN DE ThemeToggle DENTRO DEL MENÚ */}
                    <div className="menu-item-with-toggle">
                        <ThemeToggle />
                    </div>
                    
                    <button onClick={() => {
                        setMenuOpen(false);
                        setShowConfig(true);
                    }}>
                        ⚙️ Configuración Asistente
                    </button>
                    <button onClick={handleLogout} className="btn-danger">
                        🚪 Cerrar Sesión
                    </button>
                </div>
            )}

            {/* Modal de Configuración (no necesita cambios) */}
            {showConfig && (
                <div className="modal-overlay" onClick={() => setShowConfig(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="modal-header">
                            <h3>⚙️ Preferencias de Asistente</h3>
                            <button className="close-x" onClick={() => setShowConfig(false)}>✕</button>
                        </div>
                        
                        <div className="modal-body">
                            
                            <label>Estilo de Respuesta IA:</label>
                            <select 
                                value={assistantStyle} 
                                onChange={(e) => setAssistantStyle(e.target.value)}
                            >
                                <option value="compacto">Compacto (Pasos cortos)</option>
                                <option value="detallado">Detallado (Incluye breves justificaciones)</option>
                            </select>
                            
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={showEmojis} 
                                    onChange={(e) => setShowEmojis(e.target.checked)}
                                />
                                Mostrar Emojis en respuestas
                            </label>

                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={showTimestamps} 
                                    onChange={(e) => setShowTimestamps(e.target.checked)}
                                />
                                Mostrar marcas de tiempo en mensajes
                            </label>
                            
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={autoScroll} 
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                />
                                Habilitar auto-desplazamiento en el chat
                            </label>

                            <button onClick={handleSaveConfig}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Nota: Puedes necesitar agregar el siguiente estilo a tu CSS global 
// para que el ThemeToggle se vea bien dentro del menú desplegable:
/*
.menu-item-with-toggle {
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}
.menu-item-with-toggle .btn-ghost {
    // Asegura que el botón se extienda correctamente o tenga el estilo deseado
    width: 100%;
    text-align: left;
    margin-left: 0 !important;
}
*/