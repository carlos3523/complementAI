import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../sql/db.js";
import { OAuth2Client } from "google-auth-library";

export const auth = Router();

// =======================
//  Utilidades comunes
// =======================
function sign(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

const normalizeEmail = (e) => (e || "").toString().trim().toLowerCase();

// =======================
//  POST /api/auth/register
// =======================
auth.post("/register", async (req, res) => {
  try {
    const firstName = (req.body?.firstName || "").toString().trim() || null;
    const lastName = (req.body?.lastName || "").toString().trim() || null;
    const email = normalizeEmail(req.body?.email);
    const password = (req.body?.password || "").toString();

    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });

    const exists = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rowCount)
      return res.status(409).json({ error: "El email ya está registrado" });

    const hash = await bcrypt.hash(password, 10);
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

// =======================
//  POST /api/auth/login
// =======================
auth.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = (req.body?.password || "").toString();

    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, theme
       FROM users WHERE email=$1`,
      [email]
    );
    if (!result.rowCount)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    delete user.password_hash;
    const token = sign(user);
    return res.json({ token, user });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ error: "Error iniciando sesión" });
  }
});

// =======================
//  Google Sign-In (auto-registro)
// =======================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

auth.post("/google", async (req, res) => {
  try {
    const credential = req.body?.credential;
    if (!credential) return res.status(400).json({ error: "Falta credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const first = (payload?.given_name || "").trim() || null;
    const last = (payload?.family_name || "").trim() || null;
    const picture = payload?.picture || null;

    if (!email)
      return res.status(400).json({ error: "Email inválido en token" });

    // Busca usuario o lo crea si no existe
    let result = await query(
      `SELECT id, email, first_name, last_name, theme FROM users WHERE email=$1`,
      [email]
    );

    let user = result.rows[0];
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
    // Adjunta la foto en la respuesta
    return res.json({
      token,
      user: {
        ...user,
        picture,
      },
    });
  } catch (e) {
    console.error("GOOGLE AUTH ERROR:", e);
    return res.status(401).json({ error: "Google sign-in inválido" });
  }
});

// =======================
//  GET /api/auth/me (placeholder)
// =======================
auth.get("/me", async (_req, res) => {
  res.status(501).json({ error: "Usa GET /api/user/me (con auth)" });
});
