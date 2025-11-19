// src/services/payments.js
import { api } from "./api";

export const paymentsApi = {
  create: (amount) => api.post("/api/payments/create", { amount })
};