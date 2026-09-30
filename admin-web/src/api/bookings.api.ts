import { httpClient } from './httpClient';

export const bookingsApi = {
  getAll: (params?: any) => httpClient.get('/bookings', { params }),
  create: (data: any) => httpClient.post('/bookings', data),
  updateStatus: (id: string, status: string) => httpClient.patch(`/bookings/${id}/status`, { status }),
  settle: (id: string, data: any) => httpClient.post(`/bookings/${id}/settle`, data),
};
