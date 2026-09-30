import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        useAuthStore.getState().updateToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
