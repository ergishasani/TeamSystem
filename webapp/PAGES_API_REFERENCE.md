# Perka Webapp — Pages & API Reference

All API paths are prefixed with `/api/v1`. The Vite dev-server proxy rewrites `/api/*` to `http://localhost:8000/api/*`, so every path listed below is relative to that prefix.

**Auth header** — every protected endpoint requires `Authorization: Bearer <jwt>`. The Axios client attaches this automatically from `localStorage.perka_token`.

---

## Table of contents

1. [Login](#1-login)
2. [Employer — Dashboard](#2-employer--dashboard)
3. [Employer — Approvals](#3-employer--approvals)
4. [Employer — Employees](#4-employer--employees)
5. [Employer — Payments](#5-employer--payments)
6. [Employer — AI Insights](#6-employer--ai-insights)
7. [Provider — Dashboard](#7-provider--dashboard)
8. [Provider — Offers](#8-provider--offers)
9. [Provider — Redemptions](#9-provider--redemptions)
10. [Provider — Payments](#10-provider--payments)

---

## 1. Login

**Route:** `/login`
**File:** `src/pages/LoginPage.tsx`
**Auth required:** No

### What it renders
Email + password form with a show/hide password toggle and a one-click demo-credential fill button. On success the user is redirected to their role's home page.

### APIs

| Trigger | Method | Path | Body | On success |
|---------|--------|------|------|------------|
| Form submit | `POST` | `/auth/login` | `{ email, password }` | Stores JWT, calls `/auth/me`, redirects |
| After login | `GET` | `/auth/me` | — | Sets `user` in Zustand store |

### Response shapes

```ts
// POST /auth/login
{ access_token: string; token_type: "bearer" }

// GET /auth/me
User {
  id: number; full_name: string; email: string;
  role: "employer_admin" | "provider_admin" | ...;
  company_id: number | null; provider_id: number | null;
  language: string; country: string; currency: string; created_at: string;
}
```

### Role redirect after login

| Role | Redirected to |
|------|---------------|
| `employer_admin` | `/employer` |
| `provider_admin` | `/provider` |
| anything else | stays on `/login` (access denied) |

---

## 2. Employer — Dashboard

**Route:** `/employer`
**File:** `src/pages/employer/DashboardPage.tsx`
**Auth required:** `employer_admin`

### What it renders
Four stat cards (Total Requests, Pending, Approved, Employees) and a table of all company employees with name, email, and join date.

### APIs

| When | Method | Path | Returns |
|------|--------|------|---------|
| Page load | `GET` | `/employer/dashboard` | `EmployerDashboard` |
| Page load | `GET` | `/employer/employees` | `User[]` |

### Response shapes

```ts
// GET /employer/dashboard
EmployerDashboard {
  total_requests: number;
  pending: number;
  approved: number;
}

// GET /employer/employees
User[]   // same User shape as /auth/me
```

---

## 3. Employer — Approvals

**Route:** `/employer/approvals`
**File:** `src/pages/employer/ApprovalsPage.tsx`
**Auth required:** `employer_admin`

### What it renders
A list of all pending benefit requests. Each card shows request ID, status badge, request type, employee ID, submitted-at timestamp, total amount, and an optional AI reason. Pending requests show **Approve** and **Reject** buttons. Rejecting opens a modal to enter an optional rejection reason.

### APIs

| Trigger | Method | Path | Body | Notes |
|---------|--------|------|------|-------|
| Page load + after any action | `GET` | `/employer/approvals` | — | Returns all company's pending requests |
| Approve button | `POST` | `/employer/approvals/{id}/approve` | — | Triggers approval flow: marks approved, releases budget, creates Payment + Redemption + Notification |
| Confirm reject in modal | `POST` | `/employer/approvals/{id}/reject` | `{ rejection_reason?: string }` | Releases pending budget, creates rejected Notification |

### Response shapes

```ts
// GET /employer/approvals
BenefitRequest[] {
  id: number;
  employee_id: number;
  company_id: number;
  package_id: number | null;
  offer_id: number | null;
  request_type: "package" | "single_offer";
  total_amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  ai_reason: string | null;
  submitted_at: string;       // ISO datetime
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}
```

### Side effects of approve

When `POST /employer/approvals/{id}/approve` succeeds the backend:
1. Sets request `status = approved`
2. Updates the employee's budget (`used += total`, `pending -= total`)
3. Creates a `Payment` record per provider involved
4. Creates a `Redemption` with a QR code valid for 30 days
5. Creates a `request_approved` Notification for the employee

### Side effects of reject

1. Sets request `status = rejected`, stores `rejection_reason`
2. Releases `pending_amount` back to `remaining_amount`
3. Creates a `request_rejected` Notification for the employee

---

## 4. Employer — Employees

**Route:** `/employer/employees`
**File:** `src/pages/employer/EmployeesPage.tsx`
**Auth required:** `employer_admin`

### What it renders
Searchable table of all employees in the company. Columns: #, name (with avatar initial), email, currency, joined date. Search filters by name or email client-side.

### APIs

| When | Method | Path | Returns |
|------|--------|------|---------|
| Page load | `GET` | `/employer/employees` | `User[]` |

### Response shape

```ts
User[] // scoped to the employer's company_id
```

---

## 5. Employer — Payments

**Route:** `/employer/payments`
**File:** `src/pages/employer/PaymentsPage.tsx`
**Auth required:** `employer_admin`

### What it renders
A summary banner with the total amount paid out, then a table of all payments for approved requests in the company. Columns: Payment ID, Request, Provider ID, Amount, Status badge, Date.

### APIs

| When | Method | Path | Returns |
|------|--------|------|---------|
| Page load | `GET` | `/employer/payments` | `Payment[]` |

### Response shape

```ts
Payment {
  id: number;
  request_id: number;
  provider_id: number;
  amount: number;
  currency: string;
  status: "simulated_paid";   // only value currently
  created_at: string;
}
```

---

## 6. Employer — AI Insights

**Route:** `/employer/insights`
**File:** `src/pages/employer/InsightsPage.tsx`
**Auth required:** `employer_admin`

### What it renders
On first visit shows an empty state with a "Generate Insights" button. After clicking, it hits the backend and renders:
- An AI-generated insight sentence (highlighted banner)
- Five metric cards: Total Requests, Approval Rate, Avg Spend / Request, Total Approved, Budget Utilisation
- A horizontal bar chart of spend by category
- A ranked list of top categories

A "Refresh" button re-calls the endpoint at any time.

### APIs

| Trigger | Method | Path | Body | Returns |
|---------|--------|------|------|---------|
| Button click | `POST` | `/ai/employer-insights` | — | `EmployerInsights` |

### Response shape

```ts
EmployerInsights {
  top_categories: string[];
  category_spend: { category: string; total: number }[];  // [{ category: "wellness", total: 12500 }, …]
  approval_rate: number;                   // 0–1, e.g. 0.85 = 85 %
  avg_spend: number;
  total_requests: number;
  pending_total: number;
  approved_total: number;
  avg_budget_utilization: number;          // 0–1
  insight: string;                         // generated sentence
}
```

> Source of truth for response shapes is `backend/API_REFERENCE.md` / the Pydantic schemas in
> `backend/app/schemas/`. Cross-check there before updating this doc.

### Backend logic

`POST /ai/employer-insights` calls `employer_insights(db, company_id)` in `app/services/insights_service.py`. It aggregates all the company's `BenefitRequest` rows — no OpenAI call needed, this is pure DB aggregation.

---

## 7. Provider — Dashboard

**Route:** `/provider`
**File:** `src/pages/provider/DashboardPage.tsx`
**Auth required:** `provider_admin`

### What it renders
Two stat cards (Total Offers, Pending Redemptions) and a table of the 5 most recent redemptions with QR code, offer ID, status badge, and expiry date.

### APIs

| When | Method | Path | Returns |
|------|--------|------|---------|
| Page load | `GET` | `/provider/dashboard` | `ProviderDashboard` |
| Page load | `GET` | `/provider/redemptions` | `Redemption[]` (first 5 shown) |

### Response shapes

```ts
// GET /provider/dashboard
ProviderDashboard {
  total_offers: number;
  pending_redemptions: number;
}

// GET /provider/redemptions
Redemption {
  id: number;
  request_id: number;
  offer_id: number;
  provider_id: number;
  qr_code: string;                              // "PERKA-{req}-{offer}-{8HEX}"
  status: "active" | "redeemed" | "expired";
  redeemed_at: string | null;
  expires_at: string | null;
}
```

---

## 8. Provider — Offers

**Route:** `/provider/offers`
**File:** `src/pages/provider/OffersPage.tsx`
**Auth required:** `provider_admin`

### What it renders
A card grid of all the provider's offers. Each card shows title, category, city, status badge, description (capped at 2 lines), price, discount %, limited-drop tag, and an **Edit** button. A **New Offer** button opens the create modal.

Both create and edit use the same form modal with fields: title, description, category (dropdown), price, currency, discount %, city, country, quantity available, valid until (date picker), and a limited-drop toggle.

### APIs

| Trigger | Method | Path | Body | Notes |
|---------|--------|------|------|-------|
| Page load + after save | `GET` | `/provider/offers` | — | Returns this provider's offers |
| Create modal submit | `POST` | `/provider/offers` | `OfferCreate` | Creates and links to provider |
| Edit modal submit | `PATCH` | `/provider/offers/{id}` | `OfferUpdate` (all fields optional) | Only edits offers owned by the caller |

### Request shapes

```ts
// POST /provider/offers
OfferCreate {
  title: string;
  description?: string;
  category: string;           // wellness | food | travel | learning | fitness | dental | entertainment | other
  price: number;
  currency: string;           // e.g. "ALL"
  city: string;
  country: string;            // ISO-2, e.g. "AL"
  discount_percent?: number;  // default 0
  quantity_available?: number;
  valid_until?: string;       // ISO date, e.g. "2026-12-31"
  is_limited_drop?: boolean;  // default false
}

// PATCH /provider/offers/{id}
OfferUpdate {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  discount_percent?: number;
  quantity_available?: number;
  valid_until?: string;
  is_limited_drop?: boolean;
  status?: string;            // "active" | "inactive"
}
```

### Response shape

```ts
Offer {
  id: number;
  provider_id: number;
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
```

---

## 9. Provider — Redemptions

**Route:** `/provider/redemptions`
**File:** `src/pages/provider/RedemptionsPage.tsx`
**Auth required:** `provider_admin`

### What it renders
Filter tabs (All / Active / Redeemed / Expired) with counts, then a list of redemption cards. Each card shows the offer ID, QR code string, status badge, request ID, and expiry / redeemed-at date. Active redemptions show a **Confirm Redemption** button.

### APIs

| Trigger | Method | Path | Body | Notes |
|---------|--------|------|------|-------|
| Page load + after confirm | `GET` | `/provider/redemptions` | — | All redemptions for this provider |
| Confirm button | `POST` | `/provider/redemptions/{id}/confirm` | — | Marks `redeemed`, advances challenge progress |

### Response shape

```ts
Redemption[]  // see §7 for full shape
```

### Side effects of confirm

When `POST /provider/redemptions/{id}/confirm` is called:
1. Sets redemption `status = redeemed`, stamps `redeemed_at`
2. Calls `advance_challenges(db, user_id, offer)` — increments progress on any active challenge that matches the offer's category (or category = null); marks challenge `completed` + awards XP if goal reached

---

## 10. Provider — Payments

**Route:** `/provider/payments`
**File:** `src/pages/provider/PaymentsPage.tsx`
**Auth required:** `provider_admin`

### What it renders
A summary banner showing total revenue received, then a table of all payment records for this provider. Columns: ID, Request, Amount, Status badge, Date.

### APIs

| When | Method | Path | Returns |
|------|--------|------|---------|
| Page load | `GET` | `/provider/payments` | `Payment[]` |

### Response shape

```ts
Payment[]  // see §5 for full shape
// provider_id on each record matches the caller's provider
```

---

## Shared authentication endpoints

These are called from `src/store/authStore.ts`, not from individual pages.

| When | Method | Path | Notes |
|------|--------|------|-------|
| App startup (token in localStorage) | `GET` | `/auth/me` | Restores user state; clears token + redirects on 401 |
| Login form submit | `POST` | `/auth/login` | Returns JWT |
| Logout button (sidebar) | — | — | Clears localStorage only, no server call |

---

## Error handling

All API errors surface as a toast notification at the bottom-right of the screen. The Axios response interceptor handles the special case:

| HTTP status | Behaviour |
|-------------|-----------|
| `401` | Clears token from localStorage, hard-redirects to `/login` |
| Any other error | Page-level catch block reads `err.response.data.detail` (FastAPI's default error shape) and shows a red toast |
