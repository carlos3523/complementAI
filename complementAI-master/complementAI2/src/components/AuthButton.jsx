// src/components/AuthButton.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Cargar las preferencias del asistente desde localStorage
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

// Hook para cerrar al hacer click fuera
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, onClose]);
}

// Función para obtener las iniciales del usuario
function initialsFrom(user) {
  const a =
    user?.first_name ||
    user?.firstName ||
    user?.full_name?.split(" ")?.[0] ||
    user?.email?.[0] ||
    "";
  const b =
    user?.last_name || user?.lastName || user?.full_name?.split(" ")?.[1] || "";
  const s = `${a}`.trim().charAt(0) + `${b}`.trim().charAt(0);
  return s.toUpperCase() || "U";
}

// Propósito: Permite pasar una función al padre para que recargue la configuración
export default function AuthButton({
  logoutRedirectTo = "/login",
  refreshConfig, // 👈 Se añade la prop opcional para notificar al padre
}) {
  const { user, token, loading, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showConfig, setShowConfig] = useState(false); // 👈 Nuevo estado para el modal
  const wrapRef = useRef(null);

  // Estados locales para el modal de configuración (inicializados en useEffect)
  const [assistantStyle, setAssistantStyle] = useState("detallado");
  const [showEmojis, setShowEmojis] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [language, setLanguage] = useState("es");
  const [fontSize, setFontSize] = useState("medium");

  // Hook para cargar las preferencias al inicio
  useEffect(() => {
    const prefs = loadAssistantPrefs();
    setAssistantStyle(prefs.assistantStyle);
    setShowEmojis(prefs.showEmojis);
    setShowTimestamps(prefs.showTimestamps);
    setAutoScroll(prefs.autoScroll);
    setLanguage(prefs.language);
    setFontSize(prefs.fontSize);
  }, []);

  // Hook para cerrar el menú al hacer click fuera
  useOutsideClose(wrapRef, () => {
    if (open && !showConfig) {
      // Solo cierra el menú si no está abierto el modal de configuración
      setOpen(false);
    }
  });

  // Función para guardar los cambios de configuración
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

    setShowConfig(false); // Cerrar modal

    // Llamar a la función para notificar al componente padre (si existe)
    if (refreshConfig) {
      refreshConfig();
    }
  };

  const label = useMemo(() => {
    if (!user) return "";
    const first =
      user.first_name || user.firstName || user.full_name || user.email;
    return String(first).split(" ")[0] || "";
  }, [user]);

  if (loading) {
    // ... (código de cargando sin cambios)
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
  }

  if (!token) {
    // ... (código de botones de login/register sin cambios)
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
  }

  const showPicture = user?.picture && !imgError;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
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
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {/* Avatar */}
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

        {/* Label */}
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

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            minWidth: 220,
            background: "#15151a",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 12,
            padding: 8,
            display: "grid",
            gap: 6,
            zIndex: 20,
          }}
        >
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
            {/* mini avatar */}
            <div
              aria-hidden
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#111318",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
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
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </span>
          </div>

          {/* Botón de Mi Cuenta */}
          <button
            onClick={() => {
              setOpen(false);
              nav("/Assistant"); // cambia por tu ruta de perfil
            }}
            style={{
              border: 0,
              background: "transparent",
              color: "#eaeaea",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
              "&:hover": { background: "rgba(255,255,255,.05)" },
            }}
          >
            Mi cuenta
          </button>
          
          {/* ⚙️ NUEVO: Botón de Configuración */}
          <button
            onClick={() => {
              setOpen(false); // Cierra el menú desplegable
              setShowConfig(true); // Abre el modal de configuración
            }}
            style={{
              border: 0,
              background: "transparent",
              color: "#eaeaea",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
              "&:hover": { background: "rgba(255,255,255,.05)" },
            }}
          >
            ⚙️ Configuración Asistente
          </button>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={() => {
              setOpen(false);
              logout({ redirectTo: logoutRedirectTo }); // Usa la prop logoutRedirectTo
            }}
            style={{
              border: 0,
              background: "transparent",
              color: "#ef4444",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
              "&:hover": { background: "rgba(255,0,0,.05)" },
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {/* ⚙️ NUEVO: Modal de Configuración (estilizado con estilos en línea sencillos) */}
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
            zIndex: 50, // Debe estar por encima de todo
            padding: 20,
          }}
          onClick={() => setShowConfig(false)} // Cerrar al hacer click en el overlay
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
            onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer click dentro
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
                ⚙️ Preferencias de Asistente
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

            {/* Cuerpo del Modal */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* Control Tamaño de Fuente */}
              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>Tamaño de Fuente del Chat:</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  style={selectStyle}
                >
                  <option value="small">Pequeño (Compacto) - Aa</option>
                  <option value="medium">Mediano (Estándar) - Aa</option>
                  <option value="large">Grande (Accesible) - Aa</option>
                </select>
              </div>

              {/* Control Idioma */}
              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>Idioma de la Interfaz:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={selectStyle}
                >
                  <option value="es">Español 🇪🇸</option>
                  <option value="en">Inglés 🇬🇧</option>
                </select>
              </div>

              {/* Control Estilo de Respuesta */}
              <div style={{ display: "grid", gap: 4 }}>
                <label style={labelStyle}>Estilo de Respuesta IA:</label>
                <select
                  value={assistantStyle}
                  onChange={(e) => setAssistantStyle(e.target.value)}
                  style={selectStyle}
                >
                  <option value="compacto">Compacto (Pasos cortos)</option>
                  <option value="detallado">
                    Detallado (Incluye breves justificaciones)
                  </option>
                </select>
              </div>

              {/* Checkbox Emojis */}
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={showEmojis}
                  onChange={(e) => setShowEmojis(e.target.checked)}
                  style={checkboxInputStyle}
                />
                Mostrar Emojis en respuestas
              </label>

              {/* Checkbox Marcas de Tiempo */}
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={showTimestamps}
                  onChange={(e) => setShowTimestamps(e.target.checked)}
                  style={checkboxInputStyle}
                />
                Mostrar marcas de tiempo en mensajes
              </label>

              {/* Checkbox Auto-desplazamiento */}
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  style={checkboxInputStyle}
                />
                Habilitar auto-desplazamiento en el chat
              </label>

              {/* Botón Guardar */}
              <button onClick={handleSaveConfig} style={saveButtonStyle}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos auxiliares para el modal
const labelStyle = {
  color: "#e5e7eb",
  fontSize: 14,
  fontWeight: 500,
};

const selectStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.15)",
  background: "#1f2937", // Fondo más oscuro
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

const checkboxInputStyle = {
  width: 16,
  height: 16,
};

const saveButtonStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: 0,
  background: "#3b82f6", // Un azul visible
  color: "white",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
  "&:hover": { background: "#2563eb" },
};