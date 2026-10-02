import { create } from 'zustand';
import {
  customerAuthApi,
  type CustomerUser,
  type CustomerProfile,
  type CustomerLoginPayload,
  type CustomerRegisterPayload,
} from '../api/customer-auth.api';

export interface CustomerAuthState {
  token: string | null;
  user: CustomerUser | null;
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: CustomerLoginPayload) => Promise<void>;
  register: (payload: CustomerRegisterPayload) => Promise<void>;
  setAuth: (data: { accessToken: string; user: CustomerUser; customer: CustomerProfile }) => void;
  setCustomer: (customer: CustomerProfile) => void;
  setUser: (user: CustomerUser) => void;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  customer: null,
  isAuthenticated: Boolean(localStorage.getItem('access_token')),
  isLoading: false,

  setAuth: (data) => {
    localStorage.setItem('access_token', data.accessToken);
    set({
      token: data.accessToken,
      user: data.user,
      customer: data.customer,
      isAuthenticated: true,
    });
  },

  setCustomer: (customer) => set({ customer }),
  setUser: (user) => set({ user }),

  login: async (payload: CustomerLoginPayload) => {
    set({ isLoading: true });
    try {
      const res = await customerAuthApi.login(payload);
      const authData = res.data.data;
      get().setAuth(authData);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload: CustomerRegisterPayload) => {
    set({ isLoading: true });
    try {
      const res = await customerAuthApi.register(payload);
      const authData = res.data.data;
      get().setAuth(authData);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, customer: null });
      return;
    }
    try {
      const res = await customerAuthApi.getMe();
      if (res.data?.data) {
        set({
          user: res.data.data.user,
          customer: res.data.data.customer,
          isAuthenticated: true,
        });
      }
    } catch (err: any) {
      // If token expired or unauthorized, clear
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().logout();
      }
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, user: null, customer: null, isAuthenticated: false });
  },
}));
