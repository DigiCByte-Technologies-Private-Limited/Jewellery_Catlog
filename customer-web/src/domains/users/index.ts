import { httpClient } from '../../api/httpClient';

export const usersApi = {
  getProfile: async () => {
    const { data } = await httpClient.get('/users/me');
    return data;
  },
};
