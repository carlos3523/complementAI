import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// Asume que estos existen en tu proyecto
import AuthButton from "../components/AuthButton"; 
import { useAuth } from "../contexts/AuthContext"; 
// Importa tus servicios para Incidentes (ej: getIncidents, createIncident, resolveIncident)
// import * as IncidentService from "../services/operations"; 

// Usa el mismo CSS del asistente si tiene la estructura:
import "./assistant.css"; 

// =================================================================================
// 🚨 ZONA DE DATOS DE BACKEND (Ahora Vacía, lista para la conexión)
// =================================================================================

const now = () => Date.now();
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

// 💡 Simulamos el usuario actual y su rol 
const mockCurrentUser = { id: 102, username: "JohnDev", role: "teamMember" }; 

// Lista de incidentes inicial: VACÍA
const initialIncidents = []; 

// Lista de proyectos temporal: VACÍA. El botón de reportar estará deshabilitado.
const mockProjects = []; 

// =================================================================================
// 🚨 COMPONENTE FORMULARIO DE INCIDENTE
// =================================================================================

function IncidentForm({ initialData, onSave, onCancel, currentUser }) {
    const isEditing = !!initialData;
    
    // Si no hay proyectos, tomamos un valor vacío para el select
    const defaultProjectId = mockProjects.length > 0 ? mockProjects[0].id : "";

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        projectId: initialData?.projectId || defaultProjectId, 
        severity: initialData?.severity || 'medium',
        status: initialData?.status || 'open', // El estado por defecto es 'open'
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'closed' : 'open') : value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ahora se valida que existan proyectos (para que el select no esté vacío)
        if (!formData.title.trim() || !formData.projectId) {
            alert("El título y el proyecto son obligatorios. Asegúrate de que haya proyectos cargados.");
            return;
        }

        onSave({ 
            ...initialData, 
            ...formData,
            reportedBy: initialData?.reportedBy || currentUser.username,
            reportedByUserId: initialData?.reportedByUserId || currentUser.id,
        });
    };

    return (
        <div className="asst-card" style={{ padding: 20, margin: '20px 0', maxWidth: 600 }}>
            <h2>{isEditing ? `📝 Editar Incidente #${initialData.id}` : "➕ Reportar Nuevo Incidente"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                
                {/* Título */}
                <label className="asst-label">
                    Título:
                    <input 
                        type="text"
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        className="asst-input"
                        placeholder="Resumen del incidente..."
                        required 
                    />
                </label>

                {/* Proyecto (project_id) */}
                <label className="asst-label">
                    Proyecto Afectado:
                    <select 
                        name="projectId" 
                        value={formData.projectId} 
                        onChange={handleChange} 
                        className="asst-select" 
                        required
                        disabled={mockProjects.length === 0} // Deshabilitado si no hay proyectos
                    >
                        {mockProjects.length === 0 ? (
                            <option value="">🚫 No hay proyectos cargados</option>
                        ) : (
                            <>
                                <option value="" disabled>Seleccione un proyecto</option>
                                {mockProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </>
                        )}
                    </select>
                </label>

                {/* Severidad */}
                <label className="asst-label">
                    Severidad:
                    <select name="severity" value={formData.severity} onChange={handleChange} className="asst-select" required>
                        {SEVERITIES.map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                    </select>
                </label>

                {/* Descripción */}
                <label className="asst-label">
                    Descripción Completa:
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={4} 
                        className="asst-input"
                        placeholder="Detalle el impacto, síntomas y pasos para reproducir..."
                    />
                </label>

                {/* Estado (Solo visible en Edición) */}
                {isEditing && (
                    <label className="asst-label">
                         Estado:
                         <select name="status" value={formData.status} onChange={handleChange} className="asst-select" required>
                            <option value="open">Abierto (Open)</option>
                            <option value="in_progress">En Progreso (In Progress)</option>
                            <option value="resolved">Resuelto (Resolved)</option>
                            <option value="closed">Cerrado (Closed)</option>
                        </select>
                    </label>
                )}
                
                {/* Botones de acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className="asst-btn" onClick={onCancel}>
                        Cancelar
                    </button>
                    {/* El botón de envío está deshabilitado si no hay proyectos para asignar */}
                    <button type="submit" className="asst-btn primary" disabled={mockProjects.length === 0}>
                        {isEditing ? "Guardar Cambios" : "Reportar Incidente"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// =================================================================================
// 🚨 COMPONENTE TABLA DE INCIDENTES
// =================================================================================

function IncidentTable({ incidents, onEdit, currentUser }) {
    const [filter, setFilter] = useState('all'); // Cambiamos el filtro inicial a 'all'
    
    // ... (Lógica de filtrado y estilo permanece igual)
    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'open') return inc.status === 'open' || inc.status === 'in_progress';
        if (filter === 'resolved') return inc.status === 'resolved' || inc.status === 'closed';
        return true; // 'all'
    }).sort((a, b) => {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        if (severityOrder[b.severity] !== severityOrder[a.severity]) {
            return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.createdAt - a.createdAt; 
    });
    
    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical': return { color: '#FF0000', fontWeight: 'bold' };
            case 'high': return { color: '#FFA500', fontWeight: 'bold' };
            case 'medium': return { color: '#CCCC00' };
            case 'low': return { color: '#00AA00' };
            default: return {};
        }
    };

    return (
        <div className="asst-card" style={{ padding: 20, margin: '20px 0' }}>
            <h2>⚠️ Backlog de Incidentes</h2>
            
            <div style={{ marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                    className={`asst-btn ${filter === 'open' ? 'primary' : ''}`} 
                    onClick={() => setFilter('open')}
                >
                    Activos ({incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length})
                </button>
                <button 
                    className={`asst-btn ${filter === 'resolved' ? 'primary' : ''}`} 
                    onClick={() => setFilter('resolved')}
                >
                    Cerrados ({incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length})
                </button>
                <button 
                    className={`asst-btn ${filter === 'all' ? 'primary' : ''}`} 
                    onClick={() => setFilter('all')}
                >
                    Todos ({incidents.length})
                </button>
            </div>

            <table className="impediments-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ width: '5%', textAlign: 'left', padding: '10px 0' }}>ID</th>
                        <th style={{ width: '30%', textAlign: 'left', padding: '10px 0' }}>Título</th>
                        <th style={{ width: '15%', textAlign: 'center', padding: '10px 0' }}>Severidad</th>
                        <th style={{ width: '15%', textAlign: 'left', padding: '10px 0' }}>Proyecto</th>
                        <th style={{ width: '15%', textAlign: 'left', padding: '10px 0' }}>Reportado Por</th>
                        <th style={{ width: '10%', textAlign: 'center', padding: '10px 0' }}>Estado</th>
                        <th style={{ width: '10%', textAlign: 'center', padding: '10px 0' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredIncidents.map((inc) => {
                        return (
                        <tr key={inc.id} className={inc.status === 'closed' || inc.status === 'resolved' ? 'resolved-row' : 'pending-row'}>
                            <td>{inc.id}</td>
                            <td>{inc.title}</td>
                            <td style={{ textAlign: 'center', ...getSeverityStyle(inc.severity) }}>{inc.severity.toUpperCase()}</td>
                            <td>{inc.projectName}</td>
                            <td>{inc.reportedBy}</td>
                            <td style={{ textAlign: 'center' }}>{inc.status.replace('_', ' ').toUpperCase()}</td>
                            <td style={{ textAlign: 'center' }}>
                                <button 
                                    className="asst-btn-small" 
                                    onClick={() => onEdit(inc)}
                                >
                                    Ver/Editar
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
            {incidents.length === 0 && (
                <p style={{ textAlign: 'center', margin: '20px 0', color: 'var(--color-text-secondary)' }}>
                    No hay incidentes reportados en el sistema.
                </p>
            )}
        </div>
    );
}

// =================================================================================
// 🚨 COMPONENTE PRINCIPAL: IncidentsPage
// =================================================================================

export default function IncidentsPage() {
    // 💡 REEMPLAZAR con el usuario real de useAuth
    const currentUser = mockCurrentUser; 
    
    const navigate = useNavigate();
    const [theme, setTheme] = useState("ink");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [incidents, setIncidents] = useState(initialIncidents); 
    
    const [isFormOpen, setIsFormOpen] = useState(false); 
    const [editingIncident, setEditingIncident] = useState(null); 
    
    // Simulación de carga inicial de datos (¡ELIMINADO el hardcode!)
    useEffect(() => {
        // 💡 TO-DO: Aquí llamarías a IncidentService.getIncidents() para cargar datos reales.
        // const simulatedData = []; // Ya no se necesita, usamos initialIncidents
        // setIncidents(simulatedData);
        
        // 💡 TO-DO: También se debe cargar mockProjects aquí (con la función del backend)
    }, []);

    // Abre el formulario en modo edición
    const handleEdit = (inc) => {
        setEditingIncident(inc);
        setIsFormOpen(true);
    };

    // Cierra el formulario y resetea el modo edición
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingIncident(null);
    };

    // Maneja la creación/actualización (Aún necesita lógica para ID temporal si no hay backend)
    const handleSaveIncident = (data) => {
        const project = mockProjects.find(p => p.id === data.projectId);
        
        if (data.id) {
            // Edición
            setIncidents(prev => 
                prev.map(inc => 
                    inc.id === data.id ? { ...inc, ...data, projectName: project?.name } : inc
                )
            );
            // 💡 LLAMADA AL BACKEND: IncidentService.updateIncident(data.id, data);
        } else {
            // Creación
            // Mantenemos la lógica de ID temporal para que el formulario se cierre (aunque esto será reemplazado por la ID del backend)
            const newId = Math.max(...incidents.map(i => i.id), 0) + 1;
            const newIncident = { 
                ...data, 
                id: newId, 
                createdAt: now(),
                projectName: project?.name || 'Desconocido (Proyecto ID: ' + data.projectId + ')', 
                status: 'open', 
            };
            setIncidents(prev => [newIncident, ...prev]);
            // 💡 LLAMADA AL BACKEND: IncidentService.createIncident(data);
        }
        handleCloseForm();
    };


    return (
        <main className={`assistant-screen ${sidebarOpen ? "" : "is-collapsed"}`} data-theme={theme}>
            {/* 1. Appbar (Barra Superior) */}
            <div className="asst-appbar">
                <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
                    <button
                        className="asst-appbar-icon"
                        onClick={() => setSidebarOpen((v) => !v)}
                        title={sidebarOpen ? "Ocultar Panel" : "Mostrar Panel"}
                    >
                        ☰
                    </button>
                    <div className="asst-appbar-title">🚨 Gestión de Incidentes</div>
                </div>

                <div className="asst-appbar-actions" style={{ display: "flex", gap: 8 }}>
                    <button className="asst-appbar-btn" onClick={() => navigate("/assistant")}>
                        Asistente
                    </button>
                    <button className="asst-appbar-btn" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </button>
                    <AuthButton logoutRedirectTo="/login" />
                </div>
            </div>

            {/* 2. Layout */}
            <div className="asst-wrap">
                
                {/* 2.a Sidebar (Funcionalidades Globales/Filtros) */}
                <aside className="asst-side">
                    <div className="asst-card">
                        <div className="asst-side-title">Acciones de Incidentes</div>
                        <button 
                            className="asst-btn primary" 
                            onClick={() => {
                                setEditingIncident(null);
                                setIsFormOpen(true);
                            }}
                            style={{ width: '100%', marginBottom: 15 }}
                            // Deshabilitado si no hay proyectos que mostrar en el formulario
                            disabled={mockProjects.length === 0} 
                        >
                            + Reportar Nuevo Incidente
                        </button>
                        
                        {mockProjects.length === 0 && (
                            <p style={{ color: '#FF4444', fontSize: '0.9em', textAlign: 'center', marginBottom: 10 }}>
                                ⚠️ **Carga de proyectos pendiente**
                            </p>
                        )}
                        
                        <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)', marginTop: 15 }}>
                            <small>Usuario Actual: <strong>{currentUser.username}</strong></small>
                        </div>
                        
                        <div className="asst-side-title" style={{ marginTop: 12 }}>Filtros de Proyectos</div>
                        <select className="asst-select" defaultValue="" disabled={mockProjects.length === 0}>
                            {mockProjects.length === 0 ? (
                                <option value="">No hay Proyectos</option>
                            ) : (
                                <>
                                    <option value="">Todos los Proyectos</option>
                                    {mockProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                        
                    </div>
                </aside>

                {/* 2.b Contenido Principal (La sección asst-chat) */}
                <section className="asst-chat">
                    {isFormOpen ? (
                        <IncidentForm 
                            initialData={editingIncident} 
                            onSave={handleSaveIncident} 
                            onCancel={handleCloseForm}
                            currentUser={currentUser}
                        />
                    ) : (
                        <IncidentTable 
                            incidents={incidents} 
                            onEdit={handleEdit}
                            currentUser={currentUser}
                        />
                    )}
                </section>

            </div>
        </main>
    );
}