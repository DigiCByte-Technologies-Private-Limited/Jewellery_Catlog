import { httpClient } from './httpClient';

export const usersApi = {
  getAll: (params?: any) => httpClient.get('/users', { params }),
  getOne: (id: string) => httpClient.get(`/users/${id}`),
  create: (data: any) => httpClient.post('/users', data),
  update: (id: string, data: any) => httpClient.patch(`/users/${id}`, data),
  delete: (id: string) => httpClient.delete(`/users/${id}`),
  toggleStatus: (id: string) => httpClient.patch(`/users/${id}/toggle-status`),
};
