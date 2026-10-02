import { httpClient } from './httpClient';

export interface ProductPriceBreakdown {
  metalType: string;
  purity: string;
  netWeightGrams: number;
  metalRatePerGram: number;
  metalValue: number;
  makingCharges: number;
  stoneCharges: number;
  serviceCharges: number;
  discount: number;
  subtotal: number;
  taxGst: number;
  finalSellingPrice: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category?: { id: string; name: string };
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  purity: string;
  metalColor?: string;
  grossWeight: number;
  netMetalWeight: number;
  currentPrice?: number;
  pricingMode: 'DYNAMIC_MARKET' | 'FIXED';
  fixedPrice?: number;
  priceBreakdown?: ProductPriceBreakdown;
  media?: Array<{ url: string; isPrimary: boolean; thumbnailUrl?: string }>;
  description?: string;
  hallmarkNumber?: string;
  status: string;
}

export interface MetalRateItem {
  id: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  purity: string;
  ratePerGram: number;
  effectiveDate: string;
  isActive: boolean;
}

export const productsApi = {
  getAll: (params?: any) =>
    httpClient.get<{ success: boolean; data: CatalogProduct[]; total: number; meta?: any }>('/products', {
      params,
    }),

  getOne: (id: string) =>
    httpClient.get<{ success: boolean; data: CatalogProduct }>(`/products/${id}`),

  getMetalRates: () =>
    httpClient.get<{ success: boolean; data: MetalRateItem[] }>('/metal-rates/latest'),

  getPriceBreakdown: (id: string) =>
    httpClient.get<{ success: boolean; data: ProductPriceBreakdown }>(`/products/${id}/price-breakdown`),

  validateCart: (items: Array<{ productId: string; requestedPrice?: number; quantity: number }>) =>
    httpClient.post<{
      isValid: boolean;
      priceChanged: boolean;
      notice?: string;
      items: Array<{
        productId: string;
        requestedPrice: number;
        currentPrice: number;
        priceDifference: number;
        lineTotal: number;
        breakdown: any;
      }>;
      totalPayable: number;
    }>('/pricing/validate-cart', { items }),

  createOrderSnapshot: (data: {
    productId: string;
    productName: string;
    quantity: number;
    appliedMetalRatePerGram: number;
    customerNotes?: string;
  }) => httpClient.post('/pricing/order-snapshot', data),
};
