import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Filter out empty string query parameters to prevent 400 Bad Request on backend validators
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

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  },
);
