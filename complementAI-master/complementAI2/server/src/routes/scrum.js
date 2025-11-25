// server/src/routes/scrum.js
import express from "express";
import { query } from "../sql/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* ======================================================
   Helper: comprobar que el usuario es Product Owner
====================================================== */
async function assertProductOwner(userId, projectId) {
  const rs = await query(
    `SELECT 1
       FROM project_members
      WHERE project_id = $1
        AND user_id   = $2
        AND role      = 'product_owner'
        AND status    = 'accepted'`,
    [projectId, userId]
  );

  if (!rs.rowCount) {
    const e = new Error("Solo el Product Owner puede gestionar miembros");
    e.status = 403;
    throw e;
  }
}

/* ======================================================
   GET /api/scrum/projects/:projectId/members
   Lista miembros del proyecto (cualquier miembro autenticado)
====================================================== */
router.get(
  "/projects/:projectId/members",
  requireAuth,
  async (req, res, next) => {
    try {
      const projectId = Number(req.params.projectId);

      if (!Number.isFinite(projectId)) {
        return res.status(400).json({ error: "projectId inválido" });
      }

      const rs = await query(
        `SELECT pm.id,
                pm.project_id,
                pm.user_id,
                pm.role,
                pm.status,
                u.email,
                u.first_name,
                u.last_name
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id
          WHERE pm.project_id = $1
          ORDER BY pm.role, u.email`,
        [projectId]
      );

      return res.json(rs.rows);
    } catch (err) {
      next(err);
    }
  }
);

/* ======================================================
   POST /api/scrum/projects/:projectId/members
   Crea/añade miembro (solo Product Owner)
   body: { userId, role }
====================================================== */
router.post(
  "/projects/:projectId/members",
  requireAuth,
  async (req, res, next) => {
    try {
      const projectId = Number(req.params.projectId);
      const userId = Number(req.body?.userId);
      const role = (req.body?.role || "").toString().trim();

      if (!Number.isFinite(projectId) || !Number.isFinite(userId)) {
        return res.status(400).json({ error: "projectId o userId inválido" });
      }

      if (!["product_owner", "scrum_master", "developer"].includes(role)) {
        return res.status(400).json({ error: "Rol inválido" });
      }

      // 🔐 Solo PO del proyecto puede gestionar miembros
      await assertProductOwner(req.user.id, projectId);

      // Evitar duplicados (misma persona, mismo proyecto)
      const existing = await query(
        `SELECT id
           FROM project_members
          WHERE project_id = $1
            AND user_id   = $2`,
        [projectId, userId]
      );

      if (existing.rowCount) {
        return res
          .status(409)
          .json({ error: "Ese usuario ya está asociado al proyecto" });
      }

      const rs = await query(
        `INSERT INTO project_members (project_id, user_id, role, status)
         VALUES ($1, $2, $3, 'accepted')
         RETURNING id, project_id, user_id, role, status`,
        [projectId, userId, role]
      );

      return res.status(201).json(rs.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

/* ======================================================
   DELETE /api/scrum/projects/:projectId/members/:memberId
   Elimina miembro (solo Product Owner)
====================================================== */
router.delete(
  "/projects/:projectId/members/:memberId",
  requireAuth,
  async (req, res, next) => {
    try {
      const projectId = Number(req.params.projectId);
      const memberId = Number(req.params.memberId);

      if (!Number.isFinite(projectId) || !Number.isFinite(memberId)) {
        return res.status(400).json({ error: "IDs inválidos" });
      }

      // 🔐 Solo PO
      await assertProductOwner(req.user.id, projectId);

      const rs = await query(
        `DELETE FROM project_members
          WHERE id = $1 AND project_id = $2`,
        [memberId, projectId]
      );

      if (!rs.rowCount) {
        return res.status(404).json({ error: "Miembro no encontrado" });
      }

      return res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

// ======================================================
// PRODUCT BACKLOG
// ======================================================

// Lista ítems del product backlog de un proyecto
router.get("/projects/:projectId/backlog", requireAuth, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "projectId inválido" });
    }

    const rs = await query(
      `
      SELECT
        pb.id,
        pb.project_id,
        pb.title,
        pb.description,
        pb.type,
        pb.priority,
        pb.status,
        pb.created_at,
        u.email      AS created_by_email,
        u.first_name,
        u.last_name
      FROM product_backlog pb
      LEFT JOIN users u ON pb.created_by = u.id
      WHERE pb.project_id = $1
      ORDER BY pb.priority ASC, pb.id ASC
      `,
      [projectId]
    );

    return res.json(rs.rows);
  } catch (err) {
    console.error("[GET /projects/:projectId/backlog]", err);
    return res.status(500).json({ error: "No se pudo obtener el backlog" });
  }
});

// Crear ítem del product backlog
router.post("/projects/:projectId/backlog", requireAuth, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "projectId inválido" });
    }

    const {
      title,
      description,
      type = "story",
      priority = 3,
      status = "pending",
    } = req.body || {};

    if (!title || !type) {
      return res.status(400).json({ error: "title y type son obligatorios" });
    }

    const createdBy = req.user?.id ?? null;

    const rs = await query(
      `
      INSERT INTO product_backlog (
        project_id, title, description, type, priority, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, project_id, title, description, type, priority, status, created_at
      `,
      [projectId, title, description || null, type, priority, status, createdBy]
    );

    return res.status(201).json(rs.rows[0]);
  } catch (err) {
    console.error("[POST /projects/:projectId/backlog]", err);
    return res
      .status(500)
      .json({ error: "No se pudo crear el ítem de backlog" });
  }
});

