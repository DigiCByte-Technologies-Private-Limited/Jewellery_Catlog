import { httpClient } from './httpClient';

export interface CreateInquiryPayload {
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  productId?: string;
  productName: string;
  message: string;
  quantity?: string;
  preferredContactMethod?: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  technicalRequirement?: string;
}

export interface TrackRequestResult {
  requestId: string;
  productName: string;
  productImage: string | null;
  quantity: string | null;
  assignedStoreName: string;
  assignedStoreCity: string | null;
  assignedStorePhone: string | null;
  operationalStatus: string;
  purchaseStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusMessage: string;
  createdAt: string;
}

export const requestsApi = {
  createInquiry: (data: CreateInquiryPayload) =>
    httpClient.post<{ success: boolean; message: string; data: any }>('/requests', data),

  trackRequest: (requestId: string, phone: string) =>
    httpClient.get<{ success: boolean; data: TrackRequestResult }>(
      `/requests/track/${encodeURIComponent(requestId)}`,
      { params: { phone } }
    ),
};
