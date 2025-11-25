// src/pages/VerifyEmailSuccess.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // AJUSTA SI SE LLAMA DISTINTO

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function VerifyEmailSuccess() {
  const query = useQuery();
  const navigate = useNavigate();
  const { setAuth } = useAuth(); // AJUSTA según tu context

  useEffect(() => {
    const token = query.get("token");

    async function run() {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Guardar token
        localStorage.setItem("token", token);

        // Cargar datos del usuario
        const resp = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          navigate("/login");
          return;
        }

        const user = await resp.json();

        // Guardarlo en AuthContext
        setAuth({ user, token });

        // Enviar al chat
        navigate("/");
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    }

    run();
  }, [query, navigate, setAuth]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="bg-black/60 rounded-2xl p-8 max-w-md text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Verificando tu cuenta…</h1>
        <p className="mb-2">Estamos completando tu inicio de sesión.</p>
        <p className="text-sm text-gray-300">
          Esto tomará solo unos segundos…
        </p>
      </div>
    </main>
  );
}
