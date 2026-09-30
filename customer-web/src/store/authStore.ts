import { create } from 'zustand';

export interface CustomerAuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  isAuthenticated: Boolean(localStorage.getItem('access_token')),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    set({ token, isAuthenticated: Boolean(token) });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, isAuthenticated: false });
  },
}));
