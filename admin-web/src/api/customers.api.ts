import { httpClient } from './httpClient';

export const customersApi = {
  getAll: (params?: any) => httpClient.get('/customers', { params }),
  getOne: (id: string) => httpClient.get(`/customers/${id}`),
  create: (data: any) => httpClient.post('/customers', data),
  update: (id: string, data: any) => httpClient.patch(`/customers/${id}`, data),
  getOccasions: () => httpClient.get('/customers/occasions'),
};
