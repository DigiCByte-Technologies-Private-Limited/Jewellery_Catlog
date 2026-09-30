import { httpClient } from './httpClient';

export const metalRatesApi = {
  getLatest: () => httpClient.get('/metal-rates/latest'),
  getAll: (params?: any) => httpClient.get('/metal-rates', { params }),
  getHistory: (params?: any) => httpClient.get('/metal-rates/history', { params }),
  create: (data: any) => httpClient.post('/metal-rates', data),
  approve: (id: string) => httpClient.post(`/metal-rates/${id}/approve`),
  reject: (id: string, reason: string) => httpClient.post(`/metal-rates/${id}/reject`, { reason }),
  calculateDerived: (base24KRate: number) =>
    httpClient.post('/metal-rates/calculate-derived', { base24KRate }),
};
