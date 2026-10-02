import { httpClient } from './httpClient';
import type { StoreItem } from './stores.api';

export interface RequestHistoryItem {
  id: string;
  requestId: string;
  action: string;
  actorRole: string;
  actorName: string;
  actorId?: string;
  note?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  createdAt: string;
}

export interface ProductRequestItem {
  id: string;
  requestId: string;
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  productId?: string;
  productName: string;
  message: string;
  quantity?: string;
  technicalRequirement?: string;
  preferredContactMethod?: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  status: 'NEW' | 'ASSIGNED' | 'FOLLOW_UP' | 'COMPLETED' | 'CANCELLED';
  purchaseStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  purchaseReason?: string;
  purchaseNotes?: string;
  purchaseConfirmedAt?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  adminNotes?: string;
  assignedStoreId?: string;
  assignedStore?: StoreItem;
  assignedToUserId?: string;
  assignedAt?: string;
  followUpAt?: string;
  history?: RequestHistoryItem[];
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    category?: { id: string; name: string };
    media?: { id: string; url?: string; originalUrl?: string; thumbnailUrl?: string; isPrimary: boolean }[];
  };
}

export interface PipelineStats {
  total: number;
  new: number;
  assigned: number;
  followUp: number;
  completed: number;
  pendingPurchases: number;
  approvedPurchases: number;
  rejectedPurchases: number;
  conversionRate: number;
  inReview?: number;
  contacted?: number;
  quoted?: number;
  closed?: number;
}

export interface QueryRequestsParams {
  search?: string;
  status?: string;
  purchaseStatus?: string;
  priority?: string;
  storeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AssignStorePayload {
  storeId: string;
  note?: string;
}

export interface StoreFollowUpPayload {
  note: string;
  nextFollowUpDate?: string;
  customerResponse?: string;
}

export interface StorePurchaseOutcomePayload {
  purchaseStatus: 'APPROVED' | 'REJECTED' | 'PENDING';
  purchaseReason?: string;
  purchaseNotes?: string;
  nextFollowUpDate?: string;
  confirmedQuantity?: number;
}

export const requestsApi = {
  getAll: (params?: QueryRequestsParams) =>
    httpClient.get<{
      success: boolean;
      data: ProductRequestItem[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/requests', { params }),

  getStats: (storeId?: string) =>
    httpClient.get<{ success: boolean; data: PipelineStats }>('/requests/pipeline-stats', {
      params: storeId ? { storeId } : undefined,
    }),

  getPipelineStats: (storeId?: string) =>
    httpClient.get<{ success: boolean; data: PipelineStats }>('/requests/pipeline-stats', {
      params: storeId ? { storeId } : undefined,
    }),

  getById: (id: string) =>
    httpClient.get<{ success: boolean; data: ProductRequestItem }>(`/requests/${id}`),

  getNearbyStores: (id: string) =>
    httpClient.get<{ success: boolean; data: StoreItem[] }>(`/requests/${id}/nearby-stores`),

  assignStore: (id: string, payload: AssignStorePayload) =>
    httpClient.patch<{ success: boolean; message: string; data: ProductRequestItem }>(
      `/requests/${id}/assign-store`,
      payload
    ),

  recordFollowUp: (id: string, payload: StoreFollowUpPayload) =>
    httpClient.patch<{ success: boolean; message: string; data: ProductRequestItem }>(
      `/requests/${id}/follow-up`,
      payload
    ),

  recordPurchaseOutcome: (id: string, payload: StorePurchaseOutcomePayload) =>
    httpClient.patch<{ success: boolean; message: string; data: ProductRequestItem }>(
      `/requests/${id}/purchase-outcome`,
      payload
    ),

  update: (
    id: string,
    data: Partial<{
      status: string;
      purchaseStatus: string;
      priority: string;
      adminNotes: string;
      assignedToUserId: string;
      followUpAt: string;
    }>
  ) =>
    httpClient.patch<{ success: boolean; message: string; data: ProductRequestItem }>(
      `/requests/${id}`,
      data
    ),

  getWholesalePartners: () =>
    httpClient.get<{ success: boolean; data: WholesalePartnerItem[] }>('/wholesale/auth/partners'),

  assignPartner: (id: string, partnerUserId: string, adminNotes?: string) =>
    httpClient.patch<{ success: boolean; message: string; data: ProductRequestItem }>(
      `/requests/${id}`,
      {
        assignedToUserId: partnerUserId,
        status: 'ASSIGNED',
        adminNotes: adminNotes || undefined,
      }
    ),

  remove: (id: string) =>
    httpClient.delete<{ success: boolean; message: string }>(`/requests/${id}`),
};

export interface WholesalePartnerItem {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  city?: string;
  state?: string;
  businessType?: string;
  isVerified: boolean;
  gstNumber?: string;
}
