import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ─────────────────────────────────────
export const register = (email, password, name) =>
  api.post("/auth/register", { email, password, name });

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const getMe = () => api.get("/auth/me");

// ─── Assessments ──────────────────────────────
export const predict = (answers) => api.post("/predict", answers);

export const createAssessment = (answers) =>
  api.post("/assessments", { answers });

export const listAssessments = () => api.get("/assessments");

// ─── Admin ────────────────────────────────────
export const adminStats = () => api.get("/admin/stats");

export const adminUsers = () => api.get("/admin/users");

export const adminAssessments = () => api.get("/admin/assessments");

// ─── Token helpers ────────────────────────────
export const saveToken = (token) => AsyncStorage.setItem("token", token);

export const getToken = () => AsyncStorage.getItem("token");

export const removeToken = () => AsyncStorage.removeItem("token");

export const saveUser = (user) =>
  AsyncStorage.setItem("user", JSON.stringify(user));

export const getUser = async () => {
  const u = await AsyncStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

export const removeUser = () => AsyncStorage.removeItem("user");

export default api;
