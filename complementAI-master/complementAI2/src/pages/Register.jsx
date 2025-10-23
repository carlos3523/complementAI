import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { register as registerApi } from "../services/auth";
import "../style.css";

export default function Register() {
  const navigate = useNavigate();
  let ctx;
  try {
    ctx = useAuth();
  } catch {}

  async function handleSubmit(e) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const firstName = fd.get("firstName")?.toString().trim() || "";
    const lastName = fd.get("lastName")?.toString().trim() || "";
    const email = (fd.get("email")?.toString().trim() || "").toLowerCase();
    const password = fd.get("password")?.toString() || "";

    const payload = { firstName, lastName, email, password };

    try {
      if (ctx?.register) {
        // Si usas AuthContext, él se encarga de guardar el token/usuario
        await ctx.register(payload);
      } else {
        // Llamada directa a la API: guarda el token manualmente
        const { token } = await registerApi(payload);
        if (token) localStorage.setItem("token", token);
      }
      // Navega a la ruta correcta (minúscula)
      navigate("/Assistant");
    } catch (err) {
      alert(err?.message || "No se pudo registrar");
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nombre</label>
            <input className="input" name="firstName" required />
          </div>
          <div className="field">
            <label className="label">Apellido</label>
            <input className="input" name="lastName" required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div className="field">
            <label className="label">Contraseña</label>
            <input
              className="input"
              name="password"
              type="password"
              required
              minLength={4}
            />
          </div>
          <div className="auth-actions">
            <button className="btn-primary btn-wide" type="submit">
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
