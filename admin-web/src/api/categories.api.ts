import { httpClient } from './httpClient';

export const categoriesApi = {
  getTree: () => httpClient.get('/categories'),
  getFlat: (params?: any) => httpClient.get('/categories/flat', { params }),
  getOne: (id: string) => httpClient.get(`/categories/${id}`),
  create: (data: any) => httpClient.post('/categories', data),
  update: (id: string, data: any) => httpClient.patch(`/categories/${id}`, data),
  delete: (id: string) => httpClient.delete(`/categories/${id}`),
};
