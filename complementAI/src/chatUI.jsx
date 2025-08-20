import React, { useState } from 'react';
import './ChatUI.css'; // Importa el archivo CSS para los estilos

const ChatUI = () => {
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const handleGenerate = async () => {
    // Aquí es donde se conectaría con la API de la IA
    // Por ahora, simulamos una respuesta
    const simulatedResponse = 'La IA está respondiendo a tu consulta...';
    setAiResponse(simulatedResponse);
  };

    return (
      <div className="container">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>Nombre Super Bacan</h1>
          </div>
          <div className="navbar-menu">
            <a href="#">Nosotros</a>
            <a href="#">Ingresar</a>
            <a href="#">Inscribirse</a>
          </div>
        </nav>
        <div className="main-content">
        <div className="input-section">
  <h2>Título</h2>
  <div className="history-container">
    {/* Aquí irían los mensajes anteriores. Por ahora, lo dejamos vacío */}
    <div className="message-placeholder"></div>
    <div className="message-placeholder"></div>
  </div>
  <textarea
    className="input-box"
    placeholder="Ingresar texto..."
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
  />
  <button className="generate-button" onClick={handleGenerate}>
    Generar
  </button>
</div>
        <div className="response-section">
          <h2>Respuesta</h2>
          <div className="response-box">
            <p>{aiResponse}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;