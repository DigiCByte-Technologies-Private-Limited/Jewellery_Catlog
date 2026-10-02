import { httpClient } from './httpClient';

export interface AttachmentFileItem {
  id: string;
  originalName: string;
  filename?: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface CreateCustomDesignPayload {
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  productName: string;
  productId?: string;
  designDescription: string;
  designRequirements?: string;
  quantity?: string;
  materialRequirements?: string;
  dimensions?: string;
  additionalNotes?: string;
  preferredContactMethod?: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  attachments?: AttachmentFileItem[];
}

export interface TrackCustomDesignResult {
  requestId: string;
  customerName: string;
  productName: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  preferredContactMethod: string;
  attachmentCount: number;
}

export const customDesignsApi = {
  uploadFiles: (formData: FormData) =>
    httpClient.post<{ success: boolean; message: string; data: AttachmentFileItem[] }>(
      '/custom-designs/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ),

  create: (data: CreateCustomDesignPayload) =>
    httpClient.post<{ success: boolean; message: string; data: any }>(
      '/custom-designs',
      data
    ),

  track: (requestId: string, phoneOrEmail?: string) =>
    httpClient.get<{ success: boolean; data: TrackCustomDesignResult }>(
      `/custom-designs/track/${encodeURIComponent(requestId)}`,
      { params: { phoneOrEmail } }
    ),
};