// Actualizar estado / prioridad de un ítem del backlog
router.patch("/backlog/:itemId", requireAuth, async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(itemId)) {
      return res.status(400).json({ error: "itemId inválido" });
    }

    const { status, priority } = req.body || {};
    if (!status && priority === undefined) {
      return res.status(400).json({ error: "Nada que actualizar" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }

    values.push(itemId);

    const rs = await query(
      `
      UPDATE product_backlog
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, project_id, title, description, type, priority, status, created_at
      `,
      values
    );

    if (!rs.rows[0]) return res.sendStatus(404);
    return res.json(rs.rows[0]);
  } catch (err) {
    console.error("[PATCH /backlog/:itemId]", err);
    return res.status(500).json({ error: "No se pudo actualizar el ítem" });
  }
});

// Eliminar ítem de backlog
router.delete("/backlog/:itemId", requireAuth, async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(itemId)) {
      return res.status(400).json({ error: "itemId inválido" });
    }

    await query(`DELETE FROM product_backlog WHERE id = $1`, [itemId]);
    return res.sendStatus(204);
  } catch (err) {
    console.error("[DELETE /backlog/:itemId]", err);
    return res.status(500).json({ error: "No se pudo eliminar el ítem" });
  }
});

// ======================================================
// SPRINTS
// ======================================================

router.get("/projects/:projectId/sprints", requireAuth, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "projectId inválido" });
    }

    const rs = await query(
      `
      SELECT id, project_id, name, goal, start_date, end_date, status, created_at
      FROM sprints
      WHERE project_id = $1
      ORDER BY start_date NULLS LAST, created_at DESC
      `,
      [projectId]
    );

    return res.json(rs.rows);
  } catch (err) {
    console.error("[GET] /projects/:projectId/sprints", err);
    return res
      .status(500)
      .json({ error: "No se pudieron obtener los sprints" });
  }
});

router.post("/projects/:projectId/sprints", requireAuth, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "projectId inválido" });
    }

    const { name, goal, start_date, end_date } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "name es obligatorio" });
    }

    const status = "planned";

    const rs = await query(
      `
      INSERT INTO sprints (project_id, name, goal, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, name, goal, start_date, end_date, status, created_at
      `,
      [
        projectId,
        name,
        goal || null,
        start_date || null,
        end_date || null,
        status,
      ]
    );

    return res.status(201).json(rs.rows[0]);
  } catch (err) {
    console.error("[POST] /projects/:projectId/sprints", err);
    return res.status(500).json({ error: "No se pudo crear el sprint" });
  }
});

