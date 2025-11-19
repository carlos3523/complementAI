// src/pages/ConfirmacionPago.jsx
import React, { useEffect, useState } from "react";

export default function ConfirmacionPago() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setInfo({ error: "No token provided" });
      setLoading(false);
      return;
    }

    // Opción: solicitar al backend el estado (si lo guardaste), sino mostrar token
    setInfo({ token });
    setLoading(false);
  }, []);

  if (loading) return <div>Cargando...</div>;
  return (
    <div style={{ padding: 20 }}>
      <h2>Resultado del pago</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <p>Si quieres, ahora podemos consultar el estado real en el backend y presentarlo bonito.</p>
    </div>
  );
}