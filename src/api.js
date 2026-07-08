// Marka la deploy-gareynayo (Vercel, iwm), ku dar environment variable
// VITE_API_URL oo ku dhigan URL-ka backend-kaaga oo public ah.
// Local development-ka, wuxuu isticmaalayaa https://localhost:7204/api si caadi ah.
// const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7204/api";
const API_URL = "https://vehiclesystem-7hjh.onrender.com/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (user) =>
    request("/User/Register", { method: "POST", body: JSON.stringify(user) }),

  login: (user) =>
    request("/User/Login", { method: "POST", body: JSON.stringify(user) }),

  getVehicleData: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/VehicleData/Get?${qs}`);
  },

  addVehicleData: (data) =>
    request("/VehicleData/Add", { method: "POST", body: JSON.stringify(data) }),

  updateVehicleData: (data) =>
    request("/VehicleData/Update", { method: "PUT", body: JSON.stringify(data) }),

  deleteVehicleData: (id) =>
    request(`/VehicleData/Delete/${id}`, { method: "DELETE" }),

  searchVehicleData: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/VehicleData/Search?${qs}`);
  },

  getMonthlyReport: (year, month) =>
    request(`/VehicleData/MonthlyReport?year=${year}&month=${month}`),

  getAllVehicleMonthlyTotals: () =>
    request(`/VehicleData/AllMonthlyTotals`),

  getAllTechnicalMonthlyTotals: () =>
    request(`/TechnicalIncome/AllMonthlyTotals`),

  getTechnicalIncome: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/TechnicalIncome/Get?${qs}`);
  },

  addTechnicalIncome: (data) =>
    request("/TechnicalIncome/Add", { method: "POST", body: JSON.stringify(data) }),

  updateTechnicalIncome: (data) =>
    request("/TechnicalIncome/Update", { method: "PUT", body: JSON.stringify(data) }),

  deleteTechnicalIncome: (id) =>
    request(`/TechnicalIncome/Delete/${id}`, { method: "DELETE" }),
};
