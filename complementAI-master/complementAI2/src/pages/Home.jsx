import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../style.css";

export default function Home({ isAuthed = false }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const images = useMemo(
    () => [
      "https://images.unsplash.com/photo-1529336953121-a0ce23b1fd1e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1559152803-4105a04c03d9?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1523246192488-57005230898a?auto=format&fit=crop&w=1600&q=80",
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((p) => (p + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <main className="page">
      {/* Top bar */}
      <div className="topnav">
        <div className="container topnav-inner">
          <a href="/" className="brand" onClick={() => setMenuOpen(false)}>
            <div className="brand-dot" />
            <span className="brand-name">ComplementAI</span>
          </a>

          {/* Nav de escritorio */}
          <nav className="nav nav-desktop">
            <Link to="/about">Nosotros</Link>
            <Link to="/login">Ingresar</Link>
            <Link to="/Assistant">Asistente</Link>
            <Link to="/register" className="btn-pill">Inscribirse</Link>
          </nav>

          {/* Botón hamburguesa (solo mobile por CSS) */}
          <button
            className="nav-toggle"
            aria-label="Abrir menú"
            aria-controls="site-drawer"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {/* SVG de 3 rayitas para que siempre sea visible */}
            <svg width="26" height="20" viewBox="0 0 24 18" fill="none" aria-hidden="true">
              <rect x="0" y="0" width="24" height="2" rx="1" fill="currentColor"></rect>
              <rect x="0" y="8" width="24" height="2" rx="1" fill="currentColor"></rect>
              <rect x="0" y="16" width="24" height="2" rx="1" fill="currentColor"></rect>
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop + Drawer móvil */}
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <aside
        id="site-drawer"
        className={`drawer ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <nav className="drawer-menu" onClick={() => setMenuOpen(false)}>
          <Link to="/about">Nosotros</Link>
          <Link to="/login">Ingresar</Link>
          <Link to="/Assistant">Asistente</Link>
          <Link to="/register" className="btn-pill">Inscribirse</Link>
        </nav>
      </aside>

      {/* Dos columnas: izquierda (gradiente) y derecha (imagen) */}
      <div className="split">
        <section className="hero">
          <div className="side-rail">
          <div className="side-dot" />
          <div className="side-star">✦</div>
          </div>

          <div className="hero-content">
          <h1 className="hero-title">Implement-AI</h1>
          <p className="hero-p">
            Una herramienta con IA para <strong>gestionar proyectos</strong>,
            especializada en documentación y metodologías. Te sugiere
            plantillas y justifica por qué usarlas.
          </p>

          <div className="cta-row">
            <button
              className="btn-primary"
              onClick={() =>
                isAuthed ? navigate("/wizard") : navigate("/login")
              }
            >
              Crear Proyecto
            </button>
            <a className="link" href="#features">
              Ver cómo funciona
            </a>
          </div>

          <div className="fake-lines">
            <div className="fake-line w90" />
            <div className="fake-line w80" />
            <div className="fake-line w70" />
            </div>
         </div>
        </section>

         
      </div>

      {/* (Opcional) sección de features */}
      <section id="features" className="features">
        <div className="container">
          <div className="cards">
            <div className="card">
              <h3>Motor de Plantillas</h3>
              <p>
                Lógica interna que sugiere la plantilla exacta según la etapa.
              </p>
            </div>
            <div className="card">
              <h3>Asistente IA</h3>
              <p>
                Explica y justifica cada documento con respaldo en buenas
                prácticas.
              </p>
            </div>
            <div className="card">
              <h3>Trazabilidad</h3>
              <p>Seguimiento paso a paso para equipos nuevos.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
