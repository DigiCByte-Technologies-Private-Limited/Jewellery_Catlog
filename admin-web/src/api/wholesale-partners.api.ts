import { httpClient } from './httpClient';

export type WholesaleApplicationStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type WholesaleDocumentType = 'AADHAAR' | 'PAN' | 'GST' | 'OTHER';
export type WholesaleDocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface WholesaleDocumentItem {
  id: string;
  partnerId: string;
  documentType: WholesaleDocumentType;
  originalFilename: string;
  storageFileName: string;
  mimeType: string;
  sizeBytes: number;
  status: WholesaleDocumentStatus;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface WholesalePartnerHistoryItem {
  id: string;
  partnerId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorRole: string;
  actorName: string;
  note?: string | null;
  createdAt: string;
}

export interface WholesaleApplicationItem {
  id: string;
  userId: string;
  applicationId: string;
  companyName: string;
  ownerName: string;
  phone: string;
  whatsappNumber?: string | null;
  email: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  businessType?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string;
  address?: string | null;
  status: WholesaleApplicationStatus;
  isVerified: boolean;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  resubmittedAt?: string | null;
  documents?: WholesaleDocumentItem[];
  history?: WholesalePartnerHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleApplicationsStats {
  totalAll: number;
  pendingReview: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export interface ListApplicationsResponse {
  success: boolean;
  data: WholesaleApplicationItem[];
  total: number;
  page: number;
  limit: number;
  stats: WholesaleApplicationsStats;
}

export const wholesalePartnersApi = {
  getAll: async (params?: {
    status?: WholesaleApplicationStatus | '';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListApplicationsResponse> => {
    const res = await httpClient.get<ListApplicationsResponse>('/wholesale/admin/applications', {
      params,
    });
    return res.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: WholesaleApplicationItem }> => {
    const res = await httpClient.get<{ success: boolean; data: WholesaleApplicationItem }>(
      `/wholesale/admin/applications/${id}`
    );
    return res.data;
  },

  updateStatus: async (
    id: string,
    payload: {
      status: WholesaleApplicationStatus;
      rejectionReason?: string;
      adminNotes?: string;
    }
  ) => {
    const res = await httpClient.patch(`/wholesale/admin/applications/${id}/status`, payload);
    return res.data;
  },

  updateDocumentStatus: async (
    docId: string,
    payload: {
      status: WholesaleDocumentStatus;
      rejectionReason?: string;
    }
  ) => {
    const res = await httpClient.patch(`/wholesale/admin/documents/${docId}/status`, payload);
    return res.data;
  },

  addNote: async (id: string, payload: { note: string }) => {
    const res = await httpClient.post(`/wholesale/admin/applications/${id}/notes`, payload);
    return res.data;
  },

  downloadDocument: async (docId: string, originalName: string) => {
    const res = await httpClient.get(`/wholesale/documents/${docId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalName || 'document');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  getPreviewUrl: (docId: string) => {
    return `/api/v1/wholesale/documents/${docId}/preview`;
  },
};
