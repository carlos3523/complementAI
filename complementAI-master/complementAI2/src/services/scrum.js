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
  return api.delete(`${BASE}/projects/${projectId}/members/${memberId}`);
}

/* =========================================================
 *  PRODUCT BACKLOG  (Axios)
 * =======================================================*/

// GET /api/scrum/projects/:projectId/backlog
export async function getProductBacklog(projectId) {
  const res = await api.get(`${BASE}/projects/${projectId}/backlog`);
  const data = res.data;
  // Acepta tanto [ ... ] como { rows: [ ... ] }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.rows)) return data.rows;
  return [];
}

// POST /api/scrum/projects/:projectId/backlog
export async function createBacklogItem(projectId, payload) {
  const res = await api.post(`${BASE}/projects/${projectId}/backlog`, payload);
  return res.data;
}

// PATCH /api/scrum/backlog/:itemId
export async function updateBacklogItem(itemId, payload) {
  const res = await api.patch(`${BASE}/backlog/${itemId}`, payload);
  return res.data;
}

// DELETE /api/scrum/backlog/:itemId
export async function deleteBacklogItem(itemId) {
  await api.delete(`${BASE}/backlog/${itemId}`);
}

/* =========================================================
 *  SPRINTS  (Axios)
 * =======================================================*/

export async function getSprints(projectId) {
  const res = await api.get(`${BASE}/projects/${projectId}/sprints`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.rows)) return data.rows;
  return [];
}

export async function createSprint(projectId, payload) {
  const res = await api.post(`${BASE}/projects/${projectId}/sprints`, payload);
  return res.data;
}

/* =========================================================
 *  SPRINT BACKLOG  (Axios)
 * =======================================================*/

export async function getSprintBacklog(sprintId) {
  const res = await api.get(`${BASE}/sprints/${sprintId}/backlog`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.rows)) return data.rows;
  return [];
}

export async function addItemToSprint(sprintId, payload) {
  const res = await api.post(`${BASE}/sprints/${sprintId}/backlog`, payload);
  return res.data;
}

export async function updateSprintItem(sprintId, id, payload) {
  const res = await api.patch(
    `${BASE}/sprints/${sprintId}/backlog/${id}`,
    payload
  );
  return res.data;
}

/* =========================================================
 *  PARKING LOT
 * =======================================================*/

export async function getParkingLot(projectId) {
  const res = await api.get(`${BASE}/projects/${projectId}/parking-lot`);
  return res.data;
}

export async function createParkingItem(projectId, payload) {
  const res = await api.post(
    `${BASE}/projects/${projectId}/parking-lot`,
    payload
  );
  return res.data;
}

export async function deleteParkingItem(id) {
  await api.delete(`${BASE}/parking-lot/${id}`);
}

/* =========================================================
 *  MÉTRICAS (Burndown / Velocity)
 * =======================================================*/

export async function getSprintMetrics(sprintId) {
  const res = await api.get(`${BASE}/sprints/${sprintId}/metrics`);
  return res.data;
}

export async function createSprintMetric(sprintId, payload) {
  const res = await api.post(`${BASE}/sprints/${sprintId}/metrics`, payload);
  return res.data;
}

export async function deleteSprintMetric(id) {
  await api.delete(`${BASE}/metrics/${id}`);
}

/* =========================================================
 *  IMPEDIMENTOS
 * =======================================================*/

export async function getImpediments(projectId) {
  const res = await api.get(`${BASE}/projects/${projectId}/impediments`);
  return res.data;
}

export async function createImpediment(projectId, payload) {
  const res = await api.post(
    `${BASE}/projects/${projectId}/impediments`,
    payload
  );
  return res.data;
}

export async function updateImpediment(id, payload) {
  const res = await api.patch(`${BASE}/impediments/${id}`, payload);
  return res.data;
}

export async function deleteImpediment(id) {
  await api.delete(`${BASE}/impediments/${id}`);
}

/* =========================================================
 *  INCIDENTES
 * =======================================================*/

export async function getIncidents(projectId) {
  const res = await api.get(`${BASE}/projects/${projectId}/incidents`);
  return res.data;
}

export async function createIncident(projectId, payload) {
  const res = await api.post(
    `${BASE}/projects/${projectId}/incidents`,
    payload
  );
  return res.data;
}

export async function updateIncident(id, payload) {
  const res = await api.patch(`${BASE}/incidents/${id}`, payload);
  return res.data;
}

export async function deleteIncident(id) {
  await api.delete(`${BASE}/incidents/${id}`);
}
