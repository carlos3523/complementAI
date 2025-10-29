// server/src/sql/db.js
import pg from "pg";

const { Pool } = pg;

function buildSsl() {
  const mode = (process.env.PGSSLMODE || "").toLowerCase();
  if (mode === "no-verify") return { rejectUnauthorized: false };
  if (mode === "require" || mode === "verify-full") return { rejectUnauthorized: true };
  // Supabase pooler requiere SSL; si no definiste PGSSLMODE, forzamos no-verify.
  return { rejectUnauthorized: false };
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: buildSsl(),

  // valores sanos para pooler
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
});

// ¡Muy importante!: NO dejes este evento sin manejar
pool.on("error", (err) => {
  console.error("[pg] Pool error:", err); // loguea pero NO revienta el proceso
});

export const query = (text, params) => pool.query(text, params);


