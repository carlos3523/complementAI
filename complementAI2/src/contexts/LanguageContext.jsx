import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const translations = {
  es: { greeting: "Bienvenido", logout: "Cerrar sesión", settings: "Configuración" },
  en: { greeting: "Welcome", logout: "Log out", settings: "Settings" },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "es");

  const toggleLang = () => {
    const newLang = lang === "es" ? "en" : "es";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 🔹 Usa solo named export
export const useLanguage = () => useContext(LanguageContext);
