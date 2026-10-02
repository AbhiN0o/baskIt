import axios from "axios";

// In production we call the Vercel domain itself ("/api/..."), and vercel.json
// proxies that to the Render backend. That keeps the login cookie first-party,
// which is what makes login work in Safari / iOS / incognito.
// For local dev, .env.development sets VITE_API_URL=http://localhost:3000/api
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
