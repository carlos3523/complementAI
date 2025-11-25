// src/pages/ScrumMetrics.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getSprints,
  getSprintMetrics,
  createSprintMetric,
  deleteSprintMetric,
} from "../services/scrum";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ScrumMetricsPage() {
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

  const [metrics, setMetrics] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // formulario nueva métrica
  const [metricDate, setMetricDate] = useState("");
  const [remainingPoints, setRemainingPoints] = useState("");
  const [completedPoints, setCompletedPoints] = useState("");

  const hasProject = !!projectId;

  // --- carga inicial ---
  useEffect(() => {
    if (initialProjectId) {
      loadSprints(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialSprintId && sprints.length > 0) {
      const sprint = sprints.find((s) => s.id === initialSprintId);
      if (sprint) {
        handleSelectSprint(sprint.id, sprint.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSprintId, sprints]);

  // --- API helpers ---

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

  async function loadMetrics(sprintId) {
    if (!sprintId) return;
    setLoading(true);
    setErrMsg("");
    try {
      const data = await getSprintMetrics(sprintId);
      setMetrics(data || []);
    } catch (err) {
      console.error("Error cargando métricas:", err);
      setErrMsg(err.message || "No se pudieron cargar las métricas");
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }

  // --- selección de sprint ---

  async function handleSelectSprint(id, name) {
    setSelectedSprintId(id);
    setSelectedSprintName(name || "");

    // actualizar URL
    const params = new URLSearchParams(window.location.search);
    params.set("projectId", projectId || "");
    if (projectName) params.set("name", projectName);
    params.set("sprintId", String(id));
    navigate(`/scrum/metrics?${params.toString()}`, { replace: true });

    await loadMetrics(id);
  }

  // --- crear / eliminar metricas ---

  async function handleCreateMetric(e) {
    e.preventDefault();
    const sid = Number(selectedSprintId);
    if (!sid) {
      setErrMsg("Primero debes seleccionar un sprint");
      return;
    }
    if (!metricDate) {
      setErrMsg("La fecha es obligatoria");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const payload = {
        date: metricDate,
        remaining_points: remainingPoints ? Number(remainingPoints) : null,
        completed_points: completedPoints ? Number(completedPoints) : null,
      };
      const created = await createSprintMetric(sid, payload);
      setMetrics((prev) => [...prev, created]);
      setMetricDate("");
      setRemainingPoints("");
      setCompletedPoints("");
    } catch (err) {
      console.error("Error creando métrica:", err);
      setErrMsg(err.message || "No se pudo crear la métrica");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMetric(id) {
    if (!window.confirm("¿Eliminar este registro de métricas?")) return;
    setErrMsg("");
    setLoading(true);
    try {
      await deleteSprintMetric(id);
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error eliminando métrica:", err);
      setErrMsg(err.message || "No se pudo eliminar la métrica");
    } finally {
      setLoading(false);
    }
  }

  // --- derivados / resumen ---

  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }, [metrics]);

  const summary = useMemo(() => {
    if (!sortedMetrics.length) return null;

    const first = sortedMetrics[0];
    const last = sortedMetrics[sortedMetrics.length - 1];

    const totalCompleted = sortedMetrics.reduce(
      (sum, m) => sum + (m.completed_points || 0),
      0
    );

    const initialRemaining =
      first.remaining_points != null ? first.remaining_points : null;
    const currentRemaining =
      last.remaining_points != null ? last.remaining_points : null;

    let progressPercent = null;
    if (
      initialRemaining != null &&
      currentRemaining != null &&
      initialRemaining > 0
    ) {
      progressPercent =
        ((initialRemaining - currentRemaining) / initialRemaining) * 100;
    }

    return {
      initialRemaining,
      currentRemaining,
      totalCompleted,
      progressPercent,
      days: sortedMetrics.length,
    };
  }, [sortedMetrics]);

  // --- render ---

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
          <div className="asst-appbar-title">📈 Métricas del Sprint</div>
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

      <div className="asst-wrap" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
        {/* Columna izquierda: proyecto + sprints + nuevo registro */}
        <section className="asst-card">
          <h2>Proyecto</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Selecciona un proyecto y un sprint para registrar y revisar sus
            métricas (burndown / puntos completados).
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
                onClick={() => loadSprints(projectId)}
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
                onClick={() => handleSelectSprint(s.id, s.name)}
              >
                <div style={{ fontWeight: "bold" }}>{s.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {s.start_date || "?"} → {s.end_date || "?"} ·{" "}
                  {s.status || "planned"}
                </div>
              </li>
            ))}
          </ul>

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Nuevo registro de métricas</h3>
          <form
            onSubmit={handleCreateMetric}
            style={{ display: "grid", gap: 8, marginTop: 8 }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Fecha</span>
                <input
                  className="input"
                  type="date"
                  value={metricDate}
                  onChange={(e) => setMetricDate(e.target.value)}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Puntos restantes</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={remainingPoints}
                  onChange={(e) => setRemainingPoints(e.target.value)}
                  placeholder="Ej: 20"
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Puntos completados</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={completedPoints}
                  onChange={(e) => setCompletedPoints(e.target.value)}
                  placeholder="Ej: 5"
                />
              </label>
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !selectedSprintId}
            >
              Guardar registro
            </button>
          </form>
        </section>

        {/* Columna derecha: métricas + resumen */}
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

          <h2>Métricas del sprint</h2>
          {selectedSprintName && (
            <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>
              Sprint seleccionado: <strong>{selectedSprintName}</strong>
            </p>
          )}

          {summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 8,
                margin: "8px 0 12px",
                fontSize: 13,
              }}
            >
              <div className="asst-card" style={{ padding: 8 }}>
                <div style={{ opacity: 0.8 }}>Puntos iniciales</div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {summary.initialRemaining ?? "—"}
                </div>
              </div>
              <div className="asst-card" style={{ padding: 8 }}>
                <div style={{ opacity: 0.8 }}>Puntos restantes</div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {summary.currentRemaining ?? "—"}
                </div>
              </div>
              <div className="asst-card" style={{ padding: 8 }}>
                <div style={{ opacity: 0.8 }}>Total completados</div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {summary.totalCompleted}
                </div>
              </div>
              <div className="asst-card" style={{ padding: 8 }}>
                <div style={{ opacity: 0.8 }}>Progreso estimado</div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {summary.progressPercent != null
                    ? `${summary.progressPercent.toFixed(1)}%`
                    : "—"}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Cargando métricas…
            </p>
          )}

          {!loading && !sortedMetrics.length && (
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              No hay métricas registradas para este sprint.
            </p>
          )}

          {!!sortedMetrics.length && (
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.85 }}>
                    <th style={{ padding: "6px 4px" }}>Fecha</th>
                    <th style={{ padding: "6px 4px" }}>Puntos restantes</th>
                    <th style={{ padding: "6px 4px" }}>Puntos completados</th>
                    <th style={{ padding: "6px 4px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((m) => (
                    <tr key={m.id}>
                      <td style={{ padding: "6px 4px" }}>
                        {m.date
                          ? new Date(m.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {m.remaining_points ?? "—"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {m.completed_points ?? "—"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        <button
                          type="button"
                          className="asst-btn"
                          style={{ background: "#3b0f15", color: "#ffb3b3" }}
                          onClick={() => handleDeleteMetric(m.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
