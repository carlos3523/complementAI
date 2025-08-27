import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../style.css";

export default function Home({ isAuthed = false }) {
  const navigate = useNavigate();

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
      {/* Top bar muy simple */}
      <div className="topnav">
        <div className="container topnav-inner">
          <a href="/" className="brand">
            <div className="brand-dot" />
            <span className="brand-name">ComplementAI</span>
          </a>
          <nav className="nav">
            <Link to="/about">Nosotros</Link>
            <Link to="/login">Ingresar</Link>
            <Link to="/Assistant">Asistente</Link>
            <Link to="/register" className="btn-pill">
              Inscribirse
            </Link>
          </nav>
        </div>
      </div>

      {/* Dos columnas: izquierda (gradiente) y derecha (imagen) */}
      <div className="split">
        <section className="hero-left">
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

        <section className="hero-right">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${images[idx]})` }}
          />
          <div className="hero-overlay" />
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
