import { Link, useNavigate } from "react-router-dom";
import "../style.css";

export default function Login() {
  const navigate = useNavigate();
  function handleSubmit(e) {
    e.preventDefault();

    //autenticamos guardando un flag
    localStorage.setItem("auth", JSON, stringify({ logged: true }));
    navigate("/"); //vuelve al home(luego iremos al wizard)
  }

  return (
    <main className="auth">
      <div className="aut-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              placeholder="tucorreo@dominio.com"
            ></input>
          </div>
          <div className="fiel">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              required
              placeholder="........"
            ></input>
          </div>
          <div className="auth-actions">
            <button className="btn-primary btn-wide" type="submit">
              Entrar
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="link-line">
              Registrarse
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
