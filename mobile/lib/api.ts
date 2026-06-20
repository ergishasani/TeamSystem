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
  concierge: (message: string, budget?: number) =>
    apiClient.post('/ai/concierge', { message, budget }),

  generatePackage: (message: string, budget?: number) =>
    apiClient.post('/ai/packages/generate', { message, budget }),

  recommendations: () => apiClient.get('/ai/recommendations/me'),
};

// ─── Benefit Requests ─────────────────────────────────────────────────────────

export const requestsApi = {
  create: (data: { package_id?: number; offer_id?: number; request_type?: string; ai_reason?: string }) =>
    apiClient.post('/benefit-requests', data),

  myRequests: () => apiClient.get('/benefit-requests/me'),

  getById: (id: number) => apiClient.get(`/benefit-requests/${id}`),

  cancel: (id: number) => apiClient.patch(`/benefit-requests/${id}/cancel`),
};

// ─── Redemptions ──────────────────────────────────────────────────────────────

export const redemptionsApi = {
  myRedemptions: () => apiClient.get('/redemptions/me'),
  getById: (id: number) => apiClient.get(`/redemptions/${id}`),
};

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challengesApi = {
  list: () => apiClient.get('/challenges'),
  myProgress: () => apiClient.get('/challenges/me/progress'),
  join: (id: number) => apiClient.post(`/challenges/${id}/join`),
};

// ─── Providers ────────────────────────────────────────────────────────────────

export const providersApi = {
  list: () => apiClient.get('/providers'),
  getById: (id: number) => apiClient.get(`/providers/${id}`),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingApi = {
  saveInterests: (interests: string[]) => apiClient.post('/onboarding/interests', { interests }),
  getInterests: () => apiClient.get('/onboarding/interests'),
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

// ─── Shake ────────────────────────────────────────────────────────────────────

export const shakeApi = {
  status: () => apiClient.get('/shake/status'),
  play: () => apiClient.post('/shake/play'),
};

// ─── AI Filter ────────────────────────────────────────────────────────────────

export const aiFilterApi = {
  filterOffers: (query: string) => apiClient.get('/ai/filter-offers', { params: { q: query } }),
};
