// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Assistant from "./pages/Assistant.jsx";
import Wizard from "./pages/Wizard.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import Progreso from "./pages/Progreso.jsx";
import VerifyEmailSuccess from "./pages/VerifyEmailSuccess.jsx";

import SuperAdminVisual from "./pages/SuperAdminVisual.jsx";
import AdminVisual from "./pages/AdminVisual.jsx";
import ModeratorVisual from "./pages/ModeratorVisual.jsx";
import ScrumMembersPage from "./pages/scrumMembers.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import ScrumBacklogPage from "./pages/ScrumBacklog.jsx";
import ScrumSprintPage from "./pages/ScrumSprint.jsx";
import ImpedimentsBacklogPage from "./pages/ImpedimentsBacklog.jsx";
import IncidentsBacklogPage from "./pages/IncidentsBacklog.jsx";

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/superadmin" element={<SuperAdminVisual />} />
      <Route path="/admin" element={<AdminVisual />} />
      <Route path="/moderator" element={<ModeratorVisual />} />

      {/* GMAIL VERIFICAION */}
      <Route path="/verify-email-success" element={<VerifyEmailSuccess />} />

      {/* privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/Progreso" element={<Progreso />} />
        <Route path="/scrum" element={<ScrumMembersPage />} />
        <Route path="/scrum/backlog" element={<ScrumBacklogPage />} />
        <Route path="/scrum/sprint" element={<ScrumSprintPage />} />
        <Route path="/ImpedimentsBacklog" element={<ImpedimentsBacklogPage />} />
        <Route path="/IncidentsBacklog" element={<IncidentsBacklogPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
