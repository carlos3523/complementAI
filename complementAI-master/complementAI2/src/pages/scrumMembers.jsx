// src/pages/scrumMembers.jsx
import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from "../services/scrum";
import { useAuth } from "../contexts/AuthContext";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ScrumMembersPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  // Intenta leer ?projectId=xxx desde la URL
  const initialProjectId = Number(query.get("projectId")) || 0;

  const [projectId, setProjectId] = useState(initialProjectId || 0);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("product_owner");

  // Cargar miembros al montar si hay projectId en la URL
  useEffect(() => {
    if (initialProjectId) {
      handleLoadMembers(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadMembers(pid) {
    const id = Number(pid || projectId);
    if (!id) {
      setErrMsg("Debes indicar un ID de proyecto válido");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const data = await getProjectMembers(id);
      setMembers(data);
      setProjectId(id);

      // actualiza la URL: /scrum?projectId=ID
      const params = new URLSearchParams(window.location.search);
      params.set("projectId", String(id));
      if (projectName) params.set("name", projectName); //preservamos el nombre si existe
      navigate(`/scrum?${params.toString()}`, { replace: true });
    } catch (err) {
      console.error("Error cargando miembros:", err);
      setMembers([]);
      setErrMsg(err.message || "No se pudieron cargar los miembros");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const pid = Number(projectId);
    const uid = Number(newUserId);

    if (!pid || !uid) {
      setErrMsg("Project ID y User ID deben ser números válidos");
      return;
    }

    setErrMsg("");
    setLoading(true);
    try {
      const member = await addProjectMember(pid, uid, newRole);
      setMembers((prev) => [...prev, member]);
      setNewUserId("");
    } catch (err) {
      console.error("Error añadiendo miembro:", err);
      setErrMsg(err.message || "No se pudo añadir el miembro");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(memberId) {
    if (!window.confirm("¿Eliminar este miembro del proyecto?")) return;

    setErrMsg("");
    setLoading(true);
    try {
      await removeProjectMember(projectId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Error eliminando miembro:", err);
      setErrMsg(err.message || "No se pudo eliminar el miembro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="assistant-screen" data-theme="ink">
      <div className="asst-appbar">
        <div className="asst-appbar-left" style={{ display: "flex", gap: 12 }}>
          <button
            className="asst-appbar-icon"
            onClick={() => navigate("/Assistant")}
          >
            ←
          </button>
          <div className="asst-appbar-title">🌀 Roles Scrum del Proyecto</div>
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

      <div className="asst-wrap">
        <section
          className="asst-chat"
          style={{ maxWidth: 960, margin: "0 auto" }}
        >
          {/* Bloque: proyecto */}
          <div className="asst-card" style={{ marginBottom: 16 }}>
            <h2>Proyecto</h2>
            {/* ⭐ Mensaje mejorado, usando nombre si viene desde el Dashboard */}
            <p style={{ opacity: 0.8, fontSize: 14 }}>
              {projectId ? (
                <>
                  Gestionando el proyecto{" "}
                  <strong>{projectName || `ID ${projectId}`}</strong>.
                  <br />
                  Puedes modificar el ID si quieres revisar otro proyecto
                  puntual.
                </>
              ) : (
                <>
                  Indica el ID del proyecto Scrum que quieres gestionar. Si
                  entras desde el Dashboard con el botón{" "}
                  <strong>“Roles Scrum”</strong>, este dato se rellenará solo.
                </>
              )}
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="field">
                  <span className="field-label">ID de proyecto</span>
                  <input
                    className="input"
                    type="number"
                    value={projectId || ""}
                    onChange={(e) => setProjectId(Number(e.target.value) || 0)}
                    placeholder="Ej: 101"
                  />
                </label>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => handleLoadMembers(projectId)}
                  disabled={loading}
                >
                  Cargar miembros
                </button>
              </div>
            </div>
          </div>

          {/* Bloque: agregar miembro */}
          <div className="asst-card" style={{ marginBottom: 16 }}>
            <h2>Agregar miembro</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 12,
                marginTop: 12,
              }}
            >
              <label className="field">
                <span className="field-label">ID de usuario</span>
                <input
                  className="input"
                  type="number"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Ej: 10"
                />
              </label>

              <label className="field">
                <span className="field-label">Rol</span>
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="product_owner">Product Owner</option>
                  <option value="scrum_master">Scrum Master</option>
                  <option value="developer">Developer</option>
                </select>
              </label>

              <div style={{ alignSelf: "flex-end" }}>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleAdd}
                  disabled={loading || !projectId}
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>

          {/* Mensajes de error */}
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

          {/* Listado de miembros */}
          <div className="asst-card">
            <h2>Miembros asignados</h2>

            {!loading && !members.length && (
              <p style={{ marginTop: 12, opacity: 0.8 }}>
                No hay miembros registrados para este proyecto.
              </p>
            )}

            {loading && (
              <p style={{ marginTop: 12, opacity: 0.8 }}>Cargando…</p>
            )}

            {!!members.length && (
              <table
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.8 }}>
                    <th style={{ padding: "6px 4px" }}>Usuario</th>
                    <th style={{ padding: "6px 4px" }}>Rol</th>
                    <th style={{ padding: "6px 4px" }}>Estado</th>
                    <th style={{ padding: "6px 4px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td style={{ padding: "6px 4px" }}>
                        {m.email}{" "}
                        <span style={{ opacity: 0.7 }}>
                          {m.first_name || m.last_name
                            ? `(${m.first_name || ""} ${m.last_name || ""})`
                            : ""}
                        </span>
                      </td>
                      <td style={{ padding: "6px 4px" }}>{m.role}</td>
                      <td style={{ padding: "6px 4px" }}>{m.status}</td>
                      <td style={{ padding: "6px 4px" }}>
                        <button
                          type="button"
                          className="asst-btn"
                          onClick={() => handleRemove(m.id)}
                          style={{ background: "#3b0f15", color: "#ffb3b3" }}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
