import { httpClient } from './httpClient';

export const approvalsApi = {
  getAll: (params?: any) => httpClient.get('/approvals', { params }),
  approve: (id: string) => httpClient.post(`/approvals/${id}/approve`),
  reject: (id: string, comments: string) =>
    httpClient.post(`/approvals/${id}/reject`, { comments }),
};
