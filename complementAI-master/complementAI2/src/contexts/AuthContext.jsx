// src/contexts/AuthContext.jsx:

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  login as loginApi,
  register as registerApi,
  googleSignIn as googleApi,
  getMe as getMeApi,
} from "../services/auth";

// Clave única para el token en localStorage
const TOKEN_KEY = "token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null); // {id, email, first_name, ...}
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || null
  );
  const [loading, setLoading] = useState(Boolean(token)); // carga inicial si hay token
  const [error, setError] = useState("");

  // Sincroniza token con localStorage
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  // Carga inicial del usuario si hay token persistido
  useEffect(() => {
    let active = true;
    async function boot() {
      if (!token) return; // no hay sesión previa
      setLoading(true);
      setError("");
      try {
        const me = await getMeApi();
        if (active) setUser(me);
      } catch (e) {
        console.warn("No se pudo cargar /user/me:", e?.message);
        if (active) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, [token]);

  // 🔹 Helper para setear user + token de una sola vez (lo usa VerifyEmailSuccess)
  function setAuth({ user: u, token: t }) {
    if (t) setToken(t);
    if (u) setUser(u);
  }

  // Helpers de sesión
  // 👇 Aquí ahora esperamos UN objeto: { email, password }
  async function login({ email, password }) {
    setError("");
    // loginApi debe hacer el POST con { email, password }
    const { token: t, user: u } = await loginApi(email, password);
    setToken(t);
    setUser(u);
    return u;
  }

  // Registro normal: ya NO guardamos token ni user,
  // solo llamamos a la API que envía el correo de verificación
  async function register(payload) {
    setError("");
    const resp = await registerApi(payload); // suele devolver { message: "..." }
    return resp;
  }

  async function googleSignIn(credential) {
    setError("");
    const { token: t, user: u } = await googleApi(credential);
    setToken(t);
    setUser(u);
    return u;
  }

  function logout({ redirectTo = "/login" } = {}) {
    setUser(null);
    setToken(null);
    setError("");
    try {
      navigate(redirectTo);
    } catch {}
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      // acciones
      login,
      register,
      googleSignIn,
      logout,
      // setters por si los necesitas
      setUser,
      setError,
      setAuth, // 🔹 para VerifyEmailSuccess.jsx
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
