import { Link, useNavigate } from "react-router-dom";
import { register as registerUser } from "../services/auth";
import "../style.css";

export default function Register() {
  const navigate = useNavigate();
  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = (data.get("nombre") || "").toString().trim();
    const apellido = (data.get("apellido") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const password = (data.get("password") || "").toString();
    try {
      // llama al backend para crear el usuario
      await registerUser(nombre, apellido, email, password);
      navigate("/login");
    } catch (err) {
      alert(err.message || "No se pudo crear la cuenta");
    }
  }

  return (
    <main className="auth">
      <div className="aut-card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nombre</label>
            <input className="input" name="nombre" required />
          </div>
          <div className="fiel">
            <label className="label">Apellido</label>
            <input className="input" name="apellido" required />
          </div>
          <div className="fiel">
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div className="fiel">
            <label className="label">Contraseña</label>
            <input className="input" name="password" type="password" required />
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
