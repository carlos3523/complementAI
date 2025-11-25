// src/pages/ScrumSprintBacklog.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getSprints,
  getSprintBacklog,
  updateSprintItem,
  addItemToSprint,
  getProductBacklog,
} from "../services/scrum";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

// Estados de la tabla sprint_backlog
const STATUS_COLUMNS = [
  { id: "todo", label: "Por hacer" },
  { id: "in_progress", label: "En progreso" },
  { id: "done", label: "Terminado" },
];

export default function ScrumSprintBacklogPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const initialProjectId = query.get("projectId") || "";
  const initialProjectName = query.get("name") || "";
  const initialSprintId = query.get("sprintId")
    ? Number(query.get("sprintId"))
    : null;

  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectName] = useState(initialProjectName);

  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId);
  const [selectedSprintName, setSelectedSprintName] = useState("");

  const [sprintBacklog, setSprintBacklog] = useState([]);
  const [productBacklog, setProductBacklog] = useState([]);

  const [viewMode, setViewMode] = useState("board"); // "board" | "table"
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [draggingId, setDraggingId] = useState(null);

  const hasProject = !!projectId;

  // Cargar sprints + product backlog al montar
  useEffect(() => {
    if (initialProjectId) {
      loadSprints(initialProjectId);
      loadProductBacklog(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si viene sprintId por URL, seleccionarlo cuando existan los sprints
  useEffect(() => {
    if (initialSprintId && sprints.length > 0) {
      const s = sprints.find((sp) => sp.id === initialSprintId);
      if (s) {
        selectSprint(s.id, s.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSprintId, sprints]);

  // --------- Cargas desde la API ---------

  async function loadSprints(pid = projectId) {
    const id = Number(pid);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }
    setErrMsg("");
    setLoading(true);
    try {
      const data = await getSprints(id);
      setSprints(data || []);
      setProjectId(String(id));
    } catch (err) {
      console.error("Error cargando sprints:", err);
      setErrMsg(err.message || "No se pudieron cargar los sprints");
    } finally {
      setLoading(false);
    }
  }

  async function loadProductBacklog(pid = projectId) {
    const id = Number(pid);
    if (!id) return;
    try {
      const data = await getProductBacklog(id);
      setProductBacklog(data || []);
    } catch (err) {
      console.error("Error cargando product backlog:", err);
    }
  }

  async function loadSprintBacklog(sprintId) {
    if (!sprintId) return;
    setLoading(true);
    setErrMsg("");
    try {
      const data = await getSprintBacklog(sprintId);
      setSprintBacklog(data || []);
    } catch (err) {
      console.error("Error cargando sprint backlog:", err);
      setErrMsg(err.message || "No se pudo cargar el sprint backlog");
      setSprintBacklog([]);
    } finally {
      setLoading(false);
    }
  }

  // --------- Selección de sprint ---------

  const selectSprint = useCallback(
    async (sprintId, sprintName) => {
      setSelectedSprintId(sprintId);
      setSelectedSprintName(sprintName || "");
      // actualizamos parámetros en la URL
      const params = new URLSearchParams(window.location.search);
      params.set("projectId", projectId || "");
      if (projectName) params.set("name", projectName);
      params.set("sprintId", String(sprintId));
      navigate(`/scrum/sprint-backlog?${params.toString()}`, {
        replace: true,
      });
      await loadSprintBacklog(sprintId);
    },
    [navigate, projectId, projectName]
  );

  // --------- Acciones sobre ítems del sprint ---------

  async function handleChangeStatus(sbItemId, newStatus) {
    if (!selectedSprintId) return;
    try {
      await updateSprintItem(selectedSprintId, sbItemId, {
        status: newStatus,
      });
      await loadSprintBacklog(selectedSprintId);
    } catch (err) {
      console.error("Error actualizando estado:", err);
      setErrMsg(err.message || "No se pudo cambiar el estado");
    }
  }

  async function handleAddToSprint(pbItemId) {
    if (!selectedSprintId) {
      alert("Primero selecciona un sprint en la columna izquierda.");
      return;
    }
    try {
      await addItemToSprint(selectedSprintId, { pb_item_id: pbItemId });
      await loadSprintBacklog(selectedSprintId);
    } catch (err) {
      console.error("Error añadiendo ítem al sprint:", err);
      setErrMsg(err.message || "No se pudo añadir el ítem al sprint");
    }
  }

  // --------- Drag & drop ---------

  const handleDragStart = (id) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);

  const handleDropOnColumn = (status) => {
    if (!draggingId) return;
    handleChangeStatus(draggingId, status);
    setDraggingId(null);
  };

  // --------- Derivados ---------

  const itemsByStatus = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach((c) => {
      map[c.id] = [];
    });
    sprintBacklog.forEach((item) => {
      const st = item.status || "todo";
      if (!map[st]) map[st] = [];
      map[st].push(item);
    });
    return map;
  }, [sprintBacklog]);

  // --------- Vistas ---------

  const renderTableView = () => {
    if (!selectedSprintId) {
      return (
        <p style={{ opacity: 0.8 }}>
          Selecciona un sprint para ver su backlog.
        </p>
      );
    }

    if (!sprintBacklog.length) {
      return (
        <p style={{ opacity: 0.8 }}>
          Este sprint aún no tiene ítems. Puedes añadirlos desde el Product
          Backlog de abajo.
        </p>
      );
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            marginTop: 8,
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", opacity: 0.85 }}>
              <th style={{ padding: "6px 4px" }}>Título</th>
              <th style={{ padding: "6px 4px" }}>Tipo</th>
              <th style={{ padding: "6px 4px" }}>Estado</th>
              <th style={{ padding: "6px 4px" }}>Asignado</th>
              <th style={{ padding: "6px 4px" }}>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {sprintBacklog.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "6px 4px" }}>{item.title}</td>
                <td style={{ padding: "6px 4px" }}>{item.type}</td>
                <td style={{ padding: "6px 4px" }}>
                  <select
                    className="input"
                    value={item.status}
                    onChange={(e) =>
                      handleChangeStatus(item.id, e.target.value)
                    }
                    style={{ fontSize: 12, padding: "2px 4px" }}
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "6px 4px" }}>
                  {item.assigned_email || "-"}
                </td>
                <td style={{ padding: "6px 4px" }}>
                  {item.priority ?? item.story_points ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBoardView = () => {
    if (!selectedSprintId) {
      return (
        <p style={{ opacity: 0.8 }}>
          Selecciona un sprint para ver su tablero.
        </p>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          alignItems: "flex-start",
          marginTop: 8,
        }}
      >
        {STATUS_COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDropOnColumn(col.id)}
            style={{
              background: "var(--asst-surface-2)",
              borderRadius: 12,
              padding: 10,
              minHeight: 160,
              border: "1px solid var(--asst-border)",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              {col.label}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {itemsByStatus[col.id]?.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    background:
                      col.id === "done"
                        ? "rgba(34,197,94,0.14)"
                        : "var(--asst-surface)",
                    border: "1px solid var(--asst-border)",
                    cursor: "grab",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        marginBottom: 4,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      opacity: 0.85,
                    }}
                  >
                    <span>{item.type}</span>
                    <span>
                      {item.assigned_email
                        ? item.assigned_email
                        : "Sin asignar"}
                    </span>
                    <span>{item.priority ?? item.story_points ?? "-"} pts</span>
                  </div>
                </div>
              ))}

              {!itemsByStatus[col.id]?.length && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                    border: "1px dashed var(--asst-border)",
                    borderRadius: 10,
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  Arrastra ítems aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --------- Render principal ---------

  return (
    <main className="assistant-screen" data-theme="ink">
      {/* Appbar */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <button
            className="asst-appbar-icon"
            onClick={() => navigate("/Assistant")}
          >
            ←
          </button>
          <div className="asst-appbar-title">
            📌 Sprint Backlog
            {selectedSprintName ? ` · ${selectedSprintName}` : ""}
          </div>
        </div>

        <div
          className="asst-appbar-actions"
          style={{ display: "flex", gap: 8 }}
        >
          <button
            className="asst-appbar-btn"
            onClick={() => navigate("/dashboard")}
          >
            Ver proyectos
          </button>
          <button
            className="asst-appbar-btn"
            onClick={() =>
              navigate(
                `/scrum/sprints?projectId=${
                  projectId || ""
                }&name=${encodeURIComponent(projectName || "")}`
              )
            }
          >
            Sprint Planning
          </button>
          <div className="asst-appbar-user">{user?.email}</div>
        </div>
      </div>

      <div className="asst-wrap" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        {/* Columna izquierda: proyecto + sprints */}
        <section className="asst-card">
          <h2>Proyecto</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Indica el ID del proyecto Scrum para ver sus sprints y su Sprint
            Backlog.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="field">
                <span className="field-label">ID de proyecto</span>
                <input
                  className="input"
                  type="number"
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Ej: 101"
                />
              </label>
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  loadSprints(projectId);
                  loadProductBacklog(projectId);
                }}
                disabled={loading}
              >
                Cargar sprints
              </button>
            </div>
          </div>

          {projectName && (
            <p style={{ marginTop: 6, opacity: 0.9 }}>
              <strong>Proyecto:</strong> {projectName}
            </p>
          )}

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Sprints del proyecto</h3>
          {loading && <p style={{ opacity: 0.8 }}>Cargando…</p>}
          {!loading && !sprints.length && (
            <p style={{ opacity: 0.8 }}>No hay sprints aún.</p>
          )}

          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {sprints.map((s) => (
              <li
                key={s.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  marginBottom: 6,
                  background:
                    selectedSprintId === s.id
                      ? "#1f2937"
                      : "var(--asst-surface-2)",
                  cursor: "pointer",
                }}
                onClick={() => selectSprint(s.id, s.name)}
              >
                <div style={{ fontWeight: "bold" }}>{s.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {s.start_date || "?"} → {s.end_date || "?"} ·{" "}
                  {s.status || "planned"}
                </div>
                {s.goal && (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{s.goal}</div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Columna derecha: Sprint backlog + Product backlog */}
        <section className="asst-card">
          {errMsg && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: "#3b0f15",
                color: "#ffb3b3",
                fontSize: 14,
              }}
            >
              {errMsg}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ marginBottom: 4 }}>Sprint Backlog</h2>
              {selectedSprintName && (
                <p style={{ opacity: 0.8, fontSize: 13 }}>
                  Sprint seleccionado: <strong>{selectedSprintName}</strong>
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className={
                  viewMode === "board" ? "btn-primary" : "asst-btn"
                }
                onClick={() => setViewMode("board")}
              >
                📋 Vista tablero
              </button>
              <button
                type="button"
                className={
                  viewMode === "table" ? "btn-primary" : "asst-btn"
                }
                onClick={() => setViewMode("table")}
              >
                📊 Vista tabla
              </button>
            </div>
          </div>

          {loading && (
            <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando backlog…</p>
          )}

          {!loading &&
            (viewMode === "board" ? renderBoardView() : renderTableView())}

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Product Backlog (añadir ítems al sprint)</h3>
          {!productBacklog.length && (
            <p style={{ opacity: 0.8 }}>
              No hay ítems en el Product Backlog de este proyecto.
            </p>
          )}
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {productBacklog.map((pb) => (
              <li
                key={pb.id}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  marginBottom: 6,
                  background: "var(--asst-surface-2)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>
                    {pb.title}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {pb.type} · prioridad {pb.priority ?? 3}
                  </div>
                </div>
                <button
                  className="asst-btn"
                  type="button"
                  onClick={() => handleAddToSprint(pb.id)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Añadir al sprint
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
