// src/pages/ImpedimentsBacklog.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Asume que estos existen en tu proyecto
import AuthButton from "../components/AuthButton";
import { useAuth } from "../contexts/AuthContext";

// Servicios
import { api } from "../services/api";
import {
  getImpediments,
  createImpediment,
  updateImpediment,
} from "../services/scrum";

import "./assistant.css";

// =================================================================================
// UTIL
// =================================================================================

const now = () => Date.now();

// =================================================================================
// 🚨 COMPONENTE FORMULARIO
// =================================================================================

function ImpedimentForm({
  initialData,
  onSave,
  onCancel,
  isScrumMaster,
  currentUser,
  projects,
}) {
  const isEditing = !!initialData;

  // El creador solo puede ser quien reportó o el SM
  const canEditDescription =
    isScrumMaster ||
    !isEditing ||
    initialData?.reportedByUserId === currentUser.id;

  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    projectId:
      initialData?.projectId ||
      (projects.length > 0 ? projects[0].id : ""),
    resolved: initialData?.resolved || false,
  });

  useEffect(() => {
    // si cambian los proyectos (primer load), fijamos proyecto por defecto
    if (!initialData && projects.length > 0 && !formData.projectId) {
      setFormData((prev) => ({ ...prev, projectId: projects[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    onSave({
      ...initialData,
      ...formData,
      reportedBy: initialData?.reportedBy || currentUser.username,
      reportedByUserId: initialData?.reportedByUserId || currentUser.id,
    });
  };

  return (
    <div
      className="asst-card"
      style={{ padding: 20, margin: "20px 0", maxWidth: 600 }}
    >
      <h2>
        {isEditing
          ? `📝 Editar Impedimento ${
              initialData?.id ? `#${initialData.id}` : ""
            }`
          : "➕ Reportar Nuevo Impedimento"}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 15 }}
      >
        {/* 1. Proyecto (project_id) */}
        <label className="asst-label">
          Proyecto:
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="asst-select"
            required
            disabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <option value="">Cargando Proyectos...</option>
            ) : (
              <>
                <option value="" disabled>
                  Seleccione un proyecto
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Proyecto ${p.id}`}
                  </option>
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
            <small style={{ color: "var(--color-danger)" }}>
              Solo el Scrum Master o el reportador pueden editar la
              descripción.
            </small>
          )}
        </label>

        {/* 3. Resuelto (resolved) - Solo visible y editable por el Scrum Master */}
        {isEditing && isScrumMaster && (
          <label
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <input
              type="checkbox"
              name="resolved"
              checked={formData.resolved}
              onChange={handleChange}
              disabled={!isScrumMaster}
            />
            Marcar como Resuelto (Acción de SM)
          </label>
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 10,
          }}
        >
          <button type="button" className="asst-btn" onClick={onCancel}>
            Cancelar
          </button>
          {(isScrumMaster || !isEditing) && (
            <button
              type="submit"
              className="asst-btn primary"
              disabled={projects.length === 0}
            >
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

function ImpedimentsTable({
  impediments,
  onToggleResolve,
  onEdit,
  isScrumMaster,
  currentUser,
}) {
  const [filter, setFilter] = useState("pending"); // 'all', 'pending', 'resolved'

  const filteredImpediments = impediments
    .filter((imp) => {
      if (filter === "pending") return !imp.resolved;
      if (filter === "resolved") return imp.resolved;
      return true; // 'all'
    })
    .sort((a, b) => b.createdAt - a.createdAt); // más recientes primero

  return (
    <div className="asst-card" style={{ padding: 20, margin: "20px 0" }}>
      <h2>📋 Backlog de Impedimentos</h2>

      <div
        style={{
          marginBottom: 15,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          className={`asst-btn ${
            filter === "pending" ? "primary" : ""
          }`}
          onClick={() => setFilter("pending")}
        >
          Pendientes ({impediments.filter((i) => !i.resolved).length})
        </button>
        <button
          className={`asst-btn ${
            filter === "resolved" ? "primary" : ""
          }`}
          onClick={() => setFilter("resolved")}
        >
          Resueltos ({impediments.filter((i) => i.resolved).length})
        </button>
        <button
          className={`asst-btn ${
            filter === "all" ? "primary" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
      </div>

      <table
        className="impediments-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th style={{ width: "5%", textAlign: "left", padding: "10px 0" }}>
              ID
            </th>
            <th
              style={{ width: "40%", textAlign: "left", padding: "10px 0" }}
            >
              Descripción
            </th>
            <th
              style={{ width: "15%", textAlign: "left", padding: "10px 0" }}
            >
              Proyecto
            </th>
            <th
              style={{ width: "15%", textAlign: "left", padding: "10px 0" }}
            >
              Reportado Por
            </th>
            <th
              style={{ width: "10%", textAlign: "center", padding: "10px 0" }}
            >
              Reporte
            </th>
            <th
              style={{ width: "5%", textAlign: "center", padding: "10px 0" }}
            >
              Resuelto
            </th>
            <th
              style={{ width: "10%", textAlign: "center", padding: "10px 0" }}
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredImpediments.map((imp) => {
            const canEdit =
              isScrumMaster || imp.reportedByUserId === currentUser.id;
            return (
              <tr
                key={imp.id}
                className={imp.resolved ? "resolved-row" : "pending-row"}
              >
                <td>{imp.id}</td>
                <td
                  style={{
                    fontWeight: imp.resolved ? "normal" : "bold",
                  }}
                >
                  {imp.description}
                </td>
                <td>{imp.projectName}</td>
                <td>{imp.reportedBy}</td>
                <td style={{ textAlign: "center" }}>
                  {new Date(imp.createdAt).toLocaleDateString()}
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={imp.resolved}
                    onChange={() =>
                      isScrumMaster &&
                      onToggleResolve(imp.id, imp.resolved)
                    }
                    disabled={!isScrumMaster}
                    title={
                      isScrumMaster
                        ? "Marcar como Resuelto"
                        : "Solo el SM puede cambiar el estado"
                    }
                  />
                </td>
                <td style={{ textAlign: "center" }}>
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
            );
          })}
        </tbody>
      </table>
      {filteredImpediments.length === 0 && (
        <p style={{ textAlign: "center", margin: "20px 0" }}>
          {impediments.length === 0
            ? "No se han reportado impedimentos (o están cargando)."
            : "No hay impedimentos en este filtro."}
        </p>
      )}
    </div>
  );
}

// =================================================================================
// 🚨 COMPONENTE PRINCIPAL
// =================================================================================

export default function ImpedimentsBacklogPage() {
  const { user } = useAuth();

  const currentUser = {
    id: user?.id,
    username: user?.email || user?.username || "UsuarioDesconocido",
    role: user?.role || "teamMember",
  };

  const isScrumMaster = currentUser.role === "scrumMaster";

  const navigate = useNavigate();
  const [theme] = useState("ink");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [impediments, setImpediments] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingImpediment, setEditingImpediment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Cargar proyectos
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get("/projects");
        const list = res.data || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } catch (err) {
        console.error("Error cargando proyectos:", err);
        setErrMsg("No se pudieron cargar los proyectos");
      }
    }
    loadProjects();
  }, []);

  // Cargar impedimentos cuando cambia el proyecto
  useEffect(() => {
    async function loadImpediments() {
      if (!selectedProjectId) return;
      setLoading(true);
      setErrMsg("");
      try {
        const data = await getImpediments(Number(selectedProjectId));
        const mapped = (data || []).map((imp) => ({
          id: imp.id,
          description: imp.description,
          projectId: imp.project_id,
          projectName:
            imp.project_name ||
            projects.find((p) => p.id === imp.project_id)?.name ||
            `Proyecto ${imp.project_id}`,
          reportedBy: imp.reported_email || "",
          reportedByUserId: imp.reported_by,
          resolved: !!imp.resolved,
          createdAt: imp.created_at
            ? new Date(imp.created_at).getTime()
            : now(),
        }));
        setImpediments(mapped);
      } catch (err) {
        console.error("Error cargando impedimentos:", err);
        setErrMsg("No se pudieron cargar los impedimentos");
        setImpediments([]);
      } finally {
        setLoading(false);
      }
    }

    loadImpediments();
  }, [selectedProjectId, projects]);

  // Alternar resuelto
  const handleToggleResolve = async (id, currentResolved) => {
    if (!isScrumMaster) return;
    try {
      await updateImpediment(id, { resolved: !currentResolved });
      setImpediments((prev) =>
        prev.map((imp) =>
          imp.id === id ? { ...imp, resolved: !currentResolved } : imp
        )
      );
    } catch (err) {
      console.error("Error actualizando impedimento:", err);
      setErrMsg("No se pudo actualizar el impedimento");
    }
  };

  const handleEdit = (imp) => {
    setEditingImpediment(imp);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingImpediment(null);
  };

  const handleSaveImpediment = async (data) => {
    const projectIdNum = Number(data.projectId);

    const payload = {
      description: data.description,
      project_id: projectIdNum,
      resolved: !!data.resolved,
    };

    try {
      if (data.id) {
        const updated = await updateImpediment(data.id, payload);
        setImpediments((prev) =>
          prev.map((imp) =>
            imp.id === data.id
              ? {
                  ...imp,
                  description: updated.description ?? data.description,
                  projectId: updated.project_id ?? projectIdNum,
                  projectName:
                    updated.project_name ||
                    imp.projectName ||
                    `Proyecto ${projectIdNum}`,
                  resolved:
                    updated.resolved != null
                      ? updated.resolved
                      : !!data.resolved,
                }
              : imp
          )
        );
      } else {
        const created = await createImpediment(projectIdNum, payload);
        const newItem = {
          id: created.id,
          description: created.description,
          projectId: created.project_id,
          projectName:
            created.project_name ||
            projects.find((p) => p.id === created.project_id)?.name ||
            `Proyecto ${created.project_id}`,
          reportedBy: created.reported_email || currentUser.username,
          reportedByUserId: created.reported_by || currentUser.id,
          resolved: !!created.resolved,
          createdAt: created.created_at
            ? new Date(created.created_at).getTime()
            : now(),
        };
        setImpediments((prev) => [newItem, ...prev]);
      }
      handleCloseForm();
    } catch (err) {
      console.error("Error guardando impedimento:", err);
      setErrMsg("No se pudo guardar el impedimento");
    }
  };

  return (
    <main
      className={`assistant-screen ${sidebarOpen ? "" : "is-collapsed"}`}
      data-theme={theme}
    >
      {/* 1. Appbar */}
      <div className="asst-appbar">
        <div
          className="asst-appbar-left"
          style={{ display: "flex", gap: 12 }}
        >
          <button
            className="asst-appbar-icon"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Ocultar Panel" : "Mostrar Panel"}
          >
            ☰
          </button>
          <div className="asst-appbar-title">🚨 Gestión de Impedimentos</div>
        </div>

        <div
          className="asst-appbar-actions"
          style={{ display: "flex", gap: 8 }}
        >
          <button
            className="asst-appbar-btn"
            onClick={() => navigate("/assistant")}
          >
            Asistente
          </button>
          <button
            className="asst-appbar-btn"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <AuthButton logoutRedirectTo="/login" />
        </div>
      </div>

      {/* 2. Layout */}
      <div className="asst-wrap">
        {/* Sidebar */}
        <aside className="asst-side">
          <div className="asst-card">
            <div className="asst-side-title">Acciones de Scrum</div>
            <button
              className="asst-btn primary"
              onClick={() => {
                setEditingImpediment(null);
                setIsFormOpen(true);
              }}
              style={{ width: "100%", marginBottom: 15 }}
              disabled={projects.length === 0}
            >
              + Reportar Nuevo Impedimento
            </button>

            <div
              style={{
                padding: "8px 0",
                borderTop: "1px solid var(--color-border)",
                marginTop: 15,
              }}
            >
              <small>
                Rol Actual: <strong>{currentUser.role}</strong> (
                {isScrumMaster ? "Acceso total" : "Solo reportar"})
              </small>
            </div>

            <div
              className="asst-side-title"
              style={{ marginTop: 12 }}
            >
              Filtros de Proyectos
            </div>
            <select
              className="asst-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">Cargando Proyectos...</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Proyecto ${p.id}`}
                  </option>
                ))
              )}
            </select>
          </div>
        </aside>

        {/* Contenido principal */}
        <section className="asst-chat">
          {errMsg && (
            <div
              className="asst-card"
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: "#3b0f15",
                color: "#ffb3b3",
              }}
            >
              {errMsg}
            </div>
          )}

          {loading && !isFormOpen && (
            <p style={{ opacity: 0.8 }}>Cargando impedimentos…</p>
          )}

          {isFormOpen ? (
            <ImpedimentForm
              initialData={editingImpediment}
              onSave={handleSaveImpediment}
              onCancel={handleCloseForm}
              isScrumMaster={isScrumMaster}
              currentUser={currentUser}
              projects={projects}
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
