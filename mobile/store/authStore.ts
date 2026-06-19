import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const res = await authApi.me();
        set({ token, user: res.data, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ token: null, user: null, isHydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      const { access_token } = res.data;
      await SecureStore.setItemAsync('auth_token', access_token);
      const meRes = await authApi.me();
      set({ token: access_token, user: meRes.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null });
  },
}));
