// src/components/AuthButton.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../i18n/translations";

// === COMPONENTE PARA CAMBIAR TEMA ===
function ThemeToggle() {
  const [light, setLight] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    if (light) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  }, [light]);

  return (
    <button
      onClick={() => setLight(!light)}
      style={{
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 8,
        padding: "8px 10px",
        background: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {light ? "☀️ Modo claro" : "🌙 Modo oscuro"}
    </button>
  );
}

// === FUNCIONES AUXILIARES ===
function loadAssistantPrefs() {
  const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
  return {
    assistantStyle: savedPrefs.style || "detallado",
    showEmojis: savedPrefs.emojis ?? true,
    showTimestamps: savedPrefs.timestamps ?? true,
    autoScroll: savedPrefs.autoscroll ?? true,
    language: savedPrefs.language || "es",
    fontSize: savedPrefs.fontSize || "medium",
  };
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, onClose]);
}

function initialsFrom(user) {
  const a =
    user?.first_name ||
    user?.firstName ||
    user?.full_name?.split(" ")?.[0] ||
    user?.email?.[0] ||
    "";
  const b =
    user?.last_name ||
    user?.lastName ||
    user?.full_name?.split(" ")?.[1] ||
    "";
  const s = `${a}`.trim().charAt(0) + `${b}`.trim().charAt(0);
  return s.toUpperCase() || "U";
}

