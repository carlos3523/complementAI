import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./confirmacionPago.css";

export default function ConfirmacionPago() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Simulamos éxito si existe el token
    if (token) {
      setSuccess(true);
    } else {
      setSuccess(false);
    }

    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="confirmacion-screen">
        <div className="confirmacion-card">
          <p>Cargando...</p>
        </div>
      </div>
    );

  return (
    <div className="confirmacion-screen">
      <div className="confirmacion-card">
        {success ? (
          <>
            <h2>¡Felicidades!</h2>
            <p className="confirmacion-text">
              Ya eres usuario pro!
            </p>
          </>
        ) : (
          <p className="confirmacion-text">No se pudo confirmar tu suscripción.</p>
        )}

        <button
          className="confirmacion-btn"
          onClick={() => navigate("/assistant")}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
