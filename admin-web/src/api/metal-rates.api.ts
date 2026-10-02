import { httpClient } from './httpClient';

export interface MetalRateItem {
  id: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  purity: string;
  ratePerGram: number | string;
  previousRatePerGram?: number | string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  effectiveFrom?: string;
  notes?: string | null;
  productsCount?: number;
  createdById?: string | null;
  approvedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactPreviewData {
  metalType: string;
  purity: string;
  currentRatePerGram: number;
  newRatePerGram: number;
  rateDifference: number;
  ratePercentageChange: number;
  affectedProductsCount: number;
  totalCurrentValue: number;
  totalNewValue: number;
  totalValueChange: number;
  sampleProducts: Array<{
    id: string;
    name: string;
    sku: string;
    grossWeight: number;
    netMetalWeight: number;
    oldPrice: number;
    newPrice: number;
    difference: number;
  }>;
}

export const metalRatesApi = {
  getLatest: () => httpClient.get<{ success: boolean; data: MetalRateItem[] }>('/metal-rates/latest'),
  getAll: (params?: any) => httpClient.get<{ success: boolean; data: MetalRateItem[] }>('/metal-rates', { params }),
  getHistory: (params?: any) => httpClient.get('/metal-rates/history', { params }),
  getImpactPreview: (metalType: string, purity: string, newRatePerGram: number) =>
    httpClient.get<{ success: boolean; data: ImpactPreviewData }>('/metal-rates/impact-preview', {
      params: { metalType, purity, newRatePerGram },
    }),
  create: (data: {
    metalType: string;
    purity: string;
    ratePerGram: number;
    notes?: string;
    effectiveFrom?: string;
  }) => httpClient.post('/metal-rates', data),
  update: (
    id: string,
    data: {
      ratePerGram: number;
      notes?: string;
      effectiveFrom?: string;
    },
  ) => httpClient.put(`/metal-rates/${id}`, data),
  approve: (id: string) => httpClient.post(`/metal-rates/${id}/approve`),
  reject: (id: string, reason: string) => httpClient.post(`/metal-rates/${id}/reject`, { reason }),
  calculateDerived: (base24KRatePerGram: number) =>
    httpClient.post('/metal-rates/calculate-derived', { base24KRatePerGram }),
};
