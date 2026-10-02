import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1/wholesale';

const api = axios.create({ baseURL: BASE_URL });

/* ──────────────────────────────────────────
   TYPES
────────────────────────────────────────── */
export interface SubmissionStatus {
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'IMAGE_ACCEPTED' | 'IMAGE_REJECTED' | 'COMPLETED';
}

export interface WholesaleSubmission {
  id: string;
  submissionId: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  productName: string;
  productCategory: string;
  productDescription?: string;
  wholesaleQuantity?: number;
  additionalNotes?: string;
  status: SubmissionStatus['status'];
  rejectionReason?: string;
  adminNotes?: string;
  images: Array<{ fileId: string; filename: string; originalName: string; size: number; mimeType: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionHistory {
  id: string;
  actorRole: string;
  actorName: string;
  action: string;
  note?: string;
  createdAt: string;
}

/* ──────────────────────────────────────────
   UPLOAD IMAGE
────────────────────────────────────────── */
export interface UploadedFileResult {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export const uploadImages = async (files: File[]): Promise<{ data: UploadedFileResult[] }> => {
  const formData = new FormData();
  // Backend uses 'files' field name
  files.forEach((f) => formData.append('files', f));
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export interface SubmittedImageItem {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface CreateSubmissionDto {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  productName: string;
  productCategory?: string;
  productSubcategory?: string;
  brandOrManufacturer?: string;
  productDescription?: string;
  wholesaleQuantity?: string;
  additionalNotes?: string;
  colorOrVariant?: string;
  images: SubmittedImageItem[];
}

export const createSubmission = async (dto: CreateSubmissionDto): Promise<WholesaleSubmission> => {
  const res = await api.post('/submissions', dto);
  return res.data;
};

/* ──────────────────────────────────────────
   GET MY SUBMISSIONS (by email)
────────────────────────────────────────── */
export const getMySubmissions = async (
  email: string,
  page = 1,
  limit = 10
): Promise<{ data: WholesaleSubmission[]; total: number; page: number; limit: number }> => {
  const res = await api.get('/submissions/my', { params: { email, page, limit } });
  return res.data;
};

/* ──────────────────────────────────────────
   GET SINGLE SUBMISSION
────────────────────────────────────────── */
export const getSubmissionById = async (
  id: string,
  emailOrPhone: string
): Promise<WholesaleSubmission & { history: SubmissionHistory[] }> => {
  const res = await api.get(`/submissions/my/${id}`, { params: { phoneOrEmail: emailOrPhone } });
  return res.data;
};

/* ──────────────────────────────────────────
   STATUS LABEL HELPERS
────────────────────────────────────────── */
export const STATUS_LABELS: Record<SubmissionStatus['status'], string> = {
  PENDING_REVIEW: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  IMAGE_ACCEPTED: 'Image Accepted',
  IMAGE_REJECTED: 'Image Rejected',
  COMPLETED: 'Completed',
};

export const STATUS_COLORS: Record<SubmissionStatus['status'], string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  IMAGE_ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  IMAGE_REJECTED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-amber-100 text-amber-800 border-amber-200',
};
