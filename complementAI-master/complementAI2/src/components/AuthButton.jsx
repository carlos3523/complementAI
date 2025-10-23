// src/components/AuthButton.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
    user?.last_name || user?.lastName || user?.full_name?.split(" ")?.[1] || "";
  const s = `${a}`.trim().charAt(0) + `${b}`.trim().charAt(0);
  return s.toUpperCase() || "U";
}

export default function AuthButton({ logoutRedirectTo = "/login" }) {
  const { user, token, loading, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const wrapRef = useRef(null);
  useOutsideClose(wrapRef, () => setOpen(false));

  const label = useMemo(() => {
    if (!user) return "";
    const first =
      user.first_name || user.firstName || user.full_name || user.email;
    return String(first).split(" ")[0] || "";
  }, [user]);

  if (loading) {
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

          {/* Placeholder de perfil/config */}
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
            }}
          >
            Mi cuenta
          </button>

          <button
            onClick={() => {
              setOpen(false);
              logout({ redirectTo: "/login" });
            }}
            style={{
              border: 0,
              background: "transparent",
              color: "#ef4444",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
