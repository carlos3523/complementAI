import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Usa la URL completa si está definida (recomendado)
const url = process.env.DATABASE_URL;

// o, en su defecto, variables separadas (PGHOST, etc.)
const config = url
  ? { connectionString: url, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 6543),
      database: process.env.PGDATABASE || "postgres",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    };

export const pool = new Pool({
  connectionString: url,
  ssl: { require: true, rejectUnauthorized: false },
});

export function query(text, params) {
  return pool.query(text, params);
}

// Comprobación de conexión al arrancar
pool
  .connect()
  .then((client) => {
    console.log(
      "✅ Conectado a PostgreSQL:",
      url ? new URL(url).host : `${config.host}:${config.port}`
    );
    client.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
  });
