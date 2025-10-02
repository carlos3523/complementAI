import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    if (light) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  }, [light]);

  return (
    <button
      className="btn-ghost"
      onClick={() => setLight(!light)}
      style={{ marginLeft: 12 }}
    >
      {light ? "☀️ Claro" : "🌙 Oscuro"}
    </button>
  );
}

