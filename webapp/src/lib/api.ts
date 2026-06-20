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
  allRequests: () => apiClient.get('/employer/requests'),
  redemptions: () => apiClient.get('/employer/redemptions'),
  usersWallets: () => apiClient.get('/employer/users'),
  wallets: () => apiClient.get('/employer/wallets'),
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
  upcoming: () => apiClient.get('/deals/upcoming'),
  pause: (id: number) => apiClient.patch(`/deals/${id}/pause`),
  boost: (id: number) => apiClient.patch(`/deals/${id}/boost`),
  create: (data: { offer_id: number; deal_date: string; deal_price?: number; quantity_limit?: number }) =>
    apiClient.post('/deals', data),
};

// ─── Collaborations ───────────────────────────────────────────────────────────

export const collaborationsApi = {
  list: () => apiClient.get('/collaborations'),
  create: (data: { title: string; description?: string; items: { offer_id: number; price_share: number }[] }) =>
    apiClient.post('/collaborations', data),
  update: (id: number, data: { title?: string; description?: string; is_active?: boolean }) =>
    apiClient.patch(`/collaborations/${id}`, data),
};

// ─── Offers (public) ──────────────────────────────────────────────────────────

export const offersApi = {
  list: (params?: { search?: string; category?: string; limit?: number }) =>
    apiClient.get('/offers', { params }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => apiClient.get('/notifications/me'),
  markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/me/read-all'),
};

// ─── Providers (public) ───────────────────────────────────────────────────────

export const providersApi = {
  list: (params?: { q?: string; category?: string }) =>
    apiClient.get('/providers', { params }),
  adminList: () => apiClient.get('/providers/admin/network'),
  create: (data: {
    name: string; category: string; city?: string; country?: string;
    description?: string; logo_url?: string; rating?: number; status?: string;
  }) => apiClient.post('/providers/admin', data),
  update: (id: number, data: Partial<{
    name: string; category: string; city: string; country: string;
    description: string; logo_url: string; rating: number; status: string;
  }>) => apiClient.patch(`/providers/admin/${id}`, data),
};

// ─── Platform admin ───────────────────────────────────────────────────────────

export const adminApi = {
  createOffer: (data: {
    provider_id: number;
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
  }) => apiClient.post('/employer/offers', data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => apiClient.get('/analytics/overview'),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  workspace: () => apiClient.get('/settings/workspace'),
  updateWorkspace: (data: Partial<{
    name: string; trading_name: string; city: string; support_email: string; support_phone: string;
  }>) => apiClient.patch('/settings/workspace', data),
  updateBrand: (data: Partial<{ logo_url: string; brand_colors: Record<string, string> }>) =>
    apiClient.patch('/settings/brand', data),
  updateLocalization: (data: Partial<{
    language: string; timezone: string; week_start: string; number_format: string;
  }>) => apiClient.patch('/settings/localization', data),
  updatePolicies: (data: Partial<{
    auto_approve_under: number; require_signoff_above: number;
    lock_wallet_at_cap: boolean; ai_bundle_suggestions: boolean;
  }>) => apiClient.patch('/settings/policies', data),
  updateNotifications: (data: Partial<{
    new_requests: boolean; daily_drop_recap: boolean; provider_downtime: boolean; weekly_digest: boolean;
  }>) => apiClient.patch('/settings/notifications', data),
  updateSecurity: (data: Partial<{
    enforce_sso: boolean; require_2fa_admins: boolean; ip_allowlist: boolean;
  }>) => apiClient.patch('/settings/security', data),
  workspaces: () => apiClient.get('/settings/workspaces'),
};

// ─── Team & Roles ─────────────────────────────────────────────────────────────

export const teamApi = {
  overview: () => apiClient.get('/team/overview'),
  updateMember: (id: number, data: Partial<{ permission_role: string; two_factor_enabled: boolean }>) =>
    apiClient.patch(`/team/members/${id}`, data),
  invites: () => apiClient.get('/team/invites'),
  createInvite: (data: { email: string; role: string }) => apiClient.post('/team/invites', data),
  revokeInvite: (id: number) => apiClient.delete(`/team/invites/${id}`),
};

// ─── Notifications (admin broadcasts) ─────────────────────────────────────────

export const broadcastsApi = {
  overview: () => apiClient.get('/notifications/admin/overview'),
  updateCadence: (data: Partial<{
    quiet_hours_start: string; quiet_hours_end: string; push_muted_during_quiet_hours: boolean;
  }>) => apiClient.patch('/notifications/admin/cadence', data),
  createTemplate: (data: { name: string; channel: string }) =>
    apiClient.post('/notifications/admin/templates', data),
};

// ─── Campaigns ─────────────────────────────────────────────────────────────────

export const campaignsApi = {
  overview: () => apiClient.get('/campaigns/overview'),
  funnel: (id: number) => apiClient.get(`/campaigns/${id}/funnel`),
};

// ─── Packages ────────────────────────────────────────────────────────────────

export const packagesApi = {
  list: () => apiClient.get('/packages'),
  generate: () => apiClient.post('/ai/generate-packages'),
};

// ─── Redemptions (employee-scoped) ────────────────────────────────────────────

export const redemptionsApi = {
  me: () => apiClient.get('/redemptions/me'),
  providerList: () => apiClient.get('/provider/redemptions'),
  confirm: (id: number) => apiClient.post(`/provider/redemptions/${id}/confirm`),
};
