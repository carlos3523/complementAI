// src/pages/Login.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { login as loginApi, googleSignIn } from "../services/auth";
import "../style.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/Assistant";

  const googleBtnRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);

  let ctx;
  try {
    ctx = useAuth();
  } catch {
    // Si no hay AuthContext, usamos el fallback con localStorage
  }

  // =======================
  // Manejo de login manual
  // =======================
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

  // =======================
  // Google Identity Services
  // =======================
  useEffect(() => {
    const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("[GSI] client_id:", cid);
    console.log("[GSI] window.google present?", !!window.google);

    if (!window.google) {
      console.warn("[GSI] Google script not found. Check <script> and adblock.");
      return;
    }
    if (!cid) {
      console.warn("[GSI] Missing VITE_GOOGLE_CLIENT_ID. Did you restart Vite?");
      return;
    }

    /* global google */
    google.accounts.id.initialize({
      client_id: cid,
      callback: async (response) => {
        try {
          const credential = response.credential;
          if (!credential) throw new Error("No se recibió credential de Google");

          // ⬅️ PRIMERO intentamos usar el contexto (actualiza user al tiro)
          if (ctx?.googleSignIn) {
            await ctx.googleSignIn(credential);
          } else {
            // Fallback sin contexto
            const { token } = await googleSignIn(credential);
            if (token) localStorage.setItem("token", token);
          }

          navigate(from, { replace: true });
        } catch (err) {
          console.error("[GSI] Backend error:", err);
          alert(err.message || "Error al iniciar sesión con Google");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (googleBtnRef.current) {
      try {
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          logo_alignment: "left",
          width: 340,
          text: "signin_with",
        });
        console.log("[GSI] Button rendered");
      } catch (e) {
        console.error("[GSI] renderButton error:", e);
      }
    } else {
      console.warn("[GSI] googleBtnRef.current is null");
    }
  }, [from, navigate, ctx]);

  // =======================
  // Render
  // =======================
  return (
    <main className="auth auth--gradient">
      <header className="auth-topbar">
        <Link className="topbar-back" to="/">← Home</Link>
        <div className="topbar-brand">
          <span className="brand-mark">◎</span>
          <span className="brand-name">PEPPO</span>
        </div>
      </header>

      <div className="auth-card auth-card--soft">
        <h1 className="auth-welcome">Welcome Back!</h1>
        <p className="auth-sub">We missed you! Please enter your details.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <label className="field">
            <span className="field-label">Email</span>
            <span className="input-wrap">
              <svg className="input-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" />
                <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" />
              </svg>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="Enter your Email"
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <span className="input-wrap">
              <svg className="input-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 4a8 8 0 0 1 8 8s-3 6-8 6-8-6-8-6 3-8 8-8z"
                  fill="none"
                  stroke="currentColor"
                />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" />
              </svg>
              <input
                className="input"
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="Enter Password"
                required
                minLength={4}
              />
              <button
                type="button"
                className="input-ghost"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </span>
          </label>

          <div className="row-between">
            <label className="remember">
              <input type="checkbox" /> <span>Remember me</span>
            </label>
            <Link to="/forgot" className="link-inline">
              Forgot password?
            </Link>
          </div>

          <button className="btn-primary btn-wide" type="submit">
            Sign in
          </button>
        </form>

        <div className="or-separator">
          <span className="or-line" />
          <span className="or-text">or</span>
          <span className="or-line" />
        </div>

        {/* Contenedor del botón de Google */}
        <div
          className="social-row"
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 8,
            minHeight: 45,
          }}
        >
          <div ref={googleBtnRef} style={{ display: "inline-block" }} />
        </div>

        <p className="muted" style={{ marginTop: 16 }}>
          Don’t have an account?{" "}
          <Link to="/register" className="link-inline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
  