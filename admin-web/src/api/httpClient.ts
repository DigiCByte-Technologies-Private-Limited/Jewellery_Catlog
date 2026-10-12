import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../app/queryClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Filter out empty string query parameters to prevent 400 Bad Request on backend enum/optional validators
  if (config.params && typeof config.params === 'object' && !(config.params instanceof URLSearchParams)) {
    const cleanParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleanParams[key] = value;
      }
    }
    config.params = cleanParams;
  }

  return config;
});

const ALLOWED_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'STORE_MANAGER',
  'SALES_STAFF',
  'CATALOG_MANAGER',
  'INVENTORY_MANAGER',
  'AUDITOR',
  'MARKETING',
];

httpClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    // If 403 Forbidden is returned due to role mismatch, invalidate stale session and redirect to login
    if (error.response?.status === 403) {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser || !ALLOWED_ADMIN_ROLES.includes(currentUser.role)) {
        useAuthStore.getState().logout();
        queryClient.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken, user } = res.data?.data || {};

        if (!accessToken) {
          throw new Error('No access token in refresh response');
        }

        // Validate that refreshed user has admin permissions
        if (user && !ALLOWED_ADMIN_ROLES.includes(user.role)) {
          useAuthStore.getState().logout();
          queryClient.clear();
          window.location.href = '/login';
          return Promise.reject(new Error('Refreshed session is not an authorized administrator'));
        }

        if (user) {
          useAuthStore.getState().setAuth(user, accessToken);
        } else {
          useAuthStore.getState().updateToken(accessToken);
        }

        original.headers.Authorization = `Bearer ${accessToken}`;
        return httpClient(original);
      } catch {
        useAuthStore.getState().logout();
        queryClient.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
