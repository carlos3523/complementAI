// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  // Ajusta estos nombres a lo que exponga tu AuthContext
  const { user, token, loading } = useAuth();

  const location = useLocation();

  // Mientras carga el estado de auth (si lo manejas)
  if (loading) return null; // o un spinner

  // Si no hay sesión, redirige al login y recuerda desde dónde venía
  if (!token && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si está autenticado, renderiza las rutas hijas
  return <Outlet />;
}
