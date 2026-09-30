import { httpClient } from './httpClient';

export const productsApi = {
  getAll: (params?: any) => httpClient.get('/products', { params }),
  getOne: (id: string) => httpClient.get(`/products/${id}`),
  create: (data: any) => httpClient.post('/products', data),
  update: (id: string, data: any) => httpClient.patch(`/products/${id}`, data),
  delete: (id: string) => httpClient.delete(`/products/${id}`),
  duplicate: (id: string) => httpClient.post(`/products/${id}/duplicate`),
  changeStatus: (id: string, status: string) =>
    httpClient.patch(`/products/${id}/status`, { status }),
  getPriceBreakdown: (id: string) => httpClient.get(`/products/${id}/price-breakdown`),
  calculatePrice: (data: any) => httpClient.post('/pricing/calculate', data),
};
