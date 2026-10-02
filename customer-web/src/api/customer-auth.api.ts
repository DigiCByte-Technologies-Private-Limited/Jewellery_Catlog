import { httpClient } from './httpClient';

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'CUSTOMER';
  isActive: boolean;
  storeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  altPhone?: string | null;
  whatsappNumber?: string | null;
  email: string;
  panNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  dateOfBirth?: string | null;
  anniversaryDate?: string | null;
  tags?: string[];
  totalSpend?: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
  password: string;
  confirmPassword: string;
  altPhone?: string;
  whatsappNumber?: string;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface CustomerProfileUpdatePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  altPhone?: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
}

export interface CustomerAuthResponse {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data: {
    accessToken: string;
    user: CustomerUser;
    customer: CustomerProfile;
  };
}

export interface MyRequestItem {
  id: string;
  requestId: string;
  customerId: string;
  productName: string;
  quantity?: string | null;
  message?: string | null;
  operationalStatus: string;
  purchaseStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusMessage?: string | null;
  preferredContactMethod?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    basePrice: string | number;
    sellingPrice?: string | number;
    imageUrl?: string | null;
  } | null;
  assignedStore?: {
    id: string;
    storeName: string;
    city?: string | null;
    phone?: string | null;
  } | null;
}

export interface MyCustomDesignItem {
  id: string;
  requestId: string;
  customerId: string;
  productName: string;
  status: string;
  designDescription: string;
  designRequirements?: string | null;
  quantity?: string | null;
  materialRequirements?: string | null;
  dimensions?: string | null;
  preferredContactMethod?: string;
  attachments?: {
    id: string;
    originalName: string;
    filename?: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const customerAuthApi = {
  register: (payload: CustomerRegisterPayload) =>
    httpClient.post<CustomerAuthResponse>('/auth/customer/register', payload),

  login: (payload: CustomerLoginPayload) =>
    httpClient.post<CustomerAuthResponse>('/auth/customer/login', payload),

  getMe: () =>
    httpClient.get<{ success?: boolean; data: { user: CustomerUser; customer: CustomerProfile } }>(
      '/auth/customer/me',
    ),

  updateProfile: (payload: CustomerProfileUpdatePayload) =>
    httpClient.patch<{
      success?: boolean;
      message: string;
      data: { customer: CustomerProfile; user: CustomerUser };
    }>('/auth/customer/profile', payload),

  forgotPassword: (email: string) =>
    httpClient.post<{ success?: boolean; message: string }>('/auth/customer/forgot-password', {
      email,
    }),

  getMyRequests: () =>
    httpClient.get<{ success?: boolean; data: MyRequestItem[] }>('/requests/my'),

  getMyCustomDesigns: () =>
    httpClient.get<{ success?: boolean; data: MyCustomDesignItem[] }>('/custom-designs/my'),
};
