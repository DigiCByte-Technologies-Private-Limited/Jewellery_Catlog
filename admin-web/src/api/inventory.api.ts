import { httpClient } from './httpClient';

export const inventoryApi = {
  getLocations: () => httpClient.get('/inventory/locations'),
  createLocation: (data: any) => httpClient.post('/inventory/locations', data),
  getItemTags: (params?: any) => httpClient.get('/inventory/tags', { params }),
  createItemTag: (data: any) => httpClient.post('/inventory/tags', data),
  transferStock: (data: { itemTagId: string; toLocationId: string; reason?: string }) =>
    httpClient.post('/inventory/transfer', data),
  issueMemo: (data: { itemTagId: string; memoHolderName: string; notes?: string }) =>
    httpClient.post('/inventory/memo/issue', data),
  returnMemo: (data: { itemTagId: string; returnLocationId?: string }) =>
    httpClient.post('/inventory/memo/return', data),
  getSummary: () => httpClient.get('/inventory/summary'),
};
