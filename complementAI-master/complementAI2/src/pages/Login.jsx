// src/pages/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../style.css";

// Icono flecha (sin librerías externas)
const ArrowLeft = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email").toString().trim().toLowerCase();
    const password = fd.get("password").toString();

    try {
      await login({ email, password });
      navigate("/assistant");
    } catch (err) {
      alert(err.message || "No se pudo iniciar sesión");
    }
  }

  return (
    <main className="auth">
      {/* 🔙 Botón de volver al Home */}
      <Link to="/" className="back-btn">
        <ArrowLeft />
        <span>Home</span>
      </Link>

      <div className="auth-card">
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">
          We missed you! Please enter your details.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Enter your Email"
              required
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              name="password"
              type="password"
              placeholder="Enter Password"
              required
            />
          </div>

          <button className="btn-primary btn-wide" type="submit">
            Sign in
          </button>

          <div className="or-separator">
            <span className="or-line"></span>
            <span className="or-text">or</span>
            <span className="or-line"></span>
          </div>

          <button
            type="button"
            className="btn-google"
            // onClick={handleLoginWithGoogle}  // cuando lo tengas
          >
            <span className="btn-google-icon">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.7 1.3 9.2 3.4l6.8-6.8C35.8 2.1 30.2 0 24 0 14.6 0 6.4 5.3 2.6 13l7.9 6.1C12.8 13.4 17.9 9.5 24 9.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M46.1 24.6c0-1.7-.1-3.4-.4-5H24v10h12.5c-.5 2.6-2 4.8-4.4 6.3l7.2 5.6c4.2-3.9 6.8-9.7 6.8-16.9z"
                />
                <path
                  fill="#34A853"
                  d="M12.6 28.8c-.7-2.1-1.1-4.3-1.1-6.8s.4-4.7 1.1-6.8L4.7 9C1.7 13.6 0 18.6 0 24c0 5.4 1.7 10.4 4.7 15l7.9-6.2z"
                />
                <path
                  fill="#4285F4"
                  d="M24 48c6.5 0 12-2.1 16-5.6l-7.2-5.6c-2.1 1.4-4.8 2.2-8.8 2.2-6.1 0-11.2-3.9-13.1-9.3l-7.9 6.2C6.4 42.7 14.6 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </span>
            <span>Iniciar sesión con Google</span>
          </button>

          <p className="muted" style={{ marginTop: "16px" }}>
            Don't have an account?{" "}
            <Link to="/register" className="link-inline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
