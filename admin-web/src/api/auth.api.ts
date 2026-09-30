import { httpClient } from './httpClient';

export const authApi = {
  login: (email: string, password: string) =>
    httpClient.post('/auth/login', { email, password }),
  logout: () => httpClient.post('/auth/logout'),
  getProfile: () => httpClient.get('/auth/profile'),
  refreshToken: () => httpClient.post('/auth/refresh'),
  changePassword: (currentPassword: string, newPassword: string) =>
    httpClient.post('/auth/change-password', { currentPassword, newPassword }),
};
