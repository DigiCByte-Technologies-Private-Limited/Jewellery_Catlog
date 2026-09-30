import { httpClient } from './httpClient';

export interface StoreItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  distanceKm?: number;
  distanceLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const storesApi = {
  getAll: (all?: boolean) =>
    httpClient.get<{ success: boolean; data: StoreItem[] }>('/stores', {
      params: all ? { all: 'true' } : undefined,
    }),

  getNearby: (params: { lat?: number; lng?: number; city?: string; state?: string }) =>
    httpClient.get<{ success: boolean; data: StoreItem[] }>('/stores/nearby', { params }),

  getById: (id: string) =>
    httpClient.get<{ success: boolean; data: StoreItem }>(`/stores/${id}`),

  create: (data: Partial<StoreItem>) =>
    httpClient.post<{ success: boolean; message: string; data: StoreItem }>('/stores', data),

  update: (id: string, data: Partial<StoreItem>) =>
    httpClient.patch<{ success: boolean; message: string; data: StoreItem }>(`/stores/${id}`, data),

  remove: (id: string) =>
    httpClient.delete<{ success: boolean; message: string }>(`/stores/${id}`),
};
