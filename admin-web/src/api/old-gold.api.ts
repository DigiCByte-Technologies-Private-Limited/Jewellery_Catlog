import { httpClient } from './httpClient';

export const oldGoldApi = {
  assess: (data: any) => httpClient.post('/old-gold/assess', data),
  createTransaction: (data: any) => httpClient.post('/old-gold/transactions', data),
  getTransactions: (params?: any) => httpClient.get('/old-gold/transactions', { params }),
};
