import { httpClient } from './httpClient';

export const subscriptionsApi = {
  getCurrent: () => httpClient.get('/subscriptions/current'),
  getPlans: () => httpClient.get('/subscriptions/plans'),
  upgrade: (data: any) => httpClient.post('/subscriptions/upgrade', data),
  updateFeatures: (data: any) => httpClient.patch('/subscriptions/features', data),
  getInvoices: () => httpClient.get('/subscriptions/invoices'),
  getB2BPlans: () => httpClient.get('/subscriptions/b2b-plans'),
  getB2BSubscribers: () => httpClient.get('/subscriptions/b2b-subscribers'),
  subscribeB2BPartner: (data: any) => httpClient.post('/subscriptions/b2b-subscribe', data),
};
