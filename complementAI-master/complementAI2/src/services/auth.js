// src/services/auth.js
import { api } from "./api";

// Registro con email/password
export function register({ firstName, lastName, email, password }) {
  return api.post("/auth/register", { firstName, lastName, email, password });
}

// Login con email/password
export function login(email, password) {
  return api.post("/auth/login", { email, password });
}

// Login con Google (auto-registro si no existe)
// Pásale el ID token recibido desde Google One Tap / botón (credential)
export function googleSignIn(credential) {
  return api.post("/auth/google", { credential });
}

// Datos del usuario autenticado
export function getMe() {
  return api.get("/user/me");
}

// Actualizar tema
export function updateTheme(theme) {
  return api.patch("/user/theme", { theme });
}

// Helper opcional
export function logout() {
  localStorage.removeItem("token");
}
