import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// Asume que estos existen en tu proyecto
import AuthButton from "../components/AuthButton"; 
import { useAuth } from "../contexts/AuthContext"; 

import "./assistant.css"; 

// =================================================================================
// 🚨 ZONA DE DATOS DE BACKEND (Ahora vacía)
// 💡 DEBES LLENAR ESTAS CONSTANTES CON LLAMADAS A TU API EN EL hook useEffect
// =================================================================================

const now = () => Date.now();

// 💡 Simulamos el usuario actual y su rol (DEBES REEMPLAZAR CON useAuth)
// **NOTA:** Dejamos el mockCurrentUser para que la lógica de roles (ScrumMaster) siga funcionando
// hasta que implementes useAuth real.
const mockCurrentUser = { id: 0, username: "UsuarioDesconocido", role: "teamMember" }; 

// Lista de impedimentos inicial (Vacía, se llenará con la API)
const initialImpediments = []; 

// Lista de proyectos inicial (Vacía, se llenará con la API)
const mockProjects = [];

// =================================================================================
// 🚨 COMPONENTE FORMULARIO
// =================================================================================

function ImpedimentForm({ initialData, onSave, onCancel, isScrumMaster, currentUser }) {
    const isEditing = !!initialData;
    
    // El creador solo puede ser quien reportó (initialData.reportedByUserId) o el SM
    const canEditDescription = isScrumMaster || !isEditing || initialData?.reportedByUserId === currentUser.id;

    const [formData, setFormData] = useState({
        description: initialData?.description || "",
        // Si no hay proyectos, ponemos un valor por defecto que luego será reemplazado
        projectId: initialData?.projectId || (mockProjects.length > 0 ? mockProjects[0].id : ""), 
        resolved: initialData?.resolved || false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.description.trim()) {
            alert("La descripción es obligatoria.");
            return;
        }
        if (!formData.projectId) {
            alert("Debe seleccionar un proyecto.");
            return;
        }

        // Construye el objeto a guardar, incluyendo el ID si existe
        onSave({ 
            ...initialData, 
            ...formData,
            // Asignar reportado por solo si es creación
            reportedBy: initialData?.reportedBy || currentUser.username,
            reportedByUserId: initialData?.reportedByUserId || currentUser.id,
        });
    };

    return (
        <div className="asst-card" style={{ padding: 20, margin: '20px 0', maxWidth: 600 }}>
            <h2>{isEditing ? `📝 Editar Impedimento ${initialData?.id ? `#${initialData.id}` : ''}` : "➕ Reportar Nuevo Impedimento"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                
                {/* 1. Proyecto (project_id) */}
                <label className="asst-label">
                    Proyecto:
                    <select name="projectId" value={formData.projectId} onChange={handleChange} className="asst-select" required disabled={mockProjects.length === 0}>
                         {mockProjects.length === 0 ? (
                            <option value="">Cargando Proyectos...</option>
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

                {/* 2. Descripción (description) */}
                <label className="asst-label">
                    Descripción del Impedimento:
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={5} 
                        className="asst-input"
                        placeholder="Detalle el bloqueo o problema que impide el avance..."
                        required 
                        disabled={!canEditDescription}
                    />
                    {!canEditDescription && (
                        <small style={{ color: 'var(--color-danger)' }}>
                            Solo el Scrum Master o el reportador pueden editar la descripción.
                        </small>
                    )}
                </label>
                
                {/* 3. Resuelto (resolved) - Solo visible y editable por el Scrum Master */}
                {(isEditing && isScrumMaster) && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input 
                            type="checkbox" 
                            name="resolved" 
                            checked={formData.resolved} 
                            onChange={handleChange} 
                            disabled={!isScrumMaster} // Solo el SM puede modificar esto
                        />
                        Marcar como Resuelto (Acción de SM)
                    </label>
                )}
                
                {/* Botones de acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className="asst-btn" onClick={onCancel}>
                        Cancelar
                    </button>
                    {/* Permitir guardar si es SM o si se está creando (todos pueden crear) */}
                    {(isScrumMaster || !isEditing) && ( 
                        <button type="submit" className="asst-btn primary" disabled={mockProjects.length === 0}>
                            {isEditing ? "Guardar Cambios" : "Reportar Impedimento"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}


// =================================================================================
// 🚨 COMPONENTE TABLA DE IMPEDIMENTOS
// =================================================================================

function ImpedimentsTable({ impediments, onToggleResolve, onEdit, isScrumMaster, currentUser }) {
    const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'resolved'

    const filteredImpediments = impediments.filter(imp => {
        if (filter === 'pending') return !imp.resolved;
        if (filter === 'resolved') return imp.resolved;
        return true; // 'all'
    }).sort((a, b) => b.createdAt - a.createdAt); // Ordenar por fecha más reciente

    return (
        <div className="asst-card" style={{ padding: 20, margin: '20px 0' }}>
            <h2>📋 Backlog de Impedimentos</h2>
            
            <div style={{ marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                    className={`asst-btn ${filter === 'pending' ? 'primary' : ''}`} 
                    onClick={() => setFilter('pending')}
                >
                    Pendientes ({impediments.filter(i => !i.resolved).length})
                </button>
                <button 
                    className={`asst-btn ${filter === 'resolved' ? 'primary' : ''}`} 
                    onClick={() => setFilter('resolved')}
                >
                    Resueltos ({impediments.filter(i => i.resolved).length})
                </button>
                <button 
                    className={`asst-btn ${filter === 'all' ? 'primary' : ''}`} 
                    onClick={() => setFilter('all')}
                >
                    Todos
                </button>
            </div>

            <table className="impediments-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ width: '5%', textAlign: 'left', padding: '10px 0' }}>ID</th>
                        <th style={{ width: '40%', textAlign: 'left', padding: '10px 0' }}>Descripción</th>
                        <th style={{ width: '15%', textAlign: 'left', padding: '10px 0' }}>Proyecto</th>
                        <th style={{ width: '15%', textAlign: 'left', padding: '10px 0' }}>Reportado Por</th>
                        <th style={{ width: '10%', textAlign: 'center', padding: '10px 0' }}>Reporte</th>
                        <th style={{ width: '5%', textAlign: 'center', padding: '10px 0' }}>Resuelto</th>
                        <th style={{ width: '10%', textAlign: 'center', padding: '10px 0' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredImpediments.map((imp) => {
                        const canEdit = isScrumMaster || imp.reportedByUserId === currentUser.id;
                        return (
                        <tr key={imp.id} className={imp.resolved ? 'resolved-row' : 'pending-row'}>
                            <td>{imp.id}</td>
                            <td style={{ fontWeight: imp.resolved ? 'normal' : 'bold' }}>{imp.description}</td>
                            <td>{imp.projectName}</td>
                            <td>{imp.reportedBy}</td>
                            <td style={{ textAlign: 'center' }}>{new Date(imp.createdAt).toLocaleDateString()}</td>
                            <td style={{ textAlign: 'center' }}>
                                {/* Solo el Scrum Master puede usar este toggle rápido */}
                                <input
                                    type="checkbox"
                                    checked={imp.resolved}
                                    onChange={() => isScrumMaster && onToggleResolve(imp.id, imp.resolved)}
                                    disabled={!isScrumMaster} 
                                    title={isScrumMaster ? 'Marcar como Resuelto' : 'Solo el SM puede cambiar el estado'}
                                />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {canEdit && (
                                    <button 
                                        className="asst-btn-small" 
                                        onClick={() => onEdit(imp)}
                                    >
                                        Editar
                                    </button>
                                )}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
            {filteredImpediments.length === 0 && (
                <p style={{ textAlign: 'center', margin: '20px 0' }}>
                    {impediments.length === 0 ? "No se han reportado impedimentos (o están cargando)." : "No hay impedimentos en este filtro."}
                </p>
            )}
        </div>
    );
}

// =================================================================================
// 🚨 COMPONENTE PRINCIPAL
// =================================================================================

export default function ImpedimentsPage() {
    // 💡 Aquí debes obtener el usuario actual de tu contexto (useAuth)
    // const { user } = useAuth();
    const currentUser = mockCurrentUser; // REEMPLAZAR con el usuario real de useAuth
    const isScrumMaster = currentUser.role === 'scrumMaster'; // La lógica de rol se basa en el usuario

    const navigate = useNavigate();
    const [theme, setTheme] = useState("ink");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    // Estado inicial vacío
    const [impediments, setImpediments] = useState(initialImpediments); 
    
    const [isFormOpen, setIsFormOpen] = useState(false); 
    const [editingImpediment, setEditingImpediment] = useState(null); 
    
    // 💡 TO-DO: Usar un hook useEffect para llamar a ImpedimentService.getImpediments() 
    // y actualizar el estado `impediments` al cargar la página.
    
    // Simula la función de alternar estado de resuelto (resuelve/pend.)
    const handleToggleResolve = (id, currentResolved) => {
        if (!isScrumMaster) return; 
        
        setImpediments(prev => 
            prev.map(imp => 
                imp.id === id ? { ...imp, resolved: !currentResolved } : imp
            )
        );
        // 💡 LLAMADA AL BACKEND: ImpedimentService.updateImpediment(id, { resolved: !currentResolved });
    };

    // Abre el formulario en modo edición
    const handleEdit = (imp) => {
        setEditingImpediment(imp);
        setIsFormOpen(true);
    };

    // Cierra el formulario y resetea el modo edición
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingImpediment(null);
    };

    // Maneja la creación/actualización
    const handleSaveImpediment = (data) => {
        if (data.id) {
            // Edición
            setImpediments(prev => 
                prev.map(imp => 
                    imp.id === data.id ? { ...imp, ...data } : imp
                )
            );
            // 💡 LLAMADA AL BACKEND: ImpedimentService.updateImpediment(data.id, data);
        } else {
            // Creación (Usamos mockProjects solo para simular el nombre en el frontend, debes usar el nombre real del backend)
            const newId = Math.max(...impediments.map(i => i.id), 0) + 1;
            const newImpediment = { 
                ...data, 
                id: newId, 
                createdAt: now(),
                projectName: mockProjects.find(p => p.id === data.projectId)?.name || 'Desconocido', // Esto debería venir del backend
            };
            setImpediments(prev => [newImpediment, ...prev]);
            // 💡 LLAMADA AL BACKEND: ImpedimentService.createImpediment(data);
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
                    <div className="asst-appbar-title">🚨 Gestión de Impedimentos</div>
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
                        <div className="asst-side-title">Acciones de Scrum</div>
                        <button 
                            className="asst-btn primary" 
                            onClick={() => {
                                setEditingImpediment(null);
                                setIsFormOpen(true);
                            }}
                            style={{ width: '100%', marginBottom: 15 }}
                            disabled={mockProjects.length === 0}
                        >
                            + Reportar Nuevo Impedimento
                        </button>
                        
                        <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)', marginTop: 15 }}>
                            <small>Rol Actual: <strong>{currentUser.role}</strong> ({isScrumMaster ? 'Acceso total' : 'Solo reportar'})</small>
                        </div>
                        
                        {/* Aquí puedes añadir tus filtros de proyectos o personas reportadas */}
                        <div className="asst-side-title" style={{ marginTop: 12 }}>Filtros de Proyectos</div>
                        <select className="asst-select" defaultValue="" disabled={mockProjects.length === 0}>
                            {mockProjects.length === 0 ? (
                                <option value="">Cargando Proyectos...</option>
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
                        <ImpedimentForm 
                            initialData={editingImpediment} 
                            onSave={handleSaveImpediment} 
                            onCancel={handleCloseForm}
                            isScrumMaster={isScrumMaster}
                            currentUser={currentUser}
                        />
                    ) : (
                        <ImpedimentsTable 
                            impediments={impediments} 
                            onToggleResolve={handleToggleResolve} 
                            onEdit={handleEdit}
                            isScrumMaster={isScrumMaster}
                            currentUser={currentUser}
                        />
                    )}
                </section>

            </div>
        </main>
    );
}