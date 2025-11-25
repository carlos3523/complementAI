// server/src/sql/db.js
import pkg from "pg";

const { Pool } = pkg;

// Opcional: modo SSL según PGSSLMODE
function buildSsl() {
  const mode = (process.env.PGSSLMODE || "").toLowerCase();
  if (mode === "no-verify") return { rejectUnauthorized: false };
  if (mode === "require" || mode === "verify-full")
    return { rejectUnauthorized: true };
  // Supabase usa SSL, pero si no definiste nada, dejamos no-verify por simplicidad
  return { rejectUnauthorized: false };
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[db] ❌ Falta DATABASE_URL en server/.env");
}

const pool = new Pool({
  connectionString,
  ssl: buildSsl(),
});

// Log de errores del pool (sin tumbar el proceso)
pool.on("error", (err) => {
  console.error("[pg] Pool error:", err);
});

export const query = (text, params) => pool.query(text, params);
export { pool };
