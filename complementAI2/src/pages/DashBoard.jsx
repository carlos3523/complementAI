import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const uid = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  String(Date.now()) + Math.random().toString(36).slice(2);

const store = {
  get: () => JSON.parse(localStorage.getItem("projects") || "[]"),
  set: (list) => localStorage.setItem("projects", JSON.stringify(list)),
  remove: (id) => {
    const list = JSON.parse(localStorage.getItem("projects") || "[]").filter(
      (p) => p.id !== id
    );
    localStorage.setItem("projects", JSON.stringify(list));
    return list;
  },
};

export default function DashBoard() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(store.get());
  }, []);

  function refresh() {
    setProjects(store.get());
  }

  function handleDelete(id) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    setProjects(store.remove(id));
  }

  function handleDuplicate(id) {
    const list = store.get();
    const p = list.find((x) => x.id === id);
    if (!p) return;
    const cloned = {
      ...p,
      id: uid(),
      name: p.name + " (copia)",
      createdAt: Date.now(),
    };
    const updated = [cloned, ...list];
    store.set(updated);
    setProjects(updated);
  }

  return (
    <main className="dashboard">
      <div className="assistant-wrap">
        {/* AppBar */}
        <div className="appbar">
          <div className="appbar-left">
            <div className="appbar-title">📂 Tus proyectos</div>
          </div>
          <Link to="/wizard" className="appbar-btn">
            + Nuevo
          </Link>
        </div>

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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
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
                      <span className="badge">{p.stage}</span>
                      {p.domain && (
                        <span className="badge subtle">{p.domain}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
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

                {(p.templates || []).length > 0 && (
                  <>
                    <div className="muted" style={{ marginTop: 10 }}>
                      Plantillas
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(p.templates || []).slice(0, 5).map((t) => (
                        <li key={t.name}>{t.name}</li>
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
