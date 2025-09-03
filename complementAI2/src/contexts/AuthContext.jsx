import { createContext, useContext, useState } from "react";
import {
  getUser,
  isAuthed,
  login as svcLogin,
  logout as svcLogout,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(isAuthed() ? getUser() : null);

  async function login(email, password) {
    const u = await svcLogin(email, password);
    setUser(u);
    return u;
  }
  function logout() {
    svcLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
