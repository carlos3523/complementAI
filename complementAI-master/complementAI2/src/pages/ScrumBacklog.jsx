// src/pages/ScrumBacklog.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getProductBacklog,
  createBacklogItem,
  updateBacklogItem,
  deleteBacklogItem,
} from "../services/scrum";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ScrumBacklogPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const initialProjectId = query.get("projectId") || "";
  const projectName = query.get("name") || "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [backlog, setBacklog] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("story");
  const [priority, setPriority] = useState(3);

  const hasProject = !!projectId;

  // Array seguro
  const safeBacklog = Array.isArray(backlog) ? backlog.filter(Boolean) : [];

  // -------------------------------------------------------
  // LOAD
  // -------------------------------------------------------
  useEffect(() => {
    if (initialProjectId) {
      loadBacklog(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBacklog(pid = projectId) {
    const id = Number(pid);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const data = await getProductBacklog(id);
      const arr = Array.isArray(data) ? data.filter(Boolean) : [];
      setBacklog(arr);
      setProjectId(String(id));
    } catch (err) {
      console.error("Error cargando product backlog:", err);
      setErrMsg(err.message || "No se pudo cargar el product backlog");
      setBacklog([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------
  async function handleCreateItem() {
    const id = Number(projectId);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }
    if (!title.trim()) {
      setErrMsg("El título es obligatorio");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const created = await createBacklogItem(id, {
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority: Number(priority) || 3,
        status: "todo",
      });

      setBacklog((prev) => [created, ...(prev || [])]);
      setTitle("");
      setDescription("");
      setType("story");
      setPriority(3);
    } catch (err) {
      console.error("Error creando ítem de backlog:", err);
      setErrMsg(err.message || "No se pudo crear el ítem");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // UPDATE (status / priority)
  // -------------------------------------------------------
  async function handleChangeStatus(itemId, newStatus) {
    try {
      const updated = await updateBacklogItem(itemId, { status: newStatus });
      setBacklog((prev) =>
        (prev || []).map((it) => (it.id === updated.id ? updated : it))
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
      setErrMsg(err.message || "No se pudo cambiar el estado");
    }
  }

  async function handleChangePriority(itemId, newPriority) {
    try {
      const updated = await updateBacklogItem(itemId, {
        priority: Number(newPriority),
      });
      setBacklog((prev) =>
        (prev || []).map((it) => (it.id === updated.id ? updated : it))
      );
    } catch (err) {
      console.error("Error cambiando prioridad:", err);
      setErrMsg(err.message || "No se pudo cambiar la prioridad");
    }
  }

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------
  async function handleDeleteItem(itemId) {
    if (!window.confirm("¿Eliminar este ítem del backlog?")) return;

    try {
      await deleteBacklogItem(itemId);
      setBacklog((prev) => (prev || []).filter((it) => it.id !== itemId));
    } catch (err) {
      console.error("Error eliminando ítem:", err);
      setErrMsg(err.message || "No se pudo eliminar el ítem");
    }
  }

  // -------------------------------------------------------
  // GROUP BY STATUS (sin reventar)
  // -------------------------------------------------------
  const columns = {
    todo: [],
    in_progress: [],
    done: [],
  };

  safeBacklog.forEach((item) => {
    if (!item) return;
    // Si viene null/undefined, lo mando a "todo"
    const st = item.status || "todo";
    if (!columns[st]) {
      // Si viene algo raro como "pending", también lo mandamos a todo
      columns.todo.push(item);
    } else {
      columns[st].push(item);
    }
  });

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <main className="assistant-screen" data-theme="ink">
      {/* APP BAR */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <button
            className="asst-appbar-icon"
            onClick={() => navigate("/Assistant")}
          >
            ←
          </button>
          <div className="asst-appbar-title">📋 Product Backlog</div>
        </div>

        <div
          className="asst-appbar-actions"
          style={{ display: "flex", gap: 8 }}
        >
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
            Ver Sprints
          </button>
          <div className="asst-appbar-user">{user?.email}</div>
        </div>
      </div>

      <div className="asst-wrap" style={{ gridTemplateColumns: "1fr 2fr" }}>
        {/* LEFT: proyecto + crear ítem */}
        <section className="asst-card">
          <h2>Proyecto</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Indica el ID del proyecto para ver y gestionar su product backlog.
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
            <button
              className="btn-primary"
              type="button"
              onClick={() => loadBacklog(projectId)}
              disabled={loading}
              style={{ alignSelf: "flex-end" }}
            >
              Cargar backlog
            </button>
          </div>

          {projectName && (
            <p style={{ marginTop: 8, opacity: 0.9 }}>
              <strong>Proyecto:</strong> {projectName}
            </p>
          )}

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Nuevo ítem</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <label className="field">
              <span className="field-label">Título</span>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Historia, tarea, bug..."
              />
            </label>
            <label className="field">
              <span className="field-label">Descripción</span>
              <textarea
                className="input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles, criterios de aceptación, etc."
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Tipo</span>
                <select
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="story">Story</option>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="spike">Spike</option>
                </select>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Prioridad</span>
                <select
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value={1}>1 (Alta)</option>
                  <option value={2}>2</option>
                  <option value={3}>3 (Media)</option>
                  <option value={4}>4</option>
                  <option value={5}>5 (Baja)</option>
                </select>
              </label>
            </div>
            <button
              className="btn-primary"
              type="button"
              onClick={handleCreateItem}
              disabled={loading || !hasProject}
            >
              Crear ítem
            </button>
          </div>
        </section>

        {/* RIGHT: columnas Kanban */}
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

          <h2>Product Backlog</h2>

          {loading && <p style={{ opacity: 0.8 }}>Cargando…</p>}
          {!loading && safeBacklog.length === 0 && (
            <p style={{ opacity: 0.8, marginTop: 8 }}>
              No hay ítems en el backlog todavía.
            </p>
          )}

          {safeBacklog.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginTop: 12,
                alignItems: "flex-start",
              }}
            >
              {/* TODO */}
              <div>
                <h3 style={{ fontSize: 14, opacity: 0.9 }}>To Do</h3>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  {columns.todo.map((item) => (
                    <BacklogCard
                      key={item.id}
                      item={item}
                      onChangeStatus={handleChangeStatus}
                      onChangePriority={handleChangePriority}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>

              {/* IN PROGRESS */}
              <div>
                <h3 style={{ fontSize: 14, opacity: 0.9 }}>In Progress</h3>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  {columns.in_progress.map((item) => (
                    <BacklogCard
                      key={item.id}
                      item={item}
                      onChangeStatus={handleChangeStatus}
                      onChangePriority={handleChangePriority}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>

              {/* DONE */}
              <div>
                <h3 style={{ fontSize: 14, opacity: 0.9 }}>Done</h3>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  {columns.done.map((item) => (
                    <BacklogCard
                      key={item.id}
                      item={item}
                      onChangeStatus={handleChangeStatus}
                      onChangePriority={handleChangePriority}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// Tarjeta reutilizable para cada ítem del backlog
function BacklogCard({ item, onChangeStatus, onChangePriority, onDelete }) {
  const currentStatus = item?.status || "todo";
  const currentPriority =
    typeof item?.priority === "number" ? item.priority : 3;

  return (
    <article
      style={{
        padding: 8,
        borderRadius: 10,
        background: "var(--asst-surface-2)",
        display: "grid",
        gap: 4,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 13 }}>{item.title}</strong>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          style={{
            border: "none",
            background: "transparent",
            color: "#fca5a5",
            cursor: "pointer",
          }}
          title="Eliminar"
        >
          ✕
        </button>
      </div>
      {item.description && (
        <p style={{ margin: 0, opacity: 0.8 }}>{item.description}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ opacity: 0.8 }}>{item.type}</span>
        <span style={{ opacity: 0.8 }}>Prioridad: {currentPriority}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <select
          className="input"
          value={currentStatus}
          onChange={(e) => onChangeStatus(item.id, e.target.value)}
          style={{ fontSize: 11, padding: "2px 4px" }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          className="input"
          value={currentPriority}
          onChange={(e) => onChangePriority(item.id, e.target.value)}
          style={{ fontSize: 11, padding: "2px 4px" }}
        >
          <option value={1}>P1</option>
          <option value={2}>P2</option>
          <option value={3}>P3</option>
          <option value={4}>P4</option>
          <option value={5}>P5</option>
        </select>
      </div>
    </article>
  );
}
