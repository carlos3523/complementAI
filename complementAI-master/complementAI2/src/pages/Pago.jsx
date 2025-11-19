import React, { useState } from "react";
import { paymentsApi } from "../services/payments";
import { useNavigate } from "react-router-dom"; // para navegar a assistant
import "./pago.css";

export default function Pago() {
  const navigate = useNavigate();
  const amount = 4000; // monto fijo
  const [loading, setLoading] = useState(false);

  async function iniciarPago() {
    try {
      setLoading(true);
      const data = await paymentsApi.create(amount);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = data.token;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert("Error iniciando pago: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pago-screen">
      {/* Botón volver */}
      <button className="volver-btn" onClick={() => navigate("/assistant")}>
        Volver
      </button>

      <div className="pago-card">
        <h2>Plan Premium</h2>
        <p className="pago-amount">$4.000</p>

        <h3>Beneficios:</h3>
        <ul className="beneficios-list">
          <li>Proyectos más largos</li>
          <li>Más proyectos guardados</li>
          <li>Más tokens de chat</li>
          <li>Mayores herramientas</li>
        </ul>

        <button
          className="pago-btn"
          onClick={iniciarPago}
          disabled={loading}
        >
          {loading ? "Redirigiendo..." : "Pagar"}
        </button>
      </div>
    </div>
  );
}