// ======================================================
// SPRINT BACKLOG
// ======================================================

router.get("/sprints/:sprintId/backlog", requireAuth, async (req, res) => {
  try {
    const sprintId = Number(req.params.sprintId);
    if (!Number.isFinite(sprintId)) {
      return res.status(400).json({ error: "sprintId inválido" });
    }

    const rs = await query(
      `
      SELECT
        sb.id,
        sb.sprint_id,
        sb.pb_item_id,
        sb.assigned_to,
        sb.status,
        pb.title,
        pb.description,
        pb.type,
        pb.priority,
        u.email AS assigned_email
      FROM sprint_backlog sb
      JOIN product_backlog pb ON pb.id = sb.pb_item_id
      LEFT JOIN users u ON u.id = sb.assigned_to
      WHERE sb.sprint_id = $1
      ORDER BY sb.id
      `,
      [sprintId]
    );

    return res.json(rs.rows);
  } catch (err) {
    console.error("[GET] /sprints/:sprintId/backlog", err);
    return res
      .status(500)
      .json({ error: "No se pudo obtener el sprint backlog" });
  }
});

router.post("/sprints/:sprintId/backlog", requireAuth, async (req, res) => {
  try {
    const sprintId = Number(req.params.sprintId);
    if (!Number.isFinite(sprintId)) {
      return res.status(400).json({ error: "sprintId inválido" });
    }

    const { pb_item_id, assigned_to, status } = req.body || {};
    if (!pb_item_id) {
      return res.status(400).json({ error: "pb_item_id es obligatorio" });
    }

    const rs = await query(
      `
      INSERT INTO sprint_backlog (sprint_id, pb_item_id, assigned_to, status)
      VALUES ($1, $2, $3, COALESCE($4, 'todo'))
      RETURNING id, sprint_id, pb_item_id, assigned_to, status
      `,
      [sprintId, pb_item_id, assigned_to || null, status || null]
    );

    return res.status(201).json(rs.rows[0]);
  } catch (err) {
    console.error("[POST] /sprints/:sprintId/backlog", err);
    return res.status(500).json({ error: "No se pudo añadir al sprint" });
  }
});

router.patch(
  "/sprints/:sprintId/backlog/:id",
  requireAuth,
  async (req, res) => {
    try {
      const sprintId = Number(req.params.sprintId);
      const id = Number(req.params.id);

      if (!Number.isFinite(sprintId) || !Number.isFinite(id)) {
        return res.status(400).json({ error: "IDs inválidos" });
      }

      const { status, assigned_to } = req.body || {};
      if (!status && assigned_to === undefined) {
        return res
          .status(400)
          .json({ error: "Nada para actualizar (status o assigned_to)" });
      }

      const fields = [];
      const values = [];
      let idx = 1;

      if (status) {
        fields.push(`status = $${idx++}`);
        values.push(status);
      }
      if (assigned_to !== undefined) {
        fields.push(`assigned_to = $${idx++}`);
        values.push(assigned_to || null);
      }

      values.push(sprintId, id);

      const rs = await query(
        `
        UPDATE sprint_backlog
        SET ${fields.join(", ")}
        WHERE sprint_id = $${idx++} AND id = $${idx}
        RETURNING id, sprint_id, pb_item_id, assigned_to, status
        `,
        values
      );

      if (!rs.rows[0]) return res.sendStatus(404);
      return res.json(rs.rows[0]);
    } catch (err) {
      console.error("[PATCH] /sprints/:sprintId/backlog/:id", err);
      return res.status(500).json({ error: "No se pudo actualizar el ítem" });
    }
  }
);

export default router;
