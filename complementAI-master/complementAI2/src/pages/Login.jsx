// src/page/Login.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as loginApi, googleSignIn } from "../services/auth";
import "../style.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/Assistant";

  let ctx;
  try {
    ctx = useAuth();
  } catch {}

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email")?.toString().trim() || "").toLowerCase();
    const password = fd.get("password")?.toString();

    try {
      if (ctx?.login) {
        await ctx.login(email, password);
      } else {
        const { token } = await loginApi(email, password);
        if (token) localStorage.setItem("token", token);
      }
      navigate(from, { replace: true });
    } catch (err) {
      alert(err.message || "No se pudo iniciar sesión");
    }
  }

  // Google Sign-In (opcional)
  async function handleGoogle(credential) {
    try {
      const { token } = await googleSignIn(credential);
      if (token) localStorage.setItem("token", token);
      navigate(from, { replace: true });
    } catch (err) {
      alert(err.message || "Error al iniciar sesión con Google");
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
              name="email"
              type="email"
              required
              placeholder="tucorreo@dominio.com"
            />
          </div>
          <div className="field">
            <label className="label">Contraseña</label>
            <input
              className="input"
              name="password"
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
        </form>

        {/* Botón de Google (solo si activas el script de GSI en index.html) */}
        <div
          id="g_id_onload"
          data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
          data-callback="handleGoogleResponse"
          data-auto_prompt="false"
        ></div>
        <div
          className="g_id_signin"
          data-type="standard"
          data-shape="rectangular"
          data-theme="outline"
          data-text="signin_with"
          data-size="large"
          data-logo_alignment="left"
        ></div>

        <p className="muted" style={{ marginTop: 12 }}>
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="link-inline">
            Registrarse
          </Link>
        </p>
      </div>
    </main>
  );
}

// callback global para Google One Tap / botón
window.handleGoogleResponse = async (response) => {
  const credential = response?.credential;
  if (credential) {
    // Importa dinámicamente para usar dentro del callback global
    const { googleSignIn } = await import("../services/auth");
    const navigate = (await import("react-router-dom")).useNavigate?.() || null;
    try {
      const { token } = await googleSignIn(credential);
      if (token) localStorage.setItem("token", token);
      if (navigate) navigate("/Assistant");
    } catch (err) {
      alert(err.message || "Error al iniciar sesión con Google");
    }
  }
};
