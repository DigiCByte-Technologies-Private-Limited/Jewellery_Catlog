import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1/wholesale/auth';

export interface WholesaleDocumentItem {
  id: string;
  documentType: 'AADHAAR' | 'PAN' | 'GST' | 'OTHER';
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface WholesalePartnerProfile {
  id: string;
  userId: string;
  applicationId?: string;
  companyName: string;
  ownerName?: string;
  phone?: string;
  whatsappNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  panNumberMasked?: string;
  aadhaarNumber?: string;
  aadhaarNumberMasked?: string;
  businessType?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  address?: string;
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  rejectionReason?: string | null;
  documents?: WholesaleDocumentItem[];
  createdAt: string;
  verifiedAt?: string;
  resubmittedAt?: string;
}

export interface WholesaleUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  partner?: WholesalePartnerProfile;
}

export interface GatedStatusInfo {
  code: string;
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'REJECTED';
  applicationId?: string;
  rejectionReason?: string | null;
  message: string;
}

interface AuthState {
  user: WholesaleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  gatedStatus: GatedStatusInfo | null;
  login: (email: string, password: string) => Promise<void>;
  registerApplication: (formData: FormData) => Promise<any>;
  resubmitApplication: (formData: FormData) => Promise<any>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<WholesalePartnerProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setToken: (token: string) => void;
  clearGatedStatus: () => void;
}

const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      gatedStatus: null,

      clearGatedStatus: () => set({ gatedStatus: null }),

      setToken: (token: string) => {
        set({ accessToken: token });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      login: async (email, password) => {
        set({ isLoading: true, gatedStatus: null });
        try {
          const res = await api.post('/login', { email, password });
          const { accessToken, user, partner } = res.data.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          set({
            user: { ...user, partner },
            accessToken,
            isAuthenticated: true,
            gatedStatus: null,
          });
          await get().fetchProfile();
        } catch (err: any) {
          if (err.response?.status === 403 && err.response?.data?.code === 'WHOLESALE_APPLICATION_NOT_APPROVED') {
            set({ gatedStatus: err.response.data });
          }
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      registerApplication: async (formData: FormData) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/register-application', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return res.data;
        } finally {
          set({ isLoading: false });
        }
      },

      resubmitApplication: async (formData: FormData) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/resubmit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          set({ gatedStatus: null });
          return res.data;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const token = get().accessToken;
          if (token) {
            await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
          }
        } catch { /* ignore */ }
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, accessToken: null, isAuthenticated: false, gatedStatus: null });
      },

      fetchProfile: async () => {
        const token = get().accessToken;
        if (!token) return;
        try {
          const res = await api.get('/me', { headers: { Authorization: `Bearer ${token}` } });
          const { user, partner } = res.data.data;
          set({ user: { ...user, partner }, isAuthenticated: true });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const token = get().accessToken;
        const res = await api.patch('/profile', data, { headers: { Authorization: `Bearer ${token}` } });
        set((state) => ({
          user: state.user ? { ...state.user, partner: res.data.data.partner } : state.user,
        }));
      },

      changePassword: async (currentPassword, newPassword) => {
        const token = get().accessToken;
        await api.post('/change-password', { currentPassword, newPassword }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
    }),
    {
      name: 'wholesale-auth',
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// Axios request interceptor — auto-attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Axios response interceptor — handle 401 (token expired)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const refreshRes = await axios.post('http://localhost:3001/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = refreshRes.data.data.accessToken;
        useAuthStore.getState().setToken(newToken);
        err.config.headers['Authorization'] = `Bearer ${newToken}`;
        return api(err.config);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);

export { api as wholesaleAuthApi };
