import { httpClient } from './httpClient';

export interface CustomDesignAttachmentItem {
  id: string;
  originalName: string;
  filename?: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface CustomDesignHistoryItem {
  id: string;
  requestId: string;
  actorRole: string;
  actorName: string;
  action: string;
  note: string;
  createdAt: string;
}

export interface CustomDesignRequestItem {
  id: string;
  requestId: string;
  customerId: string | null;
  customerName: string;
  companyName: string | null;
  email: string;
  phone: string;
  productName: string;
  productId: string | null;
  designDescription: string;
  designRequirements: string | null;
  quantity: string | null;
  materialRequirements: string | null;
  dimensions: string | null;
  additionalNotes: string | null;
  attachments: CustomDesignAttachmentItem[];
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  status:
    | 'NEW'
    | 'UNDER_REVIEW'
    | 'CONTACTED'
    | 'QUOTATION'
    | 'APPROVED'
    | 'REJECTED'
    | 'COMPLETED';
  adminNotes: string | null;
  notificationStatus: string;
  history?: CustomDesignHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomDesignStats {
  total: number;
  new: number;
  underReview: number;
  contacted: number;
  quotation: number;
  approved: number;
  rejected: number;
  completed: number;
  activePipeline: number;
}

export const customDesignsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) =>
    httpClient.get<{
      success: boolean;
      data: CustomDesignRequestItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/custom-designs', { params }),

  getStats: () =>
    httpClient.get<{ success: boolean; data: CustomDesignStats }>(
      '/custom-designs/stats'
    ),

  getById: (id: string) =>
    httpClient.get<{ success: boolean; data: CustomDesignRequestItem }>(
      `/custom-designs/${id}`
    ),

  updateStatus: (
    id: string,
    payload: {
      status?: string;
      adminNotes?: string;
    }
  ) =>
    httpClient.patch<{
      success: boolean;
      message: string;
      data: CustomDesignRequestItem;
    }>(`/custom-designs/${id}/status`, payload),

  retryNotification: (id: string) =>
    httpClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`/custom-designs/${id}/retry-notification`),
};
