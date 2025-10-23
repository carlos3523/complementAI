// server/src/middleware/auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Falta token de autenticación" });
    }

    // Verificar token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.id) {
      return res.status(401).json({ error: "Token inválido o incompleto" });
    }

    // Guardar usuario en la request
    req.user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch (err) {
    console.error("❌ Error en requireAuth:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
