// src/pages/Register.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { register as registerApi } from "../services/auth";
import "../style.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Icono de flecha (mismo que en Login)
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

export default function Register() {
  const [step, setStep] = useState("form"); // "form" | "check-email"
  const [emailSentTo, setEmailSentTo] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

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
        await ctx.register(payload);
      } else {
        await registerApi(payload);
      }

      // Mostrar pantalla de verificación
      setEmailSentTo(email);
      setStep("check-email");
      setResendMsg("");
    } catch (err) {
      alert(err?.message || "No se pudo enviar el correo de verificación");
    }
  }

  async function handleResend() {
    if (!emailSentTo) return;
    setResendLoading(true);
    setResendMsg("");

    try {
      const resp = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailSentTo }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data.error || "No se pudo reenviar el correo");
      }

      setResendMsg("Te enviamos un nuevo correo de verificación ✉️");
    } catch (err) {
      setResendMsg(err.message);
    } finally {
      setResendLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  //  PANTALLA “REVISA TU CORREO”
  // ─────────────────────────────────────────────
  if (step === "check-email") {
    return (
      <main className="auth auth-bg">
        {/* Botón Back */}
        <Link to="/" className="back-btn">
          <ArrowLeft />
          <span>Home</span>
        </Link>

        <div className="auth-card fade-in-up">
          <h2 className="auth-title">Revisa tu correo</h2>

          <p className="auth-subtitle">
            Te enviamos un enlace de verificación a:
          </p>

          <p style={{ marginTop: 8, fontWeight: "bold" }}>{emailSentTo}</p>

          <p className="muted" style={{ marginTop: 18 }}>
            Haz clic en <strong>"Verificar mi correo"</strong> en el mensaje que
            te llegó. Una vez verificado, se iniciará sesión automáticamente.
          </p>

          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary btn-wide"
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading
                ? "Reenviando..."
                : "Reenviar correo de verificación"}
            </button>
          </div>

          {resendMsg && (
            <p
              className="muted"
              style={{ marginTop: 12, fontSize: 13, minHeight: 18 }}
            >
              {resendMsg}
            </p>
          )}

          <button
            className="link-inline"
            style={{ marginTop: 18, fontSize: 13 }}
            onClick={() => {
              setStep("form");
              setResendMsg("");
            }}
          >
            Cambiar correo / registrar otra cuenta
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  //  FORMULARIO NORMAL (mismo look que login)
  // ─────────────────────────────────────────────
  return (
    <main className="auth auth-bg">
      {/* Botón Back */}
      <Link to="/" className="back-btn">
        <ArrowLeft />
        <span>Home</span>
      </Link>

      <div className="auth-card fade-in-up">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">
          Join ComplementAI and organiza tus proyectos con IA.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">First name</label>
            <input
              className="input"
              name="firstName"
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="field">
            <label className="label">Last name</label>
            <input
              className="input"
              name="lastName"
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              minLength={4}
            />
          </div>

          <div className="auth-actions" style={{ marginTop: 16 }}>
            <button className="btn-primary btn-wide" type="submit">
              Sign up
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            Already have an account?{" "}
            <Link to="/login" className="link-inline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
