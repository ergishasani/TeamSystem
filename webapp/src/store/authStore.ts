import { create } from 'zustand';
import { authApi } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('perka_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      const token = res.data.access_token;
      localStorage.setItem('perka_token', token);
      const meRes = await authApi.me();
      set({ token, user: meRes.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('perka_token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('perka_token');
    if (!token) return;
    try {
      const res = await authApi.me();
      set({ user: res.data });
    } catch {
      localStorage.removeItem('perka_token');
      set({ user: null, token: null });
    }
  },
}));
