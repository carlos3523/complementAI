// server/src/routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../sql/db.js";
import { OAuth2Client } from "google-auth-library";

export const auth = Router();

/* ======================================================
   Utilidades comunes
====================================================== */
function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const normalizeEmail = (e) => (e || "").toString().trim().toLowerCase();

/* ======================================================
   POST /api/auth/register
   Registro normal con email & password
====================================================== */
auth.post("/register", async (req, res) => {
  try {
    const firstName = (req.body?.firstName || "").toString().trim() || null;
    const lastName = (req.body?.lastName || "").toString().trim() || null;
    const email = normalizeEmail(req.body?.email);
    const password = (req.body?.password || "").toString();

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    // ¿Ya existe ese email?
    const exists = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Tu tabla original: id, email, password_hash, first_name, last_name, theme, created_at
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, first_name, last_name, theme, created_at`,
      [email, hash, firstName, lastName]
    );

    const user = result.rows[0];
    const token = sign(user);

    return res.status(201).json({ token, user });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ error: "Error registrando usuario" });
  }
});

/* ======================================================
   POST /api/auth/login
   Login normal con email & password
====================================================== */
auth.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = (req.body?.password || "").toString();

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, theme
       FROM users
       WHERE email=$1`,
      [email]
    );

    if (!result.rowCount) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res
        .status(401)
        .json({ error: "La cuenta no tiene contraseña local" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    delete user.password_hash;
    const token = sign(user);

    return res.json({ token, user });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ error: "Error iniciando sesión" });
  }
});

/* ======================================================
   POST /api/auth/google
   Google Sign-In (auto-registro) SIN columnas extra
====================================================== */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

auth.post("/google", async (req, res) => {
  try {
    const credential = req.body?.credential;
    if (!credential) {
      return res.status(400).json({ error: "Falta credential" });
    }

    // 🔍 Debug opcional para comprobar aud / email
    try {
      const [, p] = credential.split(".");
      const payload = JSON.parse(
        Buffer.from(p, "base64").toString("utf8")
      );
      console.log(
        "[GSI DEBUG] aud:",
        payload.aud,
        "iss:",
        payload.iss,
        "email:",
        payload.email
      );
      console.log(
        "[GSI DEBUG] GOOGLE_CLIENT_ID (server):",
        process.env.GOOGLE_CLIENT_ID
      );
    } catch {
      console.log("[GSI DEBUG] no se pudo decodificar el token");
    }

    // Verificación oficial del ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const first = (payload?.given_name || "").trim() || null;
    const last = (payload?.family_name || "").trim() || null;
    const picture = payload?.picture || null;

    if (!email) {
      return res.status(400).json({ error: "Email inválido en token" });
    }

    // Solo usamos tu esquema original.
    let result = await query(
      `SELECT id, email, first_name, last_name, theme
       FROM users
       WHERE email=$1`,
      [email]
    );

    let user = result.rows[0];

    // Si no existe, lo creamos con password_hash vacío
    if (!user) {
      result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, '', $2, $3)
         RETURNING id, email, first_name, last_name, theme`,
        [email, first, last]
      );
      user = result.rows[0];
    }

    const token = sign(user);

    return res.json({
      token,
      user: {
        ...user,
        picture, // la foto viene del payload, no se guarda en DB
      },
    });
  } catch (e) {
    console.error("GOOGLE AUTH ERROR:", e);
    return res.status(401).json({ error: "Google sign-in inválido" });
  }
});

/* ======================================================
   GET /api/auth/me  (placeholder, opcional)
   Tu proyecto usa /api/user/me con requireAuth; esto solo evita 404 aquí.
====================================================== */
auth.get("/me", (_req, res) => {
  res.status(501).json({ error: "Usa GET /api/user/me (con auth)" });
});
