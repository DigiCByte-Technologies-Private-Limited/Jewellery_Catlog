import { httpClient } from '../../api/httpClient';

export const dashboardApi = {
  getStats: async () => {
    const { data } = await httpClient.get('/admin/dashboard');
    return data;
  },
};
