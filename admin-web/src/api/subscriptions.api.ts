import { httpClient } from './httpClient';

export const subscriptionsApi = {
  getCurrent: () => httpClient.get('/subscriptions/current'),
  getPlans: () => httpClient.get('/subscriptions/plans'),
  upgrade: (data: any) => httpClient.post('/subscriptions/upgrade', data),
  updateFeatures: (data: any) => httpClient.patch('/subscriptions/features', data),
};
