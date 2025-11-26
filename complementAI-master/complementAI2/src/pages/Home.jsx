import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import "./home.css"; 

// --- Componente Header Limpio ---
const Header = ({ token, navigate }) => (
    <header className="tech-header">
      <div className="header-left">
        <h2 className="logo" onClick={() => navigate("/")}>
          complementAI
        </h2>
        <nav className="tech-nav">
          <a href="/about-us">Nosotros</a>
          {token && <a onClick={() => navigate("/Assistant")}>Asistente</a>}
          <button className="theme-toggle">Tema Oscuro/Claro</button>
        </nav>
      </div>

      <div className="header-right">
        <button className="btn-premium">Premium</button>
        <button className="btn-signup" onClick={() => navigate("/register")}>
          Sign up
        </button>
        <button className="btn-login" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    </header>
);
// --- Fin Componente Header ---


export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Se mantiene la lógica de imágenes por si se utiliza para efectos visuales
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
    <Layout>
      <Header token={token} navigate={navigate} />

      {/* Uso de Grid para el Hero Section para una distribución limpia */}
      <section className="hero-grid-container">
        <div className="hero-content">
          <h1 className="hero-title">
            La IA que <span>Documenta</span> y <span>Justifica</span> tus Proyectos
          </h1>
          <p className="hero-p">
            Una herramienta especializada en la gestión de proyectos,
            generación de documentación y aplicación de metodologías. Te
            sugiere plantillas y **justifica por qué usarlas**.
          </p>

          <div className="cta-row">
            <button
              className="btn-primary"
              onClick={() =>
                token ? navigate("/wizard") : navigate("/login")
              }
            >
              Crear Proyecto
            </button>
            
            {/* CTA secundario sin lógica de token aquí para simplificar el flujo */}
            <button
              className="btn-secondary"
              onClick={() => navigate("/Assistant")}
            >
              Ir al Asistente
            </button>
          </div>
        </div>

        {/* Placeholder para la Referencia Visual 3D */}
        <div className="hero-visual">
          <div className="cube-placeholder" />
          <p className="beta-date">Beta Q1 2026</p>
        </div>
      </section>
    </Layout>
  );
}