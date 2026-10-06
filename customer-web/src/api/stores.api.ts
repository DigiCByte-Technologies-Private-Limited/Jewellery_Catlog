import { httpClient } from './httpClient';

export interface StoreItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  isActive?: boolean;
}

export const storesApi = {
  getAll: () =>
    httpClient.get<{ success: boolean; data: StoreItem[] }>('/stores'),
  getById: (id: string) =>
    httpClient.get<{ success: boolean; data: StoreItem }>(`/stores/${id}`),
};
