/** ecosystem.config.cjs */
module.exports = {
  apps: [
    // 🔹 BACKEND (Express + APIs + OpenRouter)
    {
      name: "complementai-backend",
      script: "node",
      args: "src/index.js",   // <-- OJO: ya NO va "server/" aquí
      cwd: "./server",        // <-- Partimos dentro de /server
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },

    // 🔹 FRONTEND (Vite)
    {
      name: "complementai-frontend",
      script: "cmd",
      args: "/c npm run dev",
      cwd: "./",
      env: {
        NODE_ENV: "development",
        PORT: 5173
      }
    }
  ]
};