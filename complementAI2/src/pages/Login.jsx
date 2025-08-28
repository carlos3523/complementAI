import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // si aún no usas AuthContext, no pasa nada (fallback abajo)
import "../style.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // si venías de una ruta protegida, vuelve ahí; si no, al dashboard
  const from = location.state?.from?.pathname || "/Assistant";

  // soporta ambos casos: con AuthContext o sin él
  let ctx = null;
  try {
    ctx = useAuth();
  } catch {}
  const loginCtx = ctx?.login;

  async function handleSubmit(e) {
    e.preventDefault(); // evita recarga
    const data = new FormData(e.currentTarget);
    const email = (data.get("email") || "").toString().trim();
    const password = (data.get("password") || "").toString();

    try {
      if (loginCtx) {
        // usando AuthContext (services/auth.js)
        await loginCtx(email, password);
      } else {
        // fallback: “sesión” de demo
        if (!email.includes("@") || password.length < 4)
          throw new Error("Credenciales inválidas");
        localStorage.setItem(
          "auth_demo_user",
          JSON.stringify({ email, name: email.split("@")[0] })
        );
      }
      navigate(from, { replace: true }); // <-- redirección
    } catch (err) {
      alert(err.message || "No se pudo iniciar sesión");
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              name="email" // <-- IMPORTANTE: nombre del campo
              type="email"
              required
              placeholder="tucorreo@dominio.com"
            />
          </div>

          <div className="field">
            <label className="label">Contraseña</label>
            <input
              className="input"
              name="password" // <-- IMPORTANTE: nombre del campo
              type="password"
              required
              minLength={4}
              placeholder="••••••••"
            />
          </div>

          <div className="auth-actions">
            <button className="btn-primary btn-wide" type="submit">
              Entrar
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="link-inline">
              Registrarse
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
