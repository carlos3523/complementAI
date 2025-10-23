// src/pages/DashBoard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { projectsApi } from "../services/projects";

export default function DashBoard() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  const { id } = useParams();
  useEffect(() => {
    if (!id) return;
    projectsApi
      .get(`/${id}`)
      .then(setProject) // guarda name/methodology/stage/domain
      .catch(() => navigate("/dashboard"));
  }, [id]);

  useEffect(() => {
    let alive = true;
    projectsApi
      .list()
      .then((rows) => alive && setProjects(rows || []))
      .catch((e) => alert(e.message));
    return () => {
      alive = false;
    };
  }, []);

  async function handleDelete(id) {
    try {
      if (!confirm("¿Eliminar este proyecto?")) return;
      await projectsApi.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message || "No se pudo eliminar");
    }
  }

  async function handleDuplicate(id) {
    try {
      const p = projects.find((x) => x.id === id);
      if (!p) return;
      const cloned = {
        name: (p.name || "Proyecto") + " (copia)",
        methodology: p.methodology || null,
        stage: p.stage || null,
        domain: p.domain || null,
        templates: p.templates || [],
      };
      const created = await projectsApi.create(cloned);
      setProjects((prev) => [created, ...prev]);
    } catch (e) {
      alert(e.message || "No se pudo duplicar");
    }
  }

  return (
    <main className="dashboard">
      <div className="assistant-wrap">
        {/* Appbar */}
        <div className="appbar">
          <div className="appbar-left">
            <div className="appbar-title">📂 Tus proyectos</div>
          </div>
          <Link to="/wizard" className="appbar-btn">
            + Nuevo
          </Link>
        </div>

        {/* Empty state */}
        {projects.length === 0 ? (
          <div className="panel">
            <div className="side-title">Aún no tienes proyectos</div>
            <p className="muted">
              Crea uno desde el <Link to="/wizard">Wizard</Link> o usa el{" "}
              <Link to="/assistant">Asistente</Link> y guarda como proyecto.
            </p>
          </div>
        ) : (
          <div className="cards">
            {projects.map((p) => (
              <article
                key={p.id}
                className="panel"
                style={{ marginBottom: 12 }}
              >
                {/* Cabecera: nombre + badges + acciones */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 18,
                        cursor: "pointer",
                      }}
                      title="Ver progreso"
                      onClick={() => navigate(`/progreso/${p.id}`)}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="badge">
                        {(p.methodology || "").toUpperCase()}
                      </span>
                      {p.stage && <span className="badge">{p.stage}</span>}
                      {p.domain && (
                        <span className="badge subtle">{p.domain}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn-ghost"
                      onClick={() => navigate(`/progreso/${p.id}`)}
                    >
                      Ver progreso
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => navigate(`/wizard?id=${p.id}`)}
                    >
                      Editar en Wizard
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() =>
                        navigate(
                          `/assistant?standard=${encodeURIComponent(
                            p.methodology || ""
                          )}` +
                            `&phase=${encodeURIComponent(p.stage || "")}` +
                            `&domain=${encodeURIComponent(p.domain || "")}`
                        )
                      }
                    >
                      Abrir en Asistente
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleDuplicate(p.id)}
                    >
                      Duplicar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Lista de plantillas (preview) */}
                {(p.templates || []).length > 0 && (
                  <>
                    <div className="muted" style={{ marginTop: 10 }}>
                      Plantillas
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(p.templates || []).slice(0, 5).map((t, i) => (
                        <li key={i}>{t.name || JSON.stringify(t)}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
