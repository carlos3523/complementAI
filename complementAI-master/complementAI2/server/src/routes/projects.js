// server/src/routes/projects.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../sql/db.js";

export const projects = Router();

// ────────────────────────────────────────────────────────────
// Normalizadores/validaciones (coinciden con CHECKs de la BD)
// ────────────────────────────────────────────────────────────
const ALLOWED_METH = new Set(["pmbok", "iso21502", "agil"]);
const ALLOWED_STAGE = new Set(["idea", "planificacion", "ejecucion", "cierre"]);

function normStr(v) {
  return (v ?? "").toString().trim();
}
function normMethodology(v) {
  const s = normStr(v).toLowerCase();
  return ALLOWED_METH.has(s) ? s : null;
}
function normStage(v) {
  const s = normStr(v).toLowerCase();
  return ALLOWED_STAGE.has(s) ? s : null;
}
function normTemplates(v) {
  if (v == null) return [];
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
}

// Todas estas rutas requieren token
projects.use(requireAuth);

/**
 * GET /api/projects
 * Lista los proyectos del usuario autenticado
 */
projects.get("/", async (req, res) => {
  const { rows } = await query(
    `SELECT id, user_id, name, methodology, stage, domain, templates,
            created_at, updated_at
       FROM projects
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

/**
 * GET /api/projects/:id
 * Devuelve un proyecto del usuario (404 si no existe o no es suyo)
 */
projects.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "id inválido" });
  const { rows } = await query(
    `SELECT id, user_id, name, methodology, stage, domain, templates,
            created_at, updated_at
       FROM projects
      WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: "No encontrado" });
  res.json(rows[0]);
});

/**
 * POST /api/projects
 * Crea un proyecto del usuario
 * body: { name, methodology, stage, domain, templates }
 */
// POST /api/projects
projects.post("/", async (req, res) => {
  try {
    const { name, methodology, stage, domain, templates } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name es requerido" });
    }

    // 🔹 Resolver el userId real de la tabla users
    let userId = req.user?.id;

    // Si el token no trae un id usable, buscamos por email
    if ((!userId || Number.isNaN(Number(userId))) && req.user?.email) {
      const u = await query("SELECT id FROM users WHERE email = $1", [
        req.user.email,
      ]);
      if (u.rows[0]) {
        userId = u.rows[0].id;
      }
    }

    // Si aún así no hay userId, devolvemos 401
    if (!userId) {
      console.error(
        "[projects.post] No se pudo resolver userId para:",
        req.user
      );
      return res
        .status(401)
        .json({ error: "Usuario no encontrado para crear proyectos" });
    }

    // Siempre asegura un array JSON “limpio”
    const safeTemplates = Array.isArray(templates) ? templates : [];

    const { rows } = await query(
      `INSERT INTO projects (user_id, name, methodology, stage, domain, templates)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)
       RETURNING *`,
      [
        userId, // 👈 ahora es el id real de users
        name.trim(),
        methodology || null,
        stage || null,
        domain || null,
        JSON.stringify(safeTemplates),
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("CREATE PROJECT ERROR:", e);
    return res.status(500).json({ error: "Error creando proyecto" });
  }
});

/**
 * PUT /api/projects/:id
 * Actualiza un proyecto del usuario
 */
projects.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "id inválido" });

  const name = normStr(req.body?.name);
  const methodology = normMethodology(req.body?.methodology);
  const stage = normStage(req.body?.stage);
  const domain = normStr(req.body?.domain) || null;
  const templates = normTemplates(req.body?.templates);

  if (!name) return res.status(400).json({ error: "name es requerido" });
  if (!methodology)
    return res.status(400).json({ error: "methodology inválida" });
  if (!stage) return res.status(400).json({ error: "stage inválido" });

  const { rows } = await query(
    `UPDATE projects
        SET name=$1,
            methodology=$2,
            stage=$3,
            domain=$4,
            templates=$5,
            updated_at = NOW()      -- (el trigger también lo haría)
      WHERE id=$6 AND user_id=$7
      RETURNING id, user_id, name, methodology, stage, domain, templates,
                created_at, updated_at`,
    [name, methodology, stage, domain, templates, id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: "No encontrado" });
  res.json(rows[0]);
});

/**
 * DELETE /api/projects/:id
 */
projects.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "id inválido" });

  const { rowCount } = await query(
    "DELETE FROM projects WHERE id=$1 AND user_id=$2",
    [id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: "No encontrado" });
  res.status(204).end();
});
