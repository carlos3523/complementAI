import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // (si tu PG requiere SSL)
});

export async function query(text, params) {
  return pool.query(text, params);
}
// server/src/db/db.js
pool
  .connect()
  .then((client) => {
    console.log("✅ Conectado a PostgreSQL correctamente");
    client.release();
  })
  .catch((err) =>
    console.error("❌ Error conectando a PostgreSQL:", err.message)
  );
