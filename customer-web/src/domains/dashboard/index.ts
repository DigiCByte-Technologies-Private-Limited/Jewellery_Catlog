import { httpClient } from '../../api/httpClient';

export const customerApi = {
  getProfile: async () => {
    const { data } = await httpClient.get('/customer/profile');
    return data;
  },
};
