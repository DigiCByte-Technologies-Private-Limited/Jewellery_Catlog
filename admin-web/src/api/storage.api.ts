import { httpClient } from './httpClient';

export const storageApi = {
  getMetrics: (quotaGb?: number) => httpClient.get('/storage/metrics', { params: { quotaGb } }),
  getFiles: (params?: any) => httpClient.get('/storage/files', { params }),
  uploadFile: (data: any) => httpClient.post('/storage/upload', data),
  deleteFile: (id: string) => httpClient.delete(`/storage/files/${id}`),
};
