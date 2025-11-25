// server/src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación:
 * - Lee Authorization: Bearer <token>
 * - Verifica el JWT
 * - Deja req.user = { id, email, name?, provider? }
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Falta token de autenticación" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.id) {
      return res.status(401).json({ error: "Token inválido o incompleto" });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      provider: payload.provider || "local",
    };

    next();
  } catch (err) {
    console.error("[requireAuth] Error:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
