const KEY = "auth_demo_user";

export function isAuthed() {
  return !!localStorage.getItem(KEY);
}

export function getUser() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function login(email, password) {
  // Simula llamada a API
  await new Promise((r) => setTimeout(r, 400));

  if (!email.includes("@") || password.length < 4) {
    throw new Error("Credenciales inválidas");
  }
  const user = { email, name: email.split("@")[0] };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY);
}
