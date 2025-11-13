// src/services/api.js

// URL base de tu backend (sin /api al final)
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Intenta extraer mensaje de error de JSON o texto
async function parseError(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message || `HTTP ${res.status}`;
  } catch {
    try {
      const text = await res.text();
      return text || `HTTP ${res.status}`;
    } catch {
      return `HTTP ${res.status}`;
    }
  }
}

async function handle(res) {
  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Envoltorio para capturar errores de red / CORS (Failed to fetch)
async function request(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (_err) {
    // TypeError de fetch típicamente = CORS, servidor caído, URL inválida, etc.
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que la API esté activa, el puerto y CORS."
    );
  }
}

export const api = {
  get: (url) =>
    request(`${BASE}${url}`, {
      headers: { ...authHeader() },
    }).then(handle),

  post: (url, body) =>
    request(`${BASE}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    }).then(handle),

  put: (url, body) =>
    request(`${BASE}${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    }).then(handle),

  patch: (url, body) =>
    request(`${BASE}${url}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    }).then(handle),

  del: (url) =>
    request(`${BASE}${url}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    }).then(handle),
};
