// src/pages/ScrumSprints.jsx
import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getSprints,
  createSprint,
  getProductBacklog,
  addItemToSprint,
  getSprintBacklog,
  updateSprintItem,
} from "../services/scrum";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ScrumSprintsPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const initialProjectId = query.get("projectId") || "";
  const projectName = query.get("name") || "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [productBacklog, setProductBacklog] = useState([]);
  const [sprintBacklog, setSprintBacklog] = useState([]);

  const hasProject = !!projectId;

  useEffect(() => {
    if (initialProjectId) {
      loadSprints(initialProjectId);
      loadProductBacklog(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setSprints(data);
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
      setProductBacklog(data);
    } catch (err) {
      console.error("Error cargando product backlog:", err);
    }
  }

  async function loadSprintBacklog(sprintId) {
    try {
      const data = await getSprintBacklog(sprintId);
      setSprintBacklog(data);
    } catch (err) {
      console.error("Error cargando sprint backlog:", err);
      setErrMsg(err.message || "No se pudo cargar el sprint backlog");
    }
  }

  async function handleCreateSprint() {
    const id = Number(projectId);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }
    if (!newSprintName.trim()) {
      setErrMsg("El nombre del sprint es obligatorio");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const sprint = await createSprint(id, {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      setSprints((prev) => [sprint, ...prev]);
      setNewSprintName("");
      setNewSprintGoal("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("Error creando sprint:", err);
      setErrMsg(err.message || "No se pudo crear el sprint");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSprint(id) {
    setSelectedSprintId(id);
    await loadSprintBacklog(id);
  }

  async function handleAddToSprint(pbItemId) {
    if (!selectedSprintId) {
      alert("Primero selecciona un sprint");
      return;
    }
    try {
      const created = await addItemToSprint(selectedSprintId, {
        pb_item_id: pbItemId,
      });
      // recargar backlog del sprint
      await loadSprintBacklog(selectedSprintId);
    } catch (err) {
      console.error("Error añadiendo ítem al sprint:", err);
      setErrMsg(err.message || "No se pudo añadir al sprint");
    }
  }

  async function handleChangeStatus(sbItemId, newStatus) {
    try {
      await updateSprintItem(selectedSprintId, sbItemId, { status: newStatus });
      await loadSprintBacklog(selectedSprintId);
    } catch (err) {
      console.error("Error actualizando estado:", err);
      setErrMsg(err.message || "No se pudo cambiar el estado");
    }
  }

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
          <div className="asst-appbar-title">📆 Sprint Planning</div>
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
                `/scrum/backlog?projectId=${
                  projectId || ""
                }&name=${encodeURIComponent(projectName || "")}`
              )
            }
          >
            Product Backlog
          </button>
          <div className="asst-appbar-user">{user?.email}</div>
        </div>
      </div>

      <div className="asst-wrap" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Columna izquierda: proyecto + sprints */}
        <section className="asst-card">
          <h2>Proyecto</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Indica el ID del proyecto Scrum para gestionar sus sprints.
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
            <p style={{ marginTop: 8, opacity: 0.9 }}>
              <strong>Proyecto:</strong> {projectName}
            </p>
          )}

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Nuevo sprint</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <label className="field">
              <span className="field-label">Nombre</span>
              <input
                className="input"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="Sprint 1, Sprint de planificación, etc."
              />
            </label>
            <label className="field">
              <span className="field-label">Objetivo</span>
              <input
                className="input"
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
                placeholder="Objetivo del sprint"
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Inicio</span>
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Fin</span>
                <input
                  className="input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <button
              className="btn-primary"
              type="button"
              onClick={handleCreateSprint}
              disabled={loading || !hasProject}
            >
              Crear sprint
            </button>
          </div>

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
                onClick={() => handleSelectSprint(s.id)}
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
              }}
            >
              {errMsg}
            </div>
          )}

          <h2>Sprint backlog</h2>
          {!selectedSprintId && (
            <p style={{ opacity: 0.8 }}>
              Selecciona un sprint para ver y gestionar su backlog.
            </p>
          )}

          {selectedSprintId && (
            <>
              {!sprintBacklog.length && (
                <p style={{ opacity: 0.8, marginTop: 8 }}>
                  Este sprint aún no tiene ítems.
                </p>
              )}

              {!!sprintBacklog.length && (
                <table
                  style={{
                    width: "100%",
                    marginTop: 8,
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left", opacity: 0.8 }}>
                      <th style={{ padding: "4px" }}>Título</th>
                      <th style={{ padding: "4px" }}>Tipo</th>
                      <th style={{ padding: "4px" }}>Estado</th>
                      <th style={{ padding: "4px" }}>Asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintBacklog.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: "4px" }}>{item.title}</td>
                        <td style={{ padding: "4px" }}>{item.type}</td>
                        <td style={{ padding: "4px" }}>
                          <select
                            className="input"
                            value={item.status}
                            onChange={(e) =>
                              handleChangeStatus(item.id, e.target.value)
                            }
                            style={{ padding: "2px 4px", fontSize: 12 }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td style={{ padding: "4px" }}>
                          {item.assigned_email || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <hr style={{ margin: "16px 0", borderColor: "#333" }} />

              <h3>Product backlog (añadir al sprint)</h3>
              {!productBacklog.length && (
                <p style={{ opacity: 0.8 }}>
                  No hay ítems en el product backlog de este proyecto.
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
            </>
          )}
        </section>
      </div>
    </main>
  );
}
