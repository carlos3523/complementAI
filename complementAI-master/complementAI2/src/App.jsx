import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Assistant from "./pages/Assistant.jsx";
import Wizard from "./pages/Wizard.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import Progreso from "./pages/Progreso";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="*" element={<Home />} />
        <Route path="/Assistant" element={<Assistant />}></Route>
        <Route path="/Wizard" element={<Wizard />}></Route>
        <Route path="/DashBoard" element={<DashBoard />}></Route>
        <Route path="/Progreso" element={<Progreso />}></Route>
      </Routes>
    </BrowserRouter>
    
  );
}
