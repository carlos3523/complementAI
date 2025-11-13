// src/services/auth.js
// Usa SIEMPRE la instancia `api` (configurada en src/services/api.js)

import { api } from "./api";

// =======================
// Registro con email/password
// =======================
export async function register({ firstName, lastName, email, password }) {
  return api.post("/api/auth/register", {
    firstName,
    lastName,
    email,
    password,
  }); // -> { token, user }
}

// =======================
// Login con email/password
// =======================
export async function login(email, password) {
  return api.post("/api/auth/login", { email, password }); // -> { token, user }
}

// =======================
// Login con Google (auto-registro si no existe)
// Pásale el ID token (credential) que devuelve GSI
// =======================
export async function googleSignIn(credential) {
  return api.post("/api/auth/google", { credential }); // -> { token, user }
}

// =======================
// Datos del usuario autenticado
// =======================
export async function getMe() {
  return api.get("/api/user/me"); // -> { ...user }
}

// =======================
// Actualizar tema del usuario
// =======================
export async function updateTheme(theme) {
  return api.patch("/api/user/theme", { theme }); // -> { ok: true, theme }
}

// =======================
// Reenviar verificación de correo (si lo usas)
// =======================
export async function resendVerification(email) {
  return api.post("/api/auth/resend-verification", { email }); // -> { ok: true }
}

// =======================
// Verificar email con token (si lo usas)
// =======================
export async function verifyEmailToken(token) {
  // Nuestro api.get solo recibe URL, así que metemos el token como querystring
  return api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`); // -> { ok: true }
}

// =======================
// Helper: logout local
// =======================
export function logout() {
  localStorage.removeItem("token");
}
