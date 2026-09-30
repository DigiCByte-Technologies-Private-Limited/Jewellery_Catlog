import { httpClient } from './httpClient';

export const enquiriesApi = {
  getAll: (params?: any) => httpClient.get('/enquiries', { params }),
  create: (data: any) => httpClient.post('/enquiries', data),
  updateStage: (id: string, stage: string) => httpClient.patch(`/enquiries/${id}/stage`, { stage }),
  update: (id: string, data: any) => httpClient.patch(`/enquiries/${id}`, data),
};
