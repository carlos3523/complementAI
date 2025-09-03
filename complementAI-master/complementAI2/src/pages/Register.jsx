import { Link, useNavigate } from "react-router-dom";
import "../style.css";

export default function Register() {
  const navigate = useNavigate();
  function handleSubmit(e) {
    e.preventDefault();
    navigate("/login");
  }

  return (
    <main className="auth">
      <div className="aut-card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nombre</label>
            <input className="input" required />
          </div>
          <div className="fiel">
            <label className="label">Apellido</label>
            <input className="input" required />
          </div>
          <div className="fiel">
            <label className="label">Email</label>
            <input className="input" required />
          </div>
          <div className="fiel">
            <label className="label">Contraseña</label>
            <input className="input" type="password" required />
          </div>
          <div className="auth-actions">
            <button className="btn-primary btn wide" type="submit">
              Crear cuenta
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="link-inline">
              Ingresar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
