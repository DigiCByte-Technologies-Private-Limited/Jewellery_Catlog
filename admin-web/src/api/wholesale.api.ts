import { httpClient } from './httpClient';

export type WholesaleSubmissionStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'IMAGE_ACCEPTED'
  | 'IMAGE_REJECTED'
  | 'COMPLETED';

export interface SubmittedImageItem {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
}

export interface WholesaleImageMetadata {
  title?: string;
  description?: string;
  sourceReference?: string;
  notes?: string;
}

export interface WholesaleProductSpecifications {
  material?: string;
  dimensions?: string;
  colorVariant?: string;
  quantity?: string;
  brandManufacturer?: string;
  additionalDetails?: string;
}

export interface WholesaleSubmissionHistoryItem {
  id: string;
  submissionId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  action: string;
  fromStatus?: WholesaleSubmissionStatus;
  toStatus?: WholesaleSubmissionStatus;
  notes?: string;
  createdAt: string;
}

export interface WholesaleProductSubmissionItem {
  id: string;
  submissionId: string;
  wholesaleUserId: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  productCategory: string | null;
  productSubcategory: string | null;
  productDescription: string | null;
  productSpecifications: WholesaleProductSpecifications | null;
  images: SubmittedImageItem[];
  imageMetadata: WholesaleImageMetadata | null;
  additionalNotes: string | null;
  status: WholesaleSubmissionStatus;
  rejectionReason: string | null;
  adminNotes: string | null;
  isPublishedToCatalog: boolean;
  publishedMediaId: string | null;
  publishedAt: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  product?: {
    id: string;
    title: string;
    sku: string;
    category?: { id: string; name: string };
    images?: Array<{ id: string; url: string; isPrimary: boolean }>;
  };
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
  };
  history?: WholesaleSubmissionHistoryItem[];
}

export interface WholesaleSubmissionsStats {
  total: number;
  pendingReview: number;
  underReview: number;
  imageAccepted: number;
  imageRejected: number;
  completed: number;
}

export interface MediaConflictCheckResult {
  hasExistingMedia: boolean;
  product: {
    id: string;
    title: string;
    sku: string;
  };
  existingMediaCount: number;
  currentPrimaryMedia: {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  } | null;
  allMedia: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

export const wholesaleApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: WholesaleSubmissionStatus;
    productId?: string;
  }) =>
    httpClient.get<{
      success: boolean;
      data: WholesaleProductSubmissionItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/wholesale-submissions', { params }),

  getStats: () =>
    httpClient.get<{ success: boolean; data: WholesaleSubmissionsStats }>(
      '/wholesale-submissions/stats'
    ),

  getById: (id: string) =>
    httpClient.get<{ success: boolean; data: WholesaleProductSubmissionItem }>(
      `/wholesale-submissions/${id}`
    ),

  updateStatus: (
    id: string,
    payload: {
      status: WholesaleSubmissionStatus;
      rejectionReason?: string;
      adminNotes?: string;
    }
  ) =>
    httpClient.patch<{
      success: boolean;
      data: WholesaleProductSubmissionItem;
      message: string;
    }>(`/wholesale-submissions/${id}/status`, payload),

  checkMediaConflict: (id: string) =>
    httpClient.get<{
      success: boolean;
      data: MediaConflictCheckResult;
    }>(`/wholesale-submissions/${id}/media-conflict`),

  publishToCatalog: (
    id: string,
    payload: {
      imageIndex?: number;
      replacePrimary?: boolean;
      isPrimary?: boolean;
      displayOrder?: number;
      altText?: string;
    }
  ) =>
    httpClient.post<{
      success: boolean;
      data: any;
      message: string;
    }>(`/wholesale-submissions/${id}/publish`, payload),

  downloadImage: async (id: string, fileIndex: number = 0, fallbackName = 'proposal-image') => {
    const response = await httpClient.get(
      `/wholesale-submissions/${id}/download-image?fileIndex=${fileIndex}`,
      { responseType: 'blob' }
    );
    
    // Extract filename from header if available
    let filename = `${fallbackName}.jpg`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
};
