import { httpClient } from '../../api/httpClient';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await httpClient.post('/auth/login', credentials);
    return data;
  },
  register: async (payload: { email: string; password: string; fullName?: string }) => {
    const { data } = await httpClient.post('/auth/register', payload);
    return data;
  },
};
