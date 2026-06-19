# Perka — Feature Reference

Complete description of every feature in the platform, how it works end-to-end, and which part of the codebase powers it.

**Stack at a glance**

| Layer | Tech | Port |
|-------|------|------|
| Backend API | FastAPI + PostgreSQL | 8000 |
| Mobile app | Expo React Native (expo-router) | 8081 |
| Web admin | Vite + React + Tailwind | 3001 |

---

## Table of contents

1. [Authentication](#1-authentication)
2. [Mobile — Home screen](#2-mobile--home-screen)
3. [Mobile — Explore](#3-mobile--explore)
4. [Mobile — Offer detail & request](#4-mobile--offer-detail--request)
5. [Mobile — Package detail & request](#5-mobile--package-detail--request)
6. [Mobile — Wallet](#6-mobile--wallet)
7. [Mobile — AI Concierge](#7-mobile--ai-concierge)
8. [Mobile — Redemption viewer](#8-mobile--redemption-viewer)
9. [Mobile — Profile](#9-mobile--profile)
10. [Benefit request & approval flow](#10-benefit-request--approval-flow)
11. [Web admin — Employer portal](#11-web-admin--employer-portal)
12. [Web admin — Provider portal](#12-web-admin--provider-portal)
13. [Challenges & XP system](#13-challenges--xp-system)
14. [Notifications](#14-notifications)
15. [AI & recommendations](#15-ai--recommendations)

---

## 1. Authentication

**Files:** `mobile/app/(auth)/`, `mobile/store/authStore.ts`, `webapp/src/pages/LoginPage.tsx`, `webapp/src/store/authStore.ts`, `backend/app/core/security.py`, `backend/app/api/v1/routes/auth.py`

### How it works

- Users register or log in with email + password.
- The backend hashes passwords with **bcrypt** and issues a **JWT** (`python-jose`, `HS256`).
- Tokens are valid for 24 hours (`ACCESS_TOKEN_EXPIRE_MINUTES=1440`).
- Mobile stores the token in **Expo SecureStore** (encrypted native keychain).
- Webapp stores the token in **localStorage** (`perka_token`).
- Every API request attaches `Authorization: Bearer <token>` via an Axios request interceptor.
- A `401` response auto-clears the token and redirects to the login screen.

### Roles

| Role | Where they log in | What they can do |
|------|-------------------|-----------------|
| `employee` | Mobile app | Browse offers, submit benefit requests, track wallet, use AI concierge |
| `employer_admin` | Web admin `/employer` | Approve/reject requests, view employees, see AI insights |
| `provider_admin` | Web admin `/provider` | Manage offers, confirm redemptions, view payments |
| `platform_admin` | — (not yet built) | Future: platform-wide management |

### Endpoints used

| Method | Path | Who calls it |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Mobile register screen |
| `POST` | `/api/v1/auth/login` | Mobile login · Webapp login |
| `GET` | `/api/v1/auth/me` | Both apps on startup to restore session |

---

## 2. Mobile — Home screen

**File:** `mobile/app/(tabs)/index.tsx`

### What it shows

A personalised dashboard that loads four resources in parallel on mount:

| Section | Data source | Display |
|---------|------------|---------|
| Wallet card | `GET /wallet/me` | Monthly budget, used, pending, remaining amounts + level & XP |
| Recommended Packages | `GET /packages` (first 3) | Scrollable package cards |
| New Drops | `GET /offers?limit=6` (first 4) | Horizontal scroll of offer cards |
| Active Challenges | `GET /challenges` (first 2) | Challenge cards with goal & reward |

Greeting uses the employee's first name from the Zustand auth store.

---

## 3. Mobile — Explore

**File:** `mobile/app/(tabs)/explore.tsx`

### What it shows

A searchable, filterable list of all active offers.

### How filtering works

- **Search bar** — live text search; each keystroke calls `GET /offers?search=<text>` (backend does `ILIKE` matching on title/description).
- **Category pills** — `All`, `wellness`, `fitness`, `food`, `travel`, `learning`, `health`. Tapping a pill calls `GET /offers?category=<cat>`. Both filters can be active simultaneously.
- Results show a count ("X offers found") and render `OfferCard` components.

### Endpoint used

| Method | Path | Query params |
|--------|------|-------------|
| `GET` | `/api/v1/offers` | `category`, `search`, `limit=20` |

---

## 4. Mobile — Offer detail & request

**File:** `mobile/app/offers/[id].tsx`

### What it shows

Full detail view for a single offer: colour-coded category banner, title, price, description, location, valid-until date, limited-drop badge.

### How requesting works

1. Employee taps **Request · [price] ALL**.
2. A confirmation `Alert` shows the offer title and price.
3. On confirm → `POST /benefit-requests` with `{ offer_id, request_type: "single_offer" }`.
4. The backend validates remaining budget, moves the amount from `remaining` to `pending`, and creates a `BenefitRequest`.
5. **Auto-approval** — if `total_amount ≤ Company.approval_required_above`, the request is immediately approved (payment + redemption + QR code created automatically).
6. Otherwise the request stays `pending` for employer review.
7. Success alert offers "View Request" → navigates to `/requests/{id}`.

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/offers/{id}` | Load offer data |
| `POST` | `/api/v1/benefit-requests` | Submit request |

---

## 5. Mobile — Package detail & request

**File:** `mobile/app/packages/[id].tsx`

### What it shows

A curated bundle of multiple offers (a "package"). Shows title, total price, optional AI reasoning note, and a numbered list of all included offers with their individual price shares.

### How requesting works

Identical flow to offer requests but uses `{ package_id, request_type: "package" }`. The backend computes `total_amount` from the sum of all `PackageItem.price_share` values.

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/packages/{id}` | Load package + items |
| `POST` | `/api/v1/benefit-requests` | Submit request |

---

## 6. Mobile — Wallet

**File:** `mobile/app/(tabs)/wallet.tsx`

### What it shows

Two sections:

**Wallet card** — live budget breakdown:

| Field | Description |
|-------|-------------|
| Monthly budget | Set by the employer per employee |
| Used | Confirmed spent (approved requests) |
| Pending | Reserved for in-flight requests |
| Remaining | `monthly_budget − used` |
| Level & XP | Earned by completing challenges |
| Streak | Consecutive-day redemption streak |

**Request history** — all past `BenefitRequest` rows for the employee, showing type emoji (📦 Package / 🎁 Offer), submitted date, amount, and a coloured status badge.

### Endpoints used

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/api/v1/wallet/me` | `Wallet` (budget breakdown + level/XP/streak) |
| `GET` | `/api/v1/wallet/me/history` | `BenefitRequest[]` |

---

## 7. Mobile — AI Concierge

**File:** `mobile/app/(tabs)/ai.tsx`

### What it shows

A real-time chat interface. The AI opens with a greeting. The employee types a message (e.g. "I'm stressed and need to relax this weekend") and the AI replies with personalised suggestions.

### How it works

1. Employee types a message and taps **Send**.
2. `POST /ai/concierge` is called with `{ message, budget? }`.
3. **If `OPENAI_API_KEY` is set** — the backend runs an OpenAI tool-calling loop (up to 5 rounds). The model can call read-only tools: `search_offers`, `get_wallet_balance`, `get_recommendations`, `build_package`. It uses these to ground its reply in real data before responding.
4. **If no API key** — the backend falls back to a rule-based engine that maps keywords (`relax`, `gym`, `learn`, `weekend`, …) to offer categories and blends them with the employee's saved interests.
5. The response always returns the same shape: a `reply` text, a list of `suggested_categories`, and an optional `suggested_package_title`.
6. The UI renders the reply as an AI bubble. Suggested categories appear as green tag chips below the message. If a package title is suggested, it's shown as "✨ Package: [title]".

### Endpoint used

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/api/v1/ai/concierge` | `{ message: string, budget?: number }` | `{ reply, suggested_categories[], suggested_package_title }` |

---

## 8. Mobile — Redemption viewer

**File:** `mobile/app/redemptions/[id].tsx`

### What it shows

After a request is approved, the employee receives a `Redemption` with a unique QR code. This screen shows:

- A status icon (green checkmark = active, grey = redeemed, red = expired)
- The QR code string displayed in a white box (ready to be replaced with a real QR renderer)
- Metadata: redemption ID, offer, status, expiry date, redeemed-at timestamp

The employee presents this screen to the provider in person. The provider scans/reads the code and confirms it via the web admin (see §12).

### Endpoint used

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/api/v1/redemptions/{id}` | `Redemption` |

---

## 9. Mobile — Profile

**File:** `mobile/app/(tabs)/profile.tsx`

### What it shows

- Avatar (initials), full name, email, role badge
- **Saved Offers** — shortcut to the employee's saved/bookmarked offers
- **My Taste Profile** — shortcut to interests (used to personalise AI recommendations)
- **Sign Out** — confirmation alert then clears the token

No API calls are made on this screen; data comes from the Zustand auth store already loaded at login.

---

## 10. Benefit request & approval flow

**Files:** `backend/app/services/approval_service.py`, `backend/app/api/v1/routes/benefit_requests.py`, `backend/app/api/v1/routes/employer.py`

This is the core business flow of the platform.

### Submit (employee)

```
Employee taps Request
  → POST /benefit-requests
      → Validates remaining_amount >= total_amount
      → Moves amount: remaining -= total, pending += total
      → Creates BenefitRequest (status = pending)
      → If total <= Company.approval_required_above:
            → Auto-approve immediately (runs full approval flow below)
```

### Approve (employer admin)

```
Employer clicks Approve in webapp
  → POST /employer/approvals/{id}/approve
      → Sets request status = approved, stamps approved_at
      → Updates employee budget: used += total, pending -= total
      → For each provider involved:
            → Creates Payment (status = simulated_paid)
      → For each offer involved:
            → Creates Redemption (qr_code = PERKA-{req_id}-{offer_id}-{8HEX})
            → expires_at = now + 30 days
            → status = active
      → Creates Notification for employee (type = request_approved)
```

### Reject (employer admin)

```
Employer clicks Reject (with optional reason)
  → POST /employer/approvals/{id}/reject
      → Sets request status = rejected, stores rejection_reason
      → Releases budget: pending -= total, remaining += total
      → Creates Notification for employee (type = request_rejected)
```

### Cancel (employee)

```
Employee cancels a pending request
  → PATCH /benefit-requests/{id}/cancel
      → Only allowed when status = pending
      → Releases budget: pending -= total, remaining += total
```

---

## 11. Web admin — Employer portal

**Files:** `webapp/src/pages/employer/`

All pages require `role = employer_admin`. Accessible at `http://localhost:3001/employer`.

### Dashboard (`/employer`)

Loads in parallel: `GET /employer/dashboard` (request counts) and `GET /employer/employees` (team list). Shows four stat cards and a full employee table.

### Approvals (`/employer/approvals`)

Lists all pending `BenefitRequest` rows for the company. Each card shows the request ID, type, employee ID, submitted timestamp, AI reason, and amount. Actions:
- **Approve** → `POST /employer/approvals/{id}/approve` — instant, no modal needed.
- **Reject** → opens a modal to enter an optional rejection reason → `POST /employer/approvals/{id}/reject`.

The list auto-refreshes after each action.

### Employees (`/employer/employees`)

Searchable table of all employees (`GET /employer/employees`). Client-side search filters by name or email. Shows name with avatar initial, email, currency, and join date.

### Payments (`/employer/payments`)

Shows total paid out (summed client-side) and a full table of `Payment` records (`GET /employer/payments`). Each row shows payment ID, linked request, provider ID, amount, status badge, and date.

### AI Insights (`/employer/insights`)

On demand — the user clicks "Generate Insights" to trigger `POST /ai/employer-insights`. Returns and renders:
- A highlighted AI-generated insight sentence
- Four metric cards: Approval Rate, Avg Spend / Request, Total Approved, Budget Utilisation
- A horizontal bar chart of spend by category (rendered with Tailwind divs, no chart library needed)
- Ranked list of top benefit categories

The insights endpoint is pure DB aggregation — it does not call OpenAI.

---

## 12. Web admin — Provider portal

**Files:** `webapp/src/pages/provider/`

All pages require `role = provider_admin`. Accessible at `http://localhost:3001/provider`.

### Dashboard (`/provider`)

Loads `GET /provider/dashboard` (total offers + pending redemption count) and `GET /provider/redemptions` (5 most recent). Shows two stat cards and a recent-redemptions table.

### Offers (`/provider/offers`)

Card grid of all the provider's offers (`GET /provider/offers`).

**Create offer** — "New Offer" button opens a modal form with fields: title, description, category (dropdown), price, currency, discount %, city, country, quantity available, valid-until date picker, limited-drop toggle → `POST /provider/offers`.

**Edit offer** — "Edit" button on each card pre-fills the same form → `PATCH /provider/offers/{id}` (all fields optional, only changed fields sent).

### Redemptions (`/provider/redemptions`)

Filter tabs (All / Active / Redeemed / Expired) with live counts. Each card shows the QR code string, offer ID, status badge, request ID, and expiry date.

**Confirm redemption** — "Confirm Redemption" button on active cards → `POST /provider/redemptions/{id}/confirm`. This:
1. Marks the redemption `redeemed`, stamps `redeemed_at`
2. Advances challenge progress for the employee (see §13)

### Payments (`/provider/payments`)

Total revenue banner + table of all payments received (`GET /provider/payments`).

---

## 13. Challenges & XP system

**Files:** `backend/app/services/challenge_service.py`, `backend/app/api/v1/routes/challenges.py`

Challenges are platform-defined goals that reward employees with XP for using their benefits.

### Challenge types

| Type | Goal measured by |
|------|-----------------|
| `streak` | Consecutive-day redemptions |
| `spending` | Total ALL spent on matching offers |
| `category` | Number of redemptions in a category |

### How progress works

Every time a provider confirms a redemption (`POST /provider/redemptions/{id}/confirm`), the backend calls `advance_challenges(db, user_id, offer)`:

1. Finds all active challenges where `category = offer.category` OR `category = null` (any category).
2. For each challenge:
   - `spending` type → increments progress by the offer's price.
   - Other types → increments progress by 1.
3. If `progress >= goal` → marks challenge `completed = true`, adds `challenge.reward` XP to the employee's profile.

### Mobile screens

- `GET /challenges` — list all challenges
- `GET /challenges/me/progress` — employee's progress rows
- `POST /challenges/{id}/join` — join a challenge (idempotent)

---

## 14. Notifications

**Files:** `backend/app/services/notification_service.py`, `backend/app/api/v1/routes/notifications.py`

In-app notifications inform employees of approval/rejection decisions.

### When they are created

| Event | Notification type | Message |
|-------|------------------|---------|
| Request approved | `request_approved` | Created in approval flow |
| Request rejected | `request_rejected` | Created in reject flow |

### Reading notifications (mobile)

- `GET /notifications/me` — returns all notifications newest-first
- `PATCH /notifications/{id}/read` — marks one notification as read

Notifications are currently in-app only. The backend has a placeholder in `notification_service.py` for future push delivery via Expo/FCM.

---

## 15. AI & recommendations

**Files:** `backend/app/services/ai_service.py`, `backend/app/services/llm_concierge.py`, `backend/app/services/recommendation_service.py`

### AI Concierge (chat)

Two engines, same response shape — the app never knows which ran:

**OpenAI tool-calling engine** (when `OPENAI_API_KEY` is set):
- Uses `gpt-4o-mini` by default (`OPENAI_MODEL` env var).
- The model receives the employee's message and can call up to 5 tool rounds.
- Available tools (all read-only, scoped to the calling employee): `search_offers`, `get_wallet_balance`, `get_recommendations`, `build_package`.
- Returns a grounded reply with real offer data.

**Rule-based fallback** (no API key, or on any LLM error):
- Maps keywords to categories via `KEYWORD_MAP` (e.g. `relax → wellness`, `gym → fitness`, `learn → learning`).
- Blends keyword matches with the employee's saved `interests`.
- Returns category suggestions and an optional package title.

### Personalised recommendations

`GET /ai/recommendations/me` scores all active offers for the employee using `get_ranked_offers`:

| Signal | Points |
|--------|--------|
| Offer category matches employee's interests | +3 |
| City = Tirana | +2 |
| Price ≤ remaining budget | +2 |
| Offer created recently | +1 |

Returns top-N offers with a human-readable `reason` string.

### Employer insights (web admin)

`POST /ai/employer-insights` aggregates the company's benefit data — no LLM needed:
- Top categories by spend
- Spend breakdown per category
- Approval rate
- Average request amount
- Total approved/pending amounts
- Average budget utilisation across all employees
- A generated insight sentence summarising the above
