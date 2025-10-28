import React, { createContext, useState, useEffect, useContext } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const savedPrefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
    setLanguage(savedPrefs.language || "es");
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    const prefs = JSON.parse(localStorage.getItem("assistant_prefs") || "{}");
    prefs.language = newLang;
    localStorage.setItem("assistant_prefs", JSON.stringify(prefs));
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}