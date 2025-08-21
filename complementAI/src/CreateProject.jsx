import React, { useState } from 'react';
import './CreateProject.css'; // Opcional, si quieres estilos únicos

const CreateProject = () => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleGenerate = () => {
    // Aquí puedes manejar la lógica para generar el proyecto
    console.log('Título del proyecto:', projectTitle);
    console.log('Descripción:', projectDescription);
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
        <div className="single-box">
          <h2>Crear Proyecto</h2>
          <div className="form-group">
            <label htmlFor="title">Título</label>
            <input
              type="text"
              id="title"
              className="input-field"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              className="textarea-field"
              placeholder="Explica tu proyecto de forma detallada y pregunta sobre cómo podrías empezar a organizarlo."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </div>
          <button className="generate-button" onClick={handleGenerate}>
            Generar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;