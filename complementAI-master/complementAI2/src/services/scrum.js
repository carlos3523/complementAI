// src/services/scrum.js
import { api } from "./api";

const BASE = "/api/scrum";

/* =========================================================
 *  ROLES SCRUM (Project Members)
 * =======================================================*/

// GET /api/scrum/projects/:id/members
export function getProjectMembers(projectId) {
  return api.get(`${BASE}/projects/${projectId}/members`);
}

// POST /api/scrum/projects/:id/members
export function addProjectMember(projectId, userId, role) {
  return api.post(`${BASE}/projects/${projectId}/members`, {
    userId,
    role,
  });
}

// DELETE /api/scrum/projects/:id/members/:memberId
export function removeProjectMember(projectId, memberId) {
  return api.del(`${BASE}/projects/${projectId}/members/${memberId}`);
}

/* =========================================================
 *  HELPERS genéricos para fetch con JSON
 * =======================================================*/

async function handleJsonResponse(res, defaultErrorMsg) {
  // Si el servidor devolvió HTML u otro content-type, evitamos el "Unexpected token <"
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      throw new Error(defaultErrorMsg);
    }
    // Si por alguna razón es 2xx pero no json, devolvemos null
    return null;
  }

  const data = await res.json().catch(() => {
    throw new Error(defaultErrorMsg);
  });

  if (!res.ok) {
    throw new Error(data.error || defaultErrorMsg);
  }

  return data;
}

/* =========================================================
 *  PRODUCT BACKLOG
 *  Tabla: product_backlog (se asume columnas:
 *  id, project_id, title, type, priority, story_points,
 *  description, status, created_at, ...
 * =======================================================*/

// GET /api/scrum/projects/:projectId/backlog
export async function getProductBacklog(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/backlog`, {
    credentials: "include",
  });
  return handleJsonResponse(res, "No se pudo obtener el backlog");
}

// POST /api/scrum/projects/:projectId/backlog
export async function createBacklogItem(projectId, payload) {
  const res = await fetch(`${BASE}/projects/${projectId}/backlog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res, "No se pudo crear el ítem de backlog");
}

// PATCH /api/scrum/backlog/:itemId
export async function updateBacklogItem(itemId, payload) {
  const res = await fetch(`${BASE}/backlog/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res, "No se pudo actualizar el ítem de backlog");
}

// DELETE /api/scrum/backlog/:itemId
export async function deleteBacklogItem(itemId) {
  const res = await fetch(`${BASE}/backlog/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.status === 204) return;
  return handleJsonResponse(res, "No se pudo eliminar el ítem de backlog");
}

/* =========================================================
 *  SPRINTS
 * =======================================================*/

export async function getSprints(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/sprints`, {
    credentials: "include",
  });
  return handleJsonResponse(res, "No se pudieron cargar los sprints");
}

export async function createSprint(projectId, payload) {
  const res = await fetch(`${BASE}/projects/${projectId}/sprints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res, "No se pudo crear el sprint");
}

/* =========================================================
 *  SPRINT BACKLOG
 * =======================================================*/

export async function getSprintBacklog(sprintId) {
  const res = await fetch(`${BASE}/sprints/${sprintId}/backlog`, {
    credentials: "include",
  });
  return handleJsonResponse(res, "No se pudo cargar el sprint backlog");
}

export async function addItemToSprint(sprintId, payload) {
  const res = await fetch(`${BASE}/sprints/${sprintId}/backlog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res, "No se pudo añadir al sprint");
}

export async function updateSprintItem(sprintId, id, payload) {
  const res = await fetch(`${BASE}/sprints/${sprintId}/backlog/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res, "No se pudo actualizar el ítem");
}
