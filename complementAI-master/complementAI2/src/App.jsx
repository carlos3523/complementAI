// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Assistant from "./pages/Assistant.jsx";
import Wizard from "./pages/Wizard.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import Progreso from "./pages/Progreso.jsx";
import Pago from "./pages/Pago.jsx";
import ConfirmacionPago from "./pages/ConfirmacionPago.jsx";
import VerifyEmailSuccess from "./pages/VerifyEmailSuccess.jsx";
import SuperAdminVisual from "./pages/SuperAdminVisual.jsx";
import AdminVisual from "./pages/AdminVisual.jsx";
import ModeratorVisual from "./pages/ModeratorVisual.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/pago" element={<Pago />} />
      <Route path="/superadmin" element={<SuperAdminVisual />} />
      <Route path="/admin" element={<AdminVisual />} />
      <Route path="/moderator" element={<ModeratorVisual />} />
      <Route path="/pago-confirmado" element={<ConfirmacionPago />} />

            {/* GMAIL VERIFICAION */}
      <Route path="/verify-email-success" element={<VerifyEmailSuccess />} />

      {/* privadas (bloque con Outlet) */}
      
      <Route element={<ProtectedRoute />}>
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/Progreso" element={<Progreso />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
