// src/pages/ScrumParkingLot.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getParkingLot,
  createParkingItem,
  deleteParkingItem,
} from "../services/scrum";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ScrumParkingLotPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const initialProjectId = query.get("projectId") || "";
  const initialProjectName = query.get("name") || "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectName] = useState(initialProjectName);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // formulario nuevo ítem
  const [idea, setIdea] = useState("");

  useEffect(() => {
    if (initialProjectId) {
      handleLoad(projectId || initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoad(pid = projectId) {
    const id = Number(pid);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const data = await getParkingLot(id);
      setItems(data || []);
    } catch (err) {
      console.error("Error cargando parking lot:", err);
      setErrMsg(err.message || "No se pudo cargar el Parking Lot");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const id = Number(projectId);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }
    if (!idea.trim()) {
      setErrMsg("La idea no puede estar vacía");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const payload = {
        idea: idea.trim(),
        // el backend puede usar user.id como created_by
      };
      const created = await createParkingItem(id, payload);
      setItems((prev) => [created, ...prev]);
      setIdea("");
    } catch (err) {
      console.error("Error creando ítem del Parking Lot:", err);
      setErrMsg(err.message || "No se pudo crear el ítem");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta idea del Parking Lot?")) return;

    setErrMsg("");
    setLoading(true);
    try {
      await deleteParkingItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Error eliminando ítem:", err);
      setErrMsg(err.message || "No se pudo eliminar el ítem");
    } finally {
      setLoading(false);
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
          <div className="asst-appbar-title">🅿️ Parking Lot</div>
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
          <div className="asst-appbar-user">{user?.email}</div>
        </div>
      </div>

      <div className="asst-wrap" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        {/* Columna izquierda: proyecto + nueva idea */}
        <section className="asst-card">
          <h2>Proyecto</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            El Parking Lot se usa para capturar ideas, temas y tareas futuras
            que surgen en reuniones pero que aún no entran al backlog.
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
                onClick={() => handleLoad(projectId)}
                disabled={loading}
              >
                Cargar Parking Lot
              </button>
            </div>
          </div>

          {projectName && (
            <p style={{ marginTop: 6, opacity: 0.9 }}>
              <strong>Proyecto:</strong> {projectName}
            </p>
          )}

          <hr style={{ margin: "16px 0", borderColor: "#333" }} />

          <h3>Nueva idea / tema pendiente</h3>
          <form
            onSubmit={handleCreate}
            style={{ display: "grid", gap: 8, marginTop: 8 }}
          >
            <label className="field">
              <span className="field-label">Idea</span>
              <textarea
                className="input"
                rows={3}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ej: Evaluar migración a microservicios en el próximo trimestre..."
              />
            </label>
            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !projectId}
            >
              Añadir al Parking Lot
            </button>
          </form>
        </section>

        {/* Columna derecha: listado Parking Lot */}
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

          <h2>Parking Lot</h2>
          <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>
            Lista de ideas y temas aparcados para revisar en el futuro.
          </p>

          {loading && (
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Cargando elementos del Parking Lot…
            </p>
          )}

          {!loading && !items.length && (
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              No hay ítems en el Parking Lot para este proyecto.
            </p>
          )}

          {!!items.length && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="asst-card"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: "var(--asst-surface-2)",
                    border: "1px solid var(--asst-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 14 }}>{item.idea}</div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      opacity: 0.8,
                      marginTop: 2,
                    }}
                  >
                    <span>
                      {item.created_email
                        ? `Creado por: ${item.created_email}`
                        : "Creado por: —"}
                    </span>
                    <span>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, textAlign: "right" }}>
                    <button
                      type="button"
                      className="asst-btn"
                      style={{ background: "#3b0f15", color: "#ffb3b3" }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
