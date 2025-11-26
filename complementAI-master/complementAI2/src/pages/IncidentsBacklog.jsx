// src/pages/IncidentsBacklog.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Asume que estos existen en tu proyecto
import AuthButton from "../components/AuthButton";
import { useAuth } from "../contexts/AuthContext";

// Servicios
import { api } from "../services/api";
import {
  getIncidents,
  createIncident,
  updateIncident,
} from "../services/scrum";

// Usa el mismo CSS del asistente si tiene la estructura:
import "./assistant.css";

// =================================================================================
// 🚨 ZONA DE DATOS
// =================================================================================

const now = () => Date.now();
const SEVERITIES = ["low", "medium", "high", "critical"];

// =================================================================================
// 🚨 COMPONENTE FORMULARIO DE INCIDENTE
// =================================================================================

function IncidentForm({ initialData, onSave, onCancel, currentUser, projects }) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    projectId:
      initialData?.projectId || (projects.length > 0 ? projects[0].id : ""),
    severity: initialData?.severity || "medium",
    status: initialData?.status || "open",
  });

  useEffect(() => {
    if (!initialData && projects.length > 0 && !formData.projectId) {
      setFormData((prev) => ({ ...prev, projectId: projects[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) {
      alert(
        "El título y el proyecto son obligatorios. Asegúrate de que haya proyectos cargados."
      );
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
          ? `📝 Editar Incidente #${initialData.id}`
          : "➕ Reportar Nuevo Incidente"}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 15 }}
      >
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
            disabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <option value="">🚫 No hay proyectos cargados</option>
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

        {/* Severidad */}
        <label className="asst-label">
          Severidad:
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="asst-select"
            required
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
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

        {/* Estado (Solo visible en edición) */}
        {isEditing && (
          <label className="asst-label">
            Estado:
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="asst-select"
              required
            >
              <option value="open">Abierto (Open)</option>
              <option value="in_progress">En Progreso (In Progress)</option>
              <option value="resolved">Resuelto (Resolved)</option>
              <option value="closed">Cerrado (Closed)</option>
            </select>
          </label>
        )}

        {/* Botones */}
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
          <button
            type="submit"
            className="asst-btn primary"
            disabled={projects.length === 0}
          >
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

function IncidentTable({ incidents, onEdit }) {
  const [filter, setFilter] = useState("all");

  const filteredIncidents = incidents
    .filter((inc) => {
      if (filter === "open")
        return inc.status === "open" || inc.status === "in_progress";
      if (filter === "resolved")
        return inc.status === "resolved" || inc.status === "closed";
      return true; // all
    })
    .sort((a, b) => {
      const severityOrder = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.createdAt - a.createdAt;
    });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical":
        return { color: "#FF0000", fontWeight: "bold" };
      case "high":
        return { color: "#FFA500", fontWeight: "bold" };
      case "medium":
        return { color: "#CCCC00" };
      case "low":
        return { color: "#00AA00" };
      default:
        return {};
    }
  };

  return (
    <div className="asst-card" style={{ padding: 20, margin: "20px 0" }}>
      <h2>⚠️ Backlog de Incidentes</h2>

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
            filter === "open" ? "primary" : ""
          }`}
          onClick={() => setFilter("open")}
        >
          Activos (
          {
            incidents.filter(
              (i) => i.status === "open" || i.status === "in_progress"
            ).length
          }
          )
        </button>
        <button
          className={`asst-btn ${
            filter === "resolved" ? "primary" : ""
          }`}
          onClick={() => setFilter("resolved")}
        >
          Cerrados (
          {
            incidents.filter(
              (i) => i.status === "resolved" || i.status === "closed"
            ).length
          }
          )
        </button>
        <button
          className={`asst-btn ${filter === "all" ? "primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          Todos ({incidents.length})
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
              style={{ width: "30%", textAlign: "left", padding: "10px 0" }}
            >
              Título
            </th>
            <th
              style={{ width: "15%", textAlign: "center", padding: "10px 0" }}
            >
              Severidad
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
              Estado
            </th>
            <th
              style={{ width: "10%", textAlign: "center", padding: "10px 0" }}
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredIncidents.map((inc) => (
            <tr
              key={inc.id}
              className={
                inc.status === "closed" || inc.status === "resolved"
                  ? "resolved-row"
                  : "pending-row"
              }
            >
              <td>{inc.id}</td>
              <td>{inc.title}</td>
              <td
                style={{
                  textAlign: "center",
                  ...getSeverityStyle(inc.severity),
                }}
              >
                {inc.severity.toUpperCase()}
              </td>
              <td>{inc.projectName}</td>
              <td>{inc.reportedBy}</td>
              <td style={{ textAlign: "center" }}>
                {inc.status.replace("_", " ").toUpperCase()}
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="asst-btn-small"
                  onClick={() => onEdit(inc)}
                >
                  Ver/Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {incidents.length === 0 && (
        <p
          style={{
            textAlign: "center",
            margin: "20px 0",
            color: "var(--color-text-secondary)",
          }}
        >
          No hay incidentes reportados en el sistema.
        </p>
      )}
    </div>
  );
}

// =================================================================================
// 🚨 COMPONENTE PRINCIPAL: IncidentsBacklogPage
// =================================================================================

export default function IncidentsBacklogPage() {
  const { user } = useAuth();

  const currentUser = {
    id: user?.id,
    username: user?.email || user?.username || "UsuarioDesconocido",
  };

  const navigate = useNavigate();
  const [theme] = useState("ink");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [incidents, setIncidents] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

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

  // Cargar incidentes cuando cambia el proyecto
  useEffect(() => {
    async function loadIncidents() {
      if (!selectedProjectId) return;
      setLoading(true);
      setErrMsg("");
      try {
        const data = await getIncidents(Number(selectedProjectId));
        const mapped = (data || []).map((inc) => ({
          id: inc.id,
          title: inc.title,
          description: inc.description,
          projectId: inc.project_id,
          projectName:
            inc.project_name ||
            projects.find((p) => p.id === inc.project_id)?.name ||
            `Proyecto ${inc.project_id}`,
          severity: inc.severity || "medium",
          status: inc.status || "open",
          reportedBy: inc.reported_email || "",
          reportedByUserId: inc.reported_by,
          createdAt: inc.created_at
            ? new Date(inc.created_at).getTime()
            : now(),
        }));
        setIncidents(mapped);
      } catch (err) {
        console.error("Error cargando incidentes:", err);
        setErrMsg("No se pudieron cargar los incidentes");
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [selectedProjectId, projects]);

  const handleEdit = (inc) => {
    setEditingIncident(inc);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingIncident(null);
  };

  const handleSaveIncident = async (data) => {
    const projectIdNum = Number(data.projectId);
    const payload = {
      title: data.title,
      description: data.description,
      project_id: projectIdNum,
      severity: data.severity,
      status: data.status || "open",
    };

    try {
      if (data.id) {
        const updated = await updateIncident(data.id, payload);
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === data.id
              ? {
                  ...inc,
                  title: updated.title ?? data.title,
                  description: updated.description ?? data.description,
                  projectId: updated.project_id ?? projectIdNum,
                  projectName:
                    updated.project_name ||
                    inc.projectName ||
                    `Proyecto ${projectIdNum}`,
                  severity: updated.severity || data.severity,
                  status: updated.status || data.status,
                }
              : inc
          )
        );
      } else {
        const created = await createIncident(projectIdNum, payload);
        const newIncident = {
          id: created.id,
          title: created.title,
          description: created.description,
          projectId: created.project_id,
          projectName:
            created.project_name ||
            projects.find((p) => p.id === created.project_id)?.name ||
            `Proyecto ${created.project_id}`,
          severity: created.severity || "medium",
          status: created.status || "open",
          reportedBy: created.reported_email || currentUser.username,
          reportedByUserId: created.reported_by || currentUser.id,
          createdAt: created.created_at
            ? new Date(created.created_at).getTime()
            : now(),
        };
        setIncidents((prev) => [newIncident, ...prev]);
      }

      handleCloseForm();
    } catch (err) {
      console.error("Error guardando incidente:", err);
      setErrMsg("No se pudo guardar el incidente");
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
          <div className="asst-appbar-title">🚨 Gestión de Incidentes</div>
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
            <div className="asst-side-title">Acciones de Incidentes</div>
            <button
              className="asst-btn primary"
              onClick={() => {
                setEditingIncident(null);
                setIsFormOpen(true);
              }}
              style={{ width: "100%", marginBottom: 15 }}
              disabled={projects.length === 0}
            >
              + Reportar Nuevo Incidente
            </button>

            {projects.length === 0 && (
              <p
                style={{
                  color: "#FF4444",
                  fontSize: "0.9em",
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                ⚠️ Carga de proyectos pendiente
              </p>
            )}

            <div
              style={{
                padding: "8px 0",
                borderTop: "1px solid var(--color-border)",
                marginTop: 15,
              }}
            >
              <small>
                Usuario Actual: <strong>{currentUser.username}</strong>
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
                <option value="">No hay Proyectos</option>
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
            <p style={{ opacity: 0.8 }}>Cargando incidentes…</p>
          )}

          {isFormOpen ? (
            <IncidentForm
              initialData={editingIncident}
              onSave={handleSaveIncident}
              onCancel={handleCloseForm}
              currentUser={currentUser}
              projects={projects}
            />
          ) : (
            <IncidentTable incidents={incidents} onEdit={handleEdit} />
          )}
        </section>
      </div>
    </main>
  );
}
