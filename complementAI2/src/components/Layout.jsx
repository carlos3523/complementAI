import { Link } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import "../style.css";
import "../style-light.css"; // aquí importas los overrides

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topnav">
        <div className="container topnav-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <div className="brand-dot" />
            <span className="brand-name">ComplementAI</span>
          </Link>

          {/* Nav desktop */}
          <nav className="nav nav-desktop">
            <Link to="/about">Nosotros</Link>
            <Link to="/login">Ingresar</Link>
            <Link to="/Assistant">Asistente</Link>
            <Link to="/register" className="btn-pill">Inscribirse</Link>
            <ThemeToggle />
          </nav>

          {/* Botón hamburguesa */}
          <button
            className="nav-toggle"
            aria-label="Abrir menú"
            aria-controls="site-drawer"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="26" height="20" viewBox="0 0 24 18" fill="none" aria-hidden="true">
              <rect x="0" y="0" width="24" height="2" rx="1" fill="currentColor"></rect>
              <rect x="0" y="8" width="24" height="2" rx="1" fill="currentColor"></rect>
              <rect x="0" y="16" width="24" height="2" rx="1" fill="currentColor"></rect>
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
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
          <ThemeToggle />
        </nav>
      </aside>

      {/* Contenido dinámico */}
      <div className="layout-content">{children}</div>
    </div>
  );
}
