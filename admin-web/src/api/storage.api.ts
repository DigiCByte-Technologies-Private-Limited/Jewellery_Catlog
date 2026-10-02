import { httpClient } from './httpClient';

export const storageApi = {
  getMetrics: (quotaGb?: number) => httpClient.get('/storage/metrics', { params: { quotaGb } }),
  getFiles: (params?: any) => httpClient.get('/storage/files', { params }),
  getUnifiedFiles: (params?: any) => httpClient.get('/storage/unified-files', { params }),
  getSettings: () => httpClient.get('/storage/settings'),
  updateSettings: (data: any) => httpClient.patch('/storage/settings', data),
  testConnection: (data: any) => httpClient.post('/storage/settings/test-connection', data),
  getOrphanDiagnostics: () => httpClient.get('/storage/diagnostics/orphans'),
  cleanupOrphans: () => httpClient.post('/storage/diagnostics/cleanup-orphans'),
  uploadFile: (data: any) => httpClient.post('/storage/upload', data),
  deleteFile: (id: string) => httpClient.delete(`/storage/files/${id}`),
};
