import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("address");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  students: {
    list: () => api.get("/students"),
    detail: (studentId) => api.get(`/students/${studentId}`),
    create: (payload) => api.post("/students", payload),
    update: (studentId, payload) => api.put(`/students/${studentId}`, payload),
    deactivate: (studentId, payload) => api.put(`/students/${studentId}/deactivate`, payload)
  },
  blockchain: {
    events: () => api.get("/blockchain/events"),
    tx: (hash) => api.get(`/blockchain/tx/${hash}`),
    history: () => api.get("/blockchain/history"),
    balance: () => api.get("/blockchain/balance")
  }
};

export default api;
