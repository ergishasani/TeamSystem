import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 or role-mismatch 403 (e.g. stale session after a reseed)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const isSessionBroken = status === 401 || status === 403;
    if (isSessionBroken) {
      await SecureStore.deleteItemAsync('auth_token');
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () => apiClient.get('/users/me'),
  update: (data: { full_name?: string; phone?: string; address?: string; avatar_url?: string; language?: string }) =>
    apiClient.patch('/users/me', data),
  colleagues: (q?: string) => apiClient.get('/users/colleagues', { params: q ? { q } : undefined }),
  leaderboard: () => apiClient.get('/users/leaderboard'),
  myStats: () => apiClient.get('/users/me/stats'),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string }>('/auth/login', { email, password }),

  register: (data: { full_name: string; email: string; password: string; role?: string; company_id?: number }) =>
    apiClient.post('/auth/register', data),

  me: () => apiClient.get('/auth/me'),
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const walletApi = {
  getWallet: () => apiClient.get('/wallet/me'),
  getHistory: () => apiClient.get('/wallet/me/history'),
  topUp: (amount: number) => apiClient.post('/wallet/me/topup', { amount }),
  transfer: (to_email: string, amount: number) => apiClient.post('/wallet/me/transfer', { to_email, amount }),
};

// ─── Offers ───────────────────────────────────────────────────────────────────

export const offersApi = {
  list: (params?: { category?: string; city?: string; max_price?: number; search?: string; limit?: number; offset?: number }) =>
    apiClient.get('/offers', { params }),

  getById: (id: number) => apiClient.get(`/offers/${id}`),

  save: (id: number) => apiClient.post(`/offers/${id}/save`),

  unsave: (id: number) => apiClient.delete(`/offers/${id}/save`),

  getSaved: () => apiClient.get('/offers/users/me/saved-offers'),
};

// ─── Packages ─────────────────────────────────────────────────────────────────

export const packagesApi = {
  list: () => apiClient.get('/packages'),

  getById: (id: number) => apiClient.get(`/packages/${id}`),

  create: (data: { title: string; offer_ids: number[]; description?: string; ai_reason?: string }) =>
    apiClient.post('/packages', data),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {
  pick: () => apiClient.get('/ai/pick'),

  concierge: (message: string, budget?: number) =>
    apiClient.post('/ai/concierge', { message, budget }),

  generatePackage: (message: string, budget?: number) =>
    apiClient.post('/ai/packages/generate', { message, budget }),

  recommendations: () => apiClient.get('/ai/recommendations/me'),
};

// ─── Benefit Requests ─────────────────────────────────────────────────────────

export const requestsApi = {
  create: (data: { package_id?: number; offer_id?: number; collaboration_id?: number; request_type?: string; ai_reason?: string }) =>
    apiClient.post('/benefit-requests', data),

  myRequests: () => apiClient.get('/benefit-requests/me'),

  getById: (id: number) => apiClient.get(`/benefit-requests/${id}`),

  cancel: (id: number) => apiClient.patch(`/benefit-requests/${id}/cancel`),
};

// ─── Redemptions ──────────────────────────────────────────────────────────────

export const redemptionsApi = {
  myRedemptions: () => apiClient.get('/redemptions/me'),
  getById: (id: number) => apiClient.get(`/redemptions/${id}`),
  byRequest: (requestId: number) => apiClient.get(`/redemptions/by-request/${requestId}`),
};

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challengesApi = {
  list: () => apiClient.get('/challenges'),
  myProgress: () => apiClient.get('/challenges/me/progress'),
  join: (id: number) => apiClient.post(`/challenges/${id}/join`),
};

// ─── Providers ────────────────────────────────────────────────────────────────

export const providersApi = {
  list: (params?: { category?: string; q?: string }) => apiClient.get('/providers', { params }),
  getById: (id: number) => apiClient.get(`/providers/${id}`),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingApi = {
  saveInterests: (interests: string[]) => apiClient.post('/onboarding/interests', { interests }),
  getInterests: () => apiClient.get('/onboarding/interests'),
};

// ─── Cards ────────────────────────────────────────────────────────────────────

export const cardsApi = {
  list: () => apiClient.get('/cards'),
  add: (data: { card_type: string; brand: string; last_four: string; expiry: string; is_primary: boolean }) =>
    apiClient.post('/cards', data),
  setPrimary: (id: number) => apiClient.patch(`/cards/${id}/primary`),
  remove: (id: number) => apiClient.delete(`/cards/${id}`),
};

// ─── Swipe ────────────────────────────────────────────────────────────────────

export const swipeApi = {
  getDeck: () => apiClient.get('/offers/swipe/deck'),
  swipe: (offerId: number, direction: 'like' | 'dislike') =>
    apiClient.post(`/offers/${offerId}/swipe`, { direction }),
};

// ─── Daily Deal ───────────────────────────────────────────────────────────────

export const dealsApi = {
  today: () => apiClient.get('/deals/today'),
  create: (data: { offer_id: number; deal_date: string; deal_price?: number; quantity_limit?: number }) =>
    apiClient.post('/deals', data),
};

// ─── Collaborations ───────────────────────────────────────────────────────────

export const collaborationsApi = {
  list: () => apiClient.get('/collaborations'),
  getById: (id: number) => apiClient.get(`/collaborations/${id}`),
  create: (data: { title: string; description?: string; items: { offer_id: number; price_share: number }[] }) =>
    apiClient.post('/collaborations', data),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => apiClient.get('/notifications/me'),
  markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/me/read-all'),
};

// ─── Shake ────────────────────────────────────────────────────────────────────

export const shakeApi = {
  status: () => apiClient.get('/shake/status'),
  play: () => apiClient.post('/shake/play'),
};

// ─── AI Filter ────────────────────────────────────────────────────────────────

export const aiFilterApi = {
  filterOffers: (query: string) => apiClient.get('/ai/filter-offers', { params: { q: query } }),
};
