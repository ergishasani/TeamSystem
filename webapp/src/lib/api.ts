import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('perka_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('perka_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string }>('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
};

// ─── Employer ─────────────────────────────────────────────────────────────────

export const employerApi = {
  dashboard: () => apiClient.get('/employer/dashboard'),
  approvals: () => apiClient.get('/employer/approvals'),
  approve: (id: number) => apiClient.post(`/employer/approvals/${id}/approve`),
  reject: (id: number, reason?: string) =>
    apiClient.post(`/employer/approvals/${id}/reject`, { rejection_reason: reason }),
  payments: () => apiClient.get('/employer/payments'),
  employees: () => apiClient.get('/employer/employees'),
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const providerApi = {
  dashboard: () => apiClient.get('/provider/dashboard'),
  offers: () => apiClient.get('/provider/offers'),
  createOffer: (data: {
    title: string;
    description?: string;
    category: string;
    price: number;
    currency: string;
    city: string;
    country: string;
    discount_percent?: number;
    quantity_available?: number;
    valid_until?: string;
    is_limited_drop?: boolean;
  }) => apiClient.post('/provider/offers', data),
  updateOffer: (id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    price: number;
    discount_percent: number;
    quantity_available: number;
    valid_until: string;
    is_limited_drop: boolean;
    status: string;
  }>) => apiClient.patch(`/provider/offers/${id}`, data),
  redemptions: () => apiClient.get('/provider/redemptions'),
  confirmRedemption: (id: number) => apiClient.post(`/provider/redemptions/${id}/confirm`),
  payments: () => apiClient.get('/provider/payments'),
};

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const aiApi = {
  employerInsights: () => apiClient.post('/ai/employer-insights'),
};

// ─── Deals ────────────────────────────────────────────────────────────────────

export const dealsApi = {
  today: () => apiClient.get('/deals/today'),
  create: (data: { offer_id: number; deal_date: string; deal_price?: number; quantity_limit?: number }) =>
    apiClient.post('/deals', data),
};

// ─── Collaborations ───────────────────────────────────────────────────────────

export const collaborationsApi = {
  list: () => apiClient.get('/collaborations'),
  create: (data: { title: string; description?: string; items: { offer_id: number; price_share: number }[] }) =>
    apiClient.post('/collaborations', data),
};

// ─── Offers (public) ──────────────────────────────────────────────────────────

export const offersApi = {
  list: () => apiClient.get('/offers'),
};
