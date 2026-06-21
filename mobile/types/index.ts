export type UserRole = 'employee' | 'employer_admin' | 'provider_admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  company_id: number | null;
  provider_id: number | null;
  language: string;
  country: string;
  currency: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  country: string;
  currency: string;
  monthly_budget_per_employee: number;
  approval_required_above: number | null;
}

export interface Provider {
  id: number;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string | null;
  logo_url: string | null;
  rating: number;
  status: string;
}

export interface Offer {
  id: number;
  provider_id: number;
  provider_name: string | null;
  title: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  discount_percent: number;
  quantity_available: number | null;
  valid_until: string | null;
  is_limited_drop: boolean;
  image_url: string | null;
  status: string;
  created_at: string;
}

export interface PackageItem {
  id: number;
  offer_id: number;
  provider_id: number;
  price_share: number;
  category: string;
  offer_title: string | null;
  provider_name: string | null;
  valid_until: string | null;
}

export interface Package {
  id: number;
  title: string;
  description: string | null;
  total_price: number;
  currency: string;
  city: string;
  country: string;
  created_by: number | null;
  ai_reason: string | null;
  created_at: string;
  items: PackageItem[];
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface BenefitRequest {
  id: number;
  employee_id: number;
  company_id: number;
  package_id: number | null;
  offer_id: number | null;
  request_type: string;
  total_amount: number;
  currency: string;
  status: RequestStatus;
  title: string | null;
  charity_id: number | null;
  donation_amount: number | null;
  donation_match_amount: number | null;
  ai_reason: string | null;
  submitted_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

export interface Charity {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: string;
  company_id: number | null;
  is_platform_wide: boolean;
  is_active: boolean;
}

export interface Wallet {
  monthly_budget: number;
  used_amount: number;
  pending_amount: number;
  remaining_amount: number;
  currency: string;
  level: number;
  xp: number;
  streak_count: number;
}

export interface Payment {
  id: number;
  request_id: number;
  provider_id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export type RedemptionStatus = 'active' | 'redeemed' | 'expired';

export interface Redemption {
  id: number;
  request_id: number;
  offer_id: number;
  provider_id: number;
  qr_code: string;
  status: RedemptionStatus;
  redeemed_at: string | null;
  expires_at: string | null;
}

export interface Challenge {
  id: number;
  title: string;
  description: string | null;
  type: string;
  goal: number | null;
  reward: number;
  progress: number;
  completed: boolean;
}

export interface Card {
  id: number;
  card_type: 'debit' | 'credit';
  brand?: string;
  last_four: string;
  expiry?: string | null;
  is_primary?: boolean;
  created_at: string;
}

export interface AiPick {
  offer_id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  provider_name: string | null;
  reason: string;
}

export interface AIConciergeResponse {
  reply: string;
  suggested_categories: string[];
  suggested_package_title: string | null;
}

export interface RecommendedOffer {
  offer_id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  reason: string;
}
