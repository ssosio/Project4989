import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // 로그인 시 저장한 JWT
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
