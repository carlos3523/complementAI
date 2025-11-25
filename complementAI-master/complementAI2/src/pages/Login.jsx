// src/pages/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import "../style.css";

// Icono flecha
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
  const { login, googleSignIn } = useAuth();

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
      {/* Back Button */}
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

          {/* 🔹 Google Login Oficial */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  await googleSignIn(credentialResponse.credential);
                  navigate("/assistant");
                } catch (err) {
                  console.error("Error Google:", err);
                  alert(err.message || "No se pudo iniciar sesión con Google");
                }
              }}
              onError={() => {
                alert("Error al iniciar sesión con Google");
              }}
              theme="outline"
              shape="pill"
              size="large"
              locale="es"
            />
          </div>

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
