import { api } from "./api";

export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id) => api.get(`/projects/${id}`),
  create: (p) => api.post("/projects", p),
  update: (id, p) => api.put(`/projects/${id}`, p),
  remove: (id) => api.del(`/projects/${id}`),
};
