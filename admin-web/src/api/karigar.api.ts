import { httpClient } from './httpClient';

export const karigarApi = {
  getArtisans: () => httpClient.get('/karigar/artisans'),
  createArtisan: (data: any) => httpClient.post('/karigar/artisans', data),
  getOrders: (params?: any) => httpClient.get('/karigar/orders', { params }),
  issueOrder: (data: any) => httpClient.post('/karigar/orders/issue', data),
  receiveOrder: (id: string, data: any) => httpClient.post(`/karigar/orders/${id}/receive`, data),
};