// === COMPONENTE PRINCIPAL ===
export default function AuthButton({
  logoutRedirectTo = "/login",
  refreshConfig,
}) {
  const { user, token, loading, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const wrapRef = useRef(null);

  const [assistantStyle, setAssistantStyle] = useState("detallado");
  const [showEmojis, setShowEmojis] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [language, setLanguage] = useState("es");
  const [fontSize, setFontSize] = useState("medium");

  const { language: globalLanguage, changeLanguage } = useLanguage();
  const t = translations[globalLanguage];

  useEffect(() => {
    const prefs = loadAssistantPrefs();
    setAssistantStyle(prefs.assistantStyle);
    setShowEmojis(prefs.showEmojis);
    setShowTimestamps(prefs.showTimestamps);
    setAutoScroll(prefs.autoScroll);
    setLanguage(prefs.language);
    setFontSize(prefs.fontSize);
  }, []);

  useOutsideClose(wrapRef, () => {
    if (open && !showConfig) setOpen(false);
  });

  const handleSaveConfig = () => {
    const prefs = {
      style: assistantStyle,
      emojis: showEmojis,
      timestamps: showTimestamps,
      autoscroll: autoScroll,
      language: language,
      fontSize: fontSize,
    };
    localStorage.setItem("assistant_prefs", JSON.stringify(prefs));

    changeLanguage(language); // 👈 actualiza el idioma global
    if (refreshConfig) refreshConfig();
    setShowConfig(false);
  };

  // Nombre corto para el pill del header (primer nombre)
  const label = useMemo(() => {
    if (!user) return "";
    const first =
      user.first_name || user.firstName || user.full_name || user.email;
    return String(first).split(" ")[0] || "";
  }, [user]);

  // Nombre "bonito" para mostrar en el menú (nombre completo o parte local del email)
  const displayName = useMemo(() => {
    if (!user) return "";
    const full =
      [user.first_name || user.firstName, user.last_name || user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    if (full) return full;
    if (user.full_name) return user.full_name;
    if (user.email) return user.email.split("@")[0];
    return "";
  }, [user]);

  if (loading)
    return (
      <div
        style={{
          padding: "6px 10px",
          borderRadius: 12,
          background: "rgba(255,255,255,.12)",
          color: "#e5e7eb",
          fontSize: 14,
        }}
      >
        Cargando…
      </div>
    );

  // Sin sesión -> botones Ingresar / Crear cuenta
  if (!token)
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <Link className="asst-appbar-btn" to="/login">
          Ingresar
        </Link>
        <Link className="asst-appbar-btn" to="/register">
          Crear cuenta
        </Link>
      </div>
    );

  const showPicture = user?.picture && !imgError;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Botón del header (pill con avatar + primer nombre) */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={user?.email}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,.12)",
          color: "#e5e7eb",
          border: "1px solid rgba(255,255,255,.18)",
          padding: "6px 10px",
          borderRadius: 999,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#111318",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            border: "1px solid rgba(255,255,255,.2)",
            overflow: "hidden",
          }}
        >
          {showPicture ? (
            <img
              src={user.picture}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            initialsFrom(user)
          )}
        </div>

        <span
          style={{
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <span aria-hidden>▾</span>
      </button>

      {/* Menú desplegable */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            minWidth: 240,
            background: "#15151a",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 12,
            padding: 8,
            display: "grid",
            gap: 6,
            zIndex: 20,
          }}
        >
          {/* Header del menú: avatar + nombre + correo */}
          <div
            style={{
              padding: "8px 10px",
              color: "#9ca3af",
              fontSize: 12,
              borderBottom: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#111318",
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                border: "1px solid rgba(255,255,255,.2)",
                overflow: "hidden",
              }}
            >
              {showPicture ? (
                <img
                  src={user.picture}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                initialsFrom(user)
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {displayName && (
                <span
                  style={{
                    color: "#e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </span>
              )}
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              nav("/Assistant");
            }}
            style={menuButtonStyle}
          >
            {t.account}
          </button>

          <button
            onClick={() => {
              setOpen(false);
              setShowConfig(true);
            }}
            style={menuButtonStyle}
          >
            ⚙️ {t.settings}
          </button>

          <button
            onClick={() => {
              setOpen(false);
              logout({ redirectTo: logoutRedirectTo });
            }}
            style={{ ...menuButtonStyle, color: "#ef4444" }}
          >
            {t.logout}
          </button>
        </div>
      )}

      {/* Modal de configuración del asistente */}
      {showConfig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              background: "#15151a",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,.1)",
                paddingBottom: 16,
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                {t.preferencesTitle}
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#9ca3af",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>{t.chatFontSize}</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  style={selectStyle}
                >
                  <option value="small">Pequeño (Compacto)</option>
                  <option value="medium">Mediano (Estándar)</option>
                  <option value="large">Grande (Accesible)</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>{t.interfaceLanguage}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={selectStyle}
                >
                  <option value="es">Español 🇪🇸</option>
                  <option value="en">English 🇬🇧</option>
                </select>
              </div>

              {/* === BOTÓN DE TEMA === */}
              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>Tema de la interfaz</label>
                <ThemeToggle />
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>{t.responseStyle}</label>
                <select
                  value={assistantStyle}
                  onChange={(e) => setAssistantStyle(e.target.value)}
                  style={selectStyle}
                >
                  <option value="compacto">Compacto</option>
                  <option value="detallado">Detallado</option>
                </select>
              </div>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={showEmojis}
                  onChange={(e) => setShowEmojis(e.target.checked)}
                  style={checkboxInputStyle}
                />
                {t.showEmojis}
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={showTimestamps}
                  onChange={(e) => setShowTimestamps(e.target.checked)}
                  style={checkboxInputStyle}
                />
                {t.showTimestamps}
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  style={checkboxInputStyle}
                />
                {t.enableAutoscroll}
              </label>

              <button onClick={handleSaveConfig} style={saveButtonStyle}>
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === ESTILOS ===
const menuButtonStyle = {
  border: 0,
  background: "transparent",
  color: "#eaeaea",
  textAlign: "left",
  padding: "6px 8px",
  borderRadius: 8,
  cursor: "pointer",
};

const labelStyle = {
  color: "#e5e7eb",
  fontSize: 14,
  fontWeight: 500,
};
const selectStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.15)",
  background: "#1f2937",
  color: "#e5e7eb",
  fontSize: 14,
  cursor: "pointer",
};
const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#e5e7eb",
  fontSize: 14,
  cursor: "pointer",
};
const checkboxInputStyle = { width: 16, height: 16 };
const saveButtonStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: 0,
  background: "#3b82f6",
  color: "white",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
};
