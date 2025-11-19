// server/src/routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

import { query } from "../sql/db.js";
import transporter from "../configmail/mail.js";

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

// URL base del backend para armar el link de verificación
function getApiBaseUrl() {
  if (process.env.API_URL) return process.env.API_URL;
  const port = process.env.PORT || 4000;
  return `http://localhost:${port}`;
}

/* ======================================================
   POST /api/auth/register
   Registro normal con email & password + envío de correo
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

    // Token de verificación (24h)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Insert con campos nuevos
    const result = await query(
      `INSERT INTO users (
         email,
         password_hash,
         first_name,
         last_name,
         email_verified,
         verify_token,
         verify_token_expires,
         provider
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, email, first_name, last_name, theme, created_at, email_verified`,
      [
        email,
        hash,
        firstName,
        lastName,
        false,
        verifyToken,
        verifyTokenExpires,
        "local",
      ]
    );

    const user = result.rows[0];

    const apiBase =
      process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const verifyUrl = `${apiBase}/api/auth/verify-email?token=${verifyToken}`;

    try {
      await transporter.sendMail({
        from:
          process.env.MAIL_FROM ||
          '"ComplementAI" <no-reply@complementai.com>',
        to: user.email,
        subject: "Verifica tu correo electrónico",
        html: `
          <h1>Hola ${firstName || ""}</h1>
          <p>Gracias por registrarte en ComplementAI.</p>
          <p>Por favor, haz clic en el siguiente enlace para verificar tu correo:</p>
          <p><a href="${verifyUrl}">Verificar mi correo</a></p>
          <p>Este enlace es válido por 24 horas.</p>
          <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
        `,
      });
    } catch (mailErr) {
      console.error("❌ Error enviando correo de verificación:", mailErr);
      // 🔥 rollback: borrar usuario si falla
      await query("DELETE FROM users WHERE id=$1", [user.id]);
      return res.status(500).json({
        error:
          "No se pudo enviar el correo de verificación. Intenta de nuevo más tarde.",
      });
    }

    return res.status(201).json({
      message:
        "Usuario registrado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ error: "Error registrando usuario" });
  }
});

/* ======================================================
   GET /api/auth/verify-email
   Endpoint que marca el correo como verificado
====================================================== */
auth.get("/verify-email", async (req, res) => {
  try {
    const token = (req.query?.token || "").toString().trim();
    if (!token) {
      return res.status(400).json({ error: "Falta token" });
    }

    // Ahora traemos también el email (y lo que quieras usar)
    const rs = await query(
      `SELECT id,
              email,
              first_name,
              last_name,
              theme,
              email_verified,
              verify_token_expires
         FROM users
        WHERE verify_token = $1`,
      [token]
    );

    if (!rs.rowCount) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const user = rs.rows[0];

    const now = new Date();
    const expires = user.verify_token_expires
      ? new Date(user.verify_token_expires)
      : null;

    if (!expires || now > expires) {
      return res
        .status(400)
        .json({ error: "El enlace de verificación ha expirado." });
    }

    // Si aún no estaba verificado, lo marcamos como verificado
    if (!user.email_verified) {
      await query(
        `UPDATE users
            SET email_verified = TRUE,
                verify_token = NULL,
                verify_token_expires = NULL
          WHERE id = $1`,
        [user.id]
      );
    }

    // 👉 Aquí sí creamos un JWT REAL para auto-login
    const jwtToken = sign({ id: user.id, email: user.email });

    const FRONT_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${FRONT_URL}/verify-email-success?token=${jwtToken}`);
  } catch (e) {
    console.error("VERIFY EMAIL ERROR:", e);
    return res.status(500).json({ error: "Error al verificar correo" });
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
    console.log("📥 BODY LOGIN:", req.body); // 👈 añade esto
    console.log("📥 EMAIL:", email, "PASS:", password); // 👈 y esto

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const result = await query(
      `SELECT id,
              email,
              password_hash,
              first_name,
              last_name,
              theme,
              email_verified
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

    // 👇 Bloquea si no ha verificado el correo
    if (!user.email_verified) {
      return res.status(403).json({
        error:
          "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
      });
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
   Google Sign-In (auto-registro)
====================================================== */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

auth.post("/google", async (req, res) => {
  try {
    const credential = req.body?.credential;
    if (!credential) {
      return res.status(400).json({ error: "Falta credential" });
    }

    // Debug opcional
    try {
      const [, p] = credential.split(".");
      const payloadDbg = JSON.parse(Buffer.from(p, "base64").toString("utf8"));
      console.log(
        "[GSI DEBUG] aud:",
        payloadDbg.aud,
        "email:",
        payloadDbg.email
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
    const googleSub = payload?.sub || null;
    const fullName =
      (payload?.name || "").trim() ||
      [first, last].filter(Boolean).join(" ") ||
      null;

    if (!email) {
      return res.status(400).json({ error: "Email inválido en token" });
    }

    // ¿Ya existe?
    let result = await query(
      `SELECT id,
              email,
              first_name,
              last_name,
              theme,
              email_verified,
              provider,
              provider_id
         FROM users
        WHERE email=$1`,
      [email]
    );

    let user = result.rows[0];

    if (!user) {
      // Nuevo usuario via Google
      result = await query(
        `INSERT INTO users (
           email,
           password_hash,
           first_name,
           last_name,
           name,
           picture,
           provider,
           provider_id,
           email_verified
         )
         VALUES ($1,'',$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, email, first_name, last_name, theme, email_verified`,
        [email, first, last, fullName, picture, "google", googleSub, true]
      );
      user = result.rows[0];
    } else {
      // Si existía pero no estaba verificado, lo marcamos como verificado
      if (!user.email_verified) {
        await query(
          `UPDATE users
              SET email_verified = TRUE,
                  provider = COALESCE(provider, 'google'),
                  provider_id = COALESCE(provider_id, $2)
            WHERE id = $1`,
          [user.id, googleSub]
        );
        user.email_verified = true;
      }
    }

    const token = sign(user);

    return res.json({
      token,
      user: {
        ...user,
        picture, // la foto viene del payload; opcional guardarla en DB
      },
    });
  } catch (e) {
    console.error("GOOGLE AUTH ERROR:", e);
    return res.status(401).json({ error: "Google sign-in inválido" });
  }
});

/* ======================================================
   GET /api/auth/me  (placeholder, opcional)
====================================================== */
auth.get("/me", (_req, res) => {
  res.status(501).json({ error: "Usa GET /api/user/me (con auth)" });
});
