// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

// ⭐ IMPORTA TU PROVIDER DE LENGUAJE
import { LanguageProvider } from "./contexts/LanguageContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="182644363022-uas4etqbun29pu69gdm3882iu87dh7ok.apps.googleusercontent.com">
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
