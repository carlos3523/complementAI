// src/pages/ScrumBacklog.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
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

// Mapeo de estados “Scrum-ish”
const STATUS_COLUMNS = [
  { id: "pending", label: "Previsión" },
  { id: "ready", label: "Listo para hacer" },
  { id: "in_progress", label: "En curso" },
  { id: "done", label: "Terminado" },
];

export default function ScrumBacklogPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  // Lee ?projectId= y ?name= desde la URL
  const initialProjectId = Number(query.get("projectId")) || 0;
  const initialProjectName = query.get("name") || "";

  // Estado de proyecto / UI
  const [projectId, setProjectId] = useState(initialProjectId || 0);
  const [projectName] = useState(initialProjectName);
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // "table" | "board"
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [history, setHistory] = useState([]);

  // Formulario nuevo ítem
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("story");
  const [priority, setPriority] = useState(3); // Usamos priority como Story Points

  // Para drag & drop
  const [draggingId, setDraggingId] = useState(null);

  // Cargar backlog al montar si viene desde el dashboard con projectId
  useEffect(() => {
    if (initialProjectId) {
      handleLoadBacklog(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logEvent = useCallback((kind, detail) => {
    setHistory((prev) => [
      {
        id: Date.now() + Math.random(),
        ts: new Date().toISOString(),
        kind,
        detail,
      },
      ...prev,
    ]);
  }, []);

  // --- Handlers ---

  const handleLoadBacklog = useCallback(
    async (pid) => {
      const id = Number(pid || projectId);
      if (!id) {
        setErrMsg("Debes indicar un ID de proyecto válido (numérico)");
        return;
      }
      setErrMsg("");
      setLoading(true);
      try {
        const data = await getProductBacklog(id);
        setItems(data || []);
        setProjectId(id);

        const params = new URLSearchParams(window.location.search);
        params.set("projectId", String(id));
        navigate(`/scrum/backlog?${params.toString()}`, { replace: true });

        logEvent("load", `Backlog cargado para el proyecto ${id}.`);
      } catch (err) {
        console.error("Error cargando backlog:", err);
        setErrMsg(err.message || "No se pudo cargar el backlog");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [navigate, projectId, logEvent]
  );

  const handleCreateItem = useCallback(
    async (e) => {
      e.preventDefault();
      if (!projectId) {
        setErrMsg("Primero debes indicar un ID de proyecto válido");
        return;
      }
      if (!title.trim()) {
        setErrMsg("El título es obligatorio");
        return;
      }

      setErrMsg("");
      setLoading(true);
      try {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          type,
          priority: Number(priority) || 3,
          // status inicial Scrum: pendiente
          status: "pending",
        };

        const created = await createBacklogItem(projectId, payload);
        setItems((prev) => [...prev, created]);

        logEvent(
          "create",
          `Se creó el ítem #${created.id} (${created.title}) en estado “Previsión”.`
        );

        // Reset form
        setTitle("");
        setDescription("");
        setType("story");
        setPriority(3);
      } catch (err) {
        console.error("Error creando ítem de backlog:", err);
        setErrMsg(err.message || "No se pudo crear el ítem de backlog");
      } finally {
        setLoading(false);
      }
    },
    [projectId, title, description, type, priority, logEvent]
  );

  const handleStatusChange = useCallback(
    async (itemId, newStatus) => {
      try {
        const item = items.find((i) => i.id === itemId);
        if (!item || item.status === newStatus) return;

        const updated = await updateBacklogItem(itemId, { status: newStatus });
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i))
        );

        const fromCol =
          STATUS_COLUMNS.find((c) => c.id === item.status)?.label ||
          item.status;
        const toCol =
          STATUS_COLUMNS.find((c) => c.id === newStatus)?.label || newStatus;

        logEvent(
          "status",
          `Ítem #${item.id} pasó de “${fromCol}” a “${toCol}”.`
        );
      } catch (err) {
        console.error("Error actualizando estado:", err);
        setErrMsg(err.message || "No se pudo actualizar el estado");
      }
    },
    [items, logEvent]
  );

  const handleDeleteItem = useCallback(
    async (itemId) => {
      const item = items.find((i) => i.id === itemId);
      if (!window.confirm("¿Eliminar este ítem del backlog?")) return;

      try {
        await deleteBacklogItem(itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        logEvent(
          "delete",
          `Ítem #${itemId}${
            item ? ` (${item.title})` : ""
          } eliminado del backlog.`
        );
      } catch (err) {
        console.error("Error eliminando ítem:", err);
        setErrMsg(err.message || "No se pudo eliminar el ítem");
      }
    },
    [items, logEvent]
  );

  // --- Drag & Drop para la pizarra ---

  const handleDragStart = (itemId) => {
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDropOnColumn = (status) => {
    if (!draggingId) return;
    handleStatusChange(draggingId, status);
    setDraggingId(null);
  };

  const itemsByStatus = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach((col) => {
      map[col.id] = [];
    });
    items.forEach((item) => {
      if (!map[item.status]) map[item.status] = [];
      map[item.status].push(item);
    });
    return map;
  }, [items]);

  // --- Render helpers ---

  const renderStatusBadge = (status) => {
    const col = STATUS_COLUMNS.find((c) => c.id === status);
    return col ? col.label : status;
  };

  const renderTableView = () => {
    if (!items.length) {
      return (
        <div style={{ padding: 16, opacity: 0.8 }}>
          No hay ítems registrados para este proyecto.
        </div>
      );
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", opacity: 0.85 }}>
              <th style={{ padding: "8px 4px" }}>ID</th>
              <th style={{ padding: "8px 4px" }}>Título</th>
              <th style={{ padding: "8px 4px" }}>Tipo</th>
              <th style={{ padding: "8px 4px" }}>Story Points</th>
              <th style={{ padding: "8px 4px" }}>Estado</th>
              <th style={{ padding: "8px 4px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td style={{ padding: "6px 4px", opacity: 0.8 }}>{i.id}</td>
                <td style={{ padding: "6px 4px" }}>{i.title}</td>
                <td style={{ padding: "6px 4px" }}>{i.type}</td>
                <td style={{ padding: "6px 4px" }}>{i.priority}</td>
                <td style={{ padding: "6px 4px" }}>
                  <select
                    className="input"
                    value={i.status}
                    onChange={(e) => handleStatusChange(i.id, e.target.value)}
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "6px 4px" }}>
                  <button
                    type="button"
                    className="asst-btn"
                    style={{ background: "#3b0f15", color: "#ffb3b3" }}
                    onClick={() => handleDeleteItem(i.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBoardView = () => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          alignItems: "flex-start",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {itemsByStatus[col.id]?.map((i) => (
                <div
                  key={i.id}
                  draggable
                  onDragStart={() => handleDragStart(i.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    background:
                      col.id === "done"
                        ? "rgba(34,197,94,0.12)"
                        : "var(--asst-surface)",
                    border: "1px solid var(--asst-border)",
                    cursor: "grab",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {i.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      marginBottom: 4,
                    }}
                  >
                    {i.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      opacity: 0.85,
                    }}
                  >
                    <span>{i.type}</span>
                    <span>{i.priority} pts</span>
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

  return (
    <main className="assistant-screen" data-theme="ink">
      {/* Appbar */}
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <button
            className="asst-appbar-icon"
            onClick={() => navigate("/dashboard")}
          >
            ←
          </button>
          <div className="asst-appbar-title">
            📋 Product Backlog
            {projectName ? ` · ${projectName}` : ""}
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
                `/scrum?projectId=${projectId || ""}&name=${projectName || ""}`
              )
            }
          >
            Roles Scrum
          </button>
          <div className="asst-appbar-user">{user?.email}</div>
        </div>
      </div>

      <div className="asst-wrap" style={{ alignItems: "flex-start" }}>
        {/* Columna izquierda: proyecto + historial */}
        <aside
          className="asst-card"
          style={{
            maxWidth: 340,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <section>
            <h2>Proyecto</h2>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              El ID viene desde el Dashboard al pulsar el botón{" "}
              <b>Product Backlog</b>.
            </p>
            <div
              style={{
                fontSize: 13,
                marginTop: 8,
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              <div>
                <b>Proyecto:</b> {projectName || "—"}
              </div>
              <div style={{ wordBreak: "break-all" }}>
                <b>ID:</b> {projectId || "—"}
              </div>
            </div>
            <label className="field">
              <span className="field-label">
                ID de proyecto (puedes editarlo si es necesario)
              </span>
              <input
                className="input"
                type="number"
                value={projectId || ""}
                onChange={(e) => setProjectId(Number(e.target.value) || 0)}
                placeholder="Ej: 101"
              />
            </label>
            <button
              className="btn-primary"
              type="button"
              style={{ marginTop: 10 }}
              onClick={() => handleLoadBacklog(projectId)}
              disabled={loading}
            >
              Cargar backlog
            </button>
          </section>

          <section>
            <h2>Backlog</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={viewMode === "table" ? "btn-primary" : "asst-btn"}
                onClick={() => setViewMode("table")}
              >
                📊 Vista tabla
              </button>
              <button
                type="button"
                className={viewMode === "board" ? "btn-primary" : "asst-btn"}
                onClick={() => setViewMode("board")}
              >
                📋 Vista pizarra
              </button>
            </div>
          </section>

          <section>
            <h2>Historial</h2>
            {history.length === 0 && (
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                Aún no hay cambios registrados para este proyecto.
              </p>
            )}
            {history.length > 0 && (
              <div
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  fontSize: 12,
                  borderRadius: 8,
                  background: "var(--asst-surface-2)",
                  padding: 8,
                }}
              >
                {history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      marginBottom: 6,
                      borderBottom: "1px dashed rgba(255,255,255,0.08)",
                      paddingBottom: 4,
                    }}
                  >
                    <div style={{ opacity: 0.6 }}>
                      {new Date(h.ts).toLocaleString()}
                    </div>
                    <div>{h.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        {/* Columna derecha: formulario + backlog */}
        <section
          className="asst-chat"
          style={{ maxWidth: 960, margin: "0 auto" }}
        >
          <div className="asst-card" style={{ marginBottom: 16 }}>
            <h2>Nuevo ítem de backlog</h2>
            <form
              onSubmit={handleCreateItem}
              style={{ marginTop: 12, display: "grid", gap: 12 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 12,
                }}
              >
                <label className="field">
                  <span className="field-label">Título</span>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Registrar alumnos en la base de datos"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Tipo</span>
                  <select
                    className="input"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="story">Historia</option>
                    <option value="task">Tarea técnica</option>
                    <option value="bug">Bug</option>
                    <option value="enhancement">Mejora</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Story Points (1–5)</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 3)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">
                  Descripción / Historia de usuario
                </span>
                <textarea
                  className="input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Como [rol] quiero [funcionalidad] para [beneficio]..."
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading || !projectId}
                >
                  Añadir al backlog
                </button>
              </div>
            </form>
          </div>

          {errMsg && (
            <div className="asst-card" style={{ marginBottom: 16 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "#3b0f15",
                  color: "#ffb3b3",
                  fontSize: 14,
                }}
              >
                {errMsg}
              </div>
            </div>
          )}

          <div className="asst-card">
            <h2>Backlog</h2>
            <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
              Puedes alternar entre la vista de tabla y la pizarra para mover
              ítems según su estado Scrum.
            </p>
            {loading && <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando…</p>}

            {!loading &&
              (viewMode === "table" ? renderTableView() : renderBoardView())}
          </div>
        </section>
      </div>
    </main>
  );
}
