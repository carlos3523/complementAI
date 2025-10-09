// localStorage key to persist user session
const KEY = "auth_user";

export function isAuthed() {
  return !!localStorage.getItem(KEY);
}

export function getUser() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

// Envia credenciales al backend para iniciar sesión
export async function login(email, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error de inicio de sesión");
  }
  const user = await res.json();
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

// Crea un nuevo usuario en la base de datos
export async function register(nombre, apellido, email, password) {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, apellido, email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "No se pudo crear el usuario");
  }
  return await res.json();
}

export function logout() {
  localStorage.removeItem(KEY);
}
