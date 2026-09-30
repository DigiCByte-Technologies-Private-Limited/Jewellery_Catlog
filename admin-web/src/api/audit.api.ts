import { httpClient } from './httpClient';

export const auditApi = {
  getAll: (params?: any) => httpClient.get('/audit-logs', { params }),
};
