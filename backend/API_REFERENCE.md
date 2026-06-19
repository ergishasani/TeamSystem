# Perka Backend — API & Architecture Reference

Complete reference for the FastAPI backend: data models, every API endpoint, business logic, and extension points. For setup commands see [`backend/README.md`](./README.md).

- **Base URL:** `http://localhost:8000`
- **API prefix:** `/api/v1`
- **Interactive docs:** `http://localhost:8000/docs` (Swagger) · `http://localhost:8000/redoc`
- **Health check:** `GET /health` → `{ "status": "ok", "app": "Perka API" }`

---

## 1. Tech Stack

| Concern | Choice |
|---------|--------|
| Language | Python 3.12 (Docker) / 3.11+ (local) |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Validation | Pydantic v2 + pydantic-settings |
| Auth | JWT (`python-jose`) + `passlib[bcrypt]` |
| Server | Uvicorn |

---

## 2. Directory Layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, router mount, /health
│   ├── core/
│   │   ├── config.py           # Settings from .env (pydantic-settings)
│   │   ├── database.py         # Engine, SessionLocal, Base, get_db()
│   │   ├── security.py         # hash/verify password, create/decode JWT
│   │   └── deps.py             # get_current_user + role guards
│   ├── models/                 # SQLAlchemy ORM models (15 tables)
│   ├── schemas/                # Pydantic v2 request/response models
│   ├── api/v1/
│   │   ├── router.py           # Aggregates all route modules under /api/v1
│   │   └── routes/             # One file per resource group
│   ├── services/               # Business logic (auth, approval, ai, insights,
│   │                           #   challenge, notification, recommendation)
│   └── seed/seed_demo.py       # Idempotent demo data seeder
├── alembic/                    # Migration environment + versions
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## 3. Configuration (`.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/perka_db` | SQLAlchemy connection string |
| `JWT_SECRET_KEY` | `change_me_to_a_long_random_secret` | HMAC signing key for JWT |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime (24h) |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost:8081` | Comma-separated allowed origins |
| `OPENAI_API_KEY` | `sk-...` | **Optional.** Enables the real OpenAI concierge. Unset → free rule-based fallback |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for the concierge (default `gpt-4o-mini`) |

---

## 4. Authentication & Roles

- **Scheme:** Bearer JWT. Send `Authorization: Bearer <token>` on every protected request.
- **Token subject (`sub`):** the user's integer `id` as a string.
- **Obtain a token:** `POST /api/v1/auth/login`.

### Role guards (`app/core/deps.py`)

| Dependency | Allows |
|------------|--------|
| `get_current_user` | Any authenticated user |
| `get_employee` | `role == employee` |
| `get_employer_admin` | `role == employer_admin` |
| `get_provider_admin` | `role == provider_admin` |
| `require_role(*roles)` | Any of the listed roles |

Roles: `employee`, `employer_admin`, `provider_admin`, `platform_admin`.

---

## 5. Data Models

All tables are defined in `app/models/`. Field lists below mirror the ORM models.

### User
| Field | Notes |
|-------|-------|
| id | PK |
| full_name | |
| email | unique |
| hashed_password | bcrypt |
| role | `employee` / `employer_admin` / `provider_admin` / `platform_admin` |
| company_id | FK → Company (nullable) |
| provider_id | FK → Provider (nullable) |
| language | default `sq` |
| country | default `AL` |
| currency | default `ALL` |
| created_at | |

### Company
`id, name, country, currency, monthly_budget_per_employee, approval_required_above, created_at`

### EmployeeProfile
`id, user_id (FK User), department, monthly_budget, used_amount, pending_amount, remaining_amount, interests (JSON list), benefit_style, level, xp, streak_count`

### Provider
`id, name, category, city, country, description, logo_url, rating, status, created_at`

### Offer
`id, provider_id (FK), title, description, category, price, currency, city, country, discount_percent, quantity_available, valid_until, is_limited_drop, image_url, status, created_at`

### Package
`id, title, description, total_price, currency, city, country, created_by (FK User), ai_reason, created_at`

### PackageItem
`id, package_id (FK), offer_id (FK), provider_id (FK), price_share`

### BenefitRequest
`id, employee_id (FK), company_id (FK), package_id, offer_id, request_type, total_amount, currency, status, ai_reason, submitted_at, approved_at, rejected_at, rejection_reason`
- `status`: `pending` → `approved` / `rejected` / `cancelled`
- `request_type`: `package` or `single_offer`

### Payment
`id, request_id (FK), provider_id (FK), amount, currency, status, created_at`
- `status`: `simulated_paid` (no real payments)

### Redemption
`id, request_id (FK), offer_id (FK), provider_id (FK), qr_code, status, redeemed_at, expires_at`
- `status`: `active` / `redeemed` / `expired`
- `qr_code` format: `PERKA-{request_id}-{offer_id}-{8HEX}`

### UserInteraction
`id, user_id (FK), offer_id (FK), action, created_at` — `action`: `view` / `save` / `click` / `request`

### SavedOffer
`id, user_id (FK), offer_id (FK), created_at` — unique on `(user_id, offer_id)`. Backs the persistent saved-offers list.

### Challenge
`id, title, description, type, category, goal, reward, starts_at, ends_at`
- `type`: `streak` / `spending` / `category`
- `category`: optional offer category the challenge targets (null = any category counts)

### ChallengeProgress
`id, challenge_id (FK), user_id (FK), progress, completed`

### Notification
`id, user_id (FK), message, type, read, created_at` — `type`: `request_approved` / `request_rejected` / `info`

---

## 6. API Endpoint Reference

Legend — **Auth:** 🔓 public · 👤 any user · 🧑‍💼 employee · 🏢 employer_admin · 🛠 provider_admin.
All paths are prefixed with `/api/v1`. Every endpoint below is **implemented**.

### Auth — `/auth`
| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | `/auth/register` | 🔓 | `full_name, email, password, role?, company_id?` | `UserOut` (201) |
| POST | `/auth/login` | 🔓 | `email, password` | `{ access_token, token_type }` |
| GET | `/auth/me` | 👤 | — | `UserOut` |

### Users — `/users`
| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| GET | `/users/me` | 👤 | — | `UserOut` |
| PATCH | `/users/me` | 👤 | `full_name?, language?` | `UserOut` |
| PATCH | `/users/me/interests` | 🧑‍💼 | `interests: string[]` | `TasteProfile` |
| GET | `/users/me/taste-profile` | 🧑‍💼 | — | `TasteProfile` |

### Wallet — `/wallet`
| Method | Path | Auth | Returns |
|--------|------|------|---------|
| GET | `/wallet/me` | 🧑‍💼 | `WalletOut` (budget, used, pending, remaining, level, xp, streak) |
| GET | `/wallet/me/history` | 🧑‍💼 | `BenefitRequest[]` |

### Offers — `/offers`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/offers` | 👤 | Query: `category, city, max_price, search, limit, offset` → `{ items, total }` |
| GET | `/offers/{offer_id}` | 👤 | Single offer (404 if missing) |
| POST | `/offers/{offer_id}/save` | 🧑‍💼 | Saves offer + logs interaction |
| DELETE | `/offers/{offer_id}/save` | 🧑‍💼 | Unsaves offer |
| GET | `/offers/users/me/saved-offers` | 🧑‍💼 | Saved offers list |

> Saved offers are persisted in the `saved_offers` table (unique per user/offer).

### Providers — `/providers`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/providers` | 👤 | Active providers |
| GET | `/providers/{provider_id}` | 👤 | Single provider |

### Packages — `/packages`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET | `/packages` | 👤 | — | All packages with items |
| GET | `/packages/{package_id}` | 👤 | — | Single package |
| POST | `/packages` | 🧑‍💼 | `title, offer_ids[], description?, ai_reason?` | Total price computed from offers |

### AI — `/ai`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/ai/concierge` | 🧑‍💼 | `message, budget?` | OpenAI tool-calling concierge when `OPENAI_API_KEY` is set, else rule-based. Reply + suggested categories/package |
| POST | `/ai/packages/generate` | 🧑‍💼 | `message, budget?` | Same engine as concierge |
| GET | `/ai/recommendations/me` | 🧑‍💼 | — | Personalized offer recommendations |
| POST | `/ai/employer-insights` | 🏢 | — | Real aggregation scoped to the caller's company (see §7) |

### Benefit Requests — `/benefit-requests`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/benefit-requests` | 🧑‍💼 | `package_id? \| offer_id?, request_type?, ai_reason?` | Reserves budget as pending. Auto-approved if `total ≤ Company.approval_required_above`, else `pending` |
| GET | `/benefit-requests/me` | 🧑‍💼 | — | My requests |
| GET | `/benefit-requests/{request_id}` | 🧑‍💼 | — | Single (own) request |
| PATCH | `/benefit-requests/{request_id}/cancel` | 🧑‍💼 | — | Only `pending`; releases reserved budget |

### Employer — `/employer`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET | `/employer/dashboard` | 🏢 | — | `{ total_requests, pending, approved }` |
| GET | `/employer/approvals` | 🏢 | — | Pending requests for the company |
| POST | `/employer/approvals/{request_id}/approve` | 🏢 | — | Runs approval flow (§7) |
| POST | `/employer/approvals/{request_id}/reject` | 🏢 | `rejection_reason?` | Releases pending budget |
| GET | `/employer/payments` | 🏢 | — | Payments for company requests |
| GET | `/employer/employees` | 🏢 | — | Company employees |

### Provider — `/provider`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET | `/provider/dashboard` | 🛠 | — | `{ total_offers, pending_redemptions }` |
| GET | `/provider/offers` | 🛠 | — | Provider's offers |
| POST | `/provider/offers` | 🛠 | `OfferCreate` | Creates offer for provider (validated) |
| PATCH | `/provider/offers/{offer_id}` | 🛠 | `OfferUpdate` (all optional) | Edit own offer (404 if not owned) |
| GET | `/provider/redemptions` | 🛠 | — | Provider's redemptions |
| POST | `/provider/redemptions/{redemption_id}/confirm` | 🛠 | — | Marks `redeemed` + advances challenge progress |
| GET | `/provider/payments` | 🛠 | — | Provider's payments |

### Redemptions — `/redemptions`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/redemptions/me` | 🧑‍💼 | My redemptions (with QR codes) |
| GET | `/redemptions/{redemption_id}` | 🧑‍💼 | Single (ownership-checked) |

### Challenges — `/challenges`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/challenges` | 🧑‍💼 | All challenges |
| GET | `/challenges/me/progress` | 🧑‍💼 | My progress rows |
| POST | `/challenges/{challenge_id}/join` | 🧑‍💼 | Join (idempotent) |

### Interactions — `/interactions`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/interactions` | 🧑‍💼 | `offer_id, action` | Logs an interaction |
| POST | `/interactions/search` | 🧑‍💼 | `query, category?` | Ranked + filtered offers |

### Notifications — `/notifications`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/notifications/me` | 👤 | Current user's notifications, newest first |
| PATCH | `/notifications/{notification_id}/read` | 👤 | Mark own notification read (404 if not owned) |

---

## 7. Business Logic

### Approval flow — `app/services/approval_service.py`
On `POST /employer/approvals/{id}/approve` (employer's own company only, request must be `pending`):
1. Set request `status = approved`, stamp `approved_at`.
2. Update employee budget: `used += total`, `pending -= total`, `remaining = monthly_budget - used`.
3. For each provider involved (every `PackageItem`, or the single offer) create a **`Payment`** with `status = simulated_paid`.
4. Create a **`Redemption`** per offer with a generated `qr_code` and `expires_at = now + 30 days`, `status = active`.
5. Create a **`Notification`** (`request_approved`) for the employee.

**Reject** sets `status = rejected`, stores `rejection_reason`, releases the reserved `pending_amount` back into `remaining_amount`, and creates a `request_rejected` **`Notification`**.

### Submit flow — `app/api/v1/routes/benefit_requests.py`
Computes `total_amount` from the package or offer, validates `remaining_amount >= total`, then moves that amount from `remaining` into `pending` and creates the request. **Auto-approval:** if the company sets `approval_required_above` and `total_amount ≤ threshold`, the request is approved immediately via the approval flow above; otherwise it stays `pending` for employer review.

### Challenge progress — `app/services/challenge_service.py`
On `POST /provider/redemptions/{id}/confirm`, `advance_challenges(db, user_id, offer)` runs for the redeeming employee: every active challenge whose `category` matches the offer (or is null) gets its progress row created/incremented (`spending` challenges by offer price, others by 1). Reaching `goal` marks it `completed` and adds the challenge `reward` to the employee's `xp`.

### Employer insights — `app/services/insights_service.py`
`employer_insights(db, company_id)` aggregates the company's `BenefitRequest`s into: `top_categories` + `category_spend` (from approved requests' offers/package items), `approval_rate`, `avg_spend`, `pending_total`/`approved_total`, `avg_budget_utilization` (across `EmployeeProfile`s), and a generated `insight` sentence.

### Notifications — `app/services/notification_service.py`
`create_notification(db, user_id, message, type)` adds an in-app `Notification` row (committed by the caller). Hooked into the approve/reject paths. Push delivery (Expo/FCM) is the future extension point.

### AI concierge — `app/services/ai_service.py` + `llm_concierge.py`
- `concierge(db, user, message, budget)` is the entry point. If `OPENAI_API_KEY` is set it runs the **OpenAI tool-calling** loop in `llm_concierge.py`; otherwise (or on any LLM error) it falls back to `rule_based_concierge`, so the endpoint never fails.
- **Tools** (all read-only, scoped to the calling employee): `search_offers(category?, max_price?, query?)`, `get_wallet_balance()`, `get_recommendations()`, `build_package(offer_ids, title?)`. The model picks which to call; the loop caps at `MAX_TOOL_ROUNDS = 5`. Categories searched and any built-package title are surfaced back through `ConciergeResponse`.
- `rule_based_concierge(message, interests, budget)` (fallback) maps keywords (`relax`, `weekend`, `learn`, `gym`, …) to categories via `KEYWORD_MAP`, blends them with the employee's interests, and returns `reply` + `suggested_categories` + optional `suggested_package_title`.
- `get_recommendations(db, user_id)` returns offers matching the employee's interests that fit their remaining budget, each with a `reason`.
- The response schemas (`ConciergeResponse`, `RecommendationsResponse`) are identical for both engines, so routes and the mobile app don't change.

### Recommendation scoring — `app/services/recommendation_service.py`
`get_ranked_offers` scores each active offer: category match (+3), city = Tirana (+2), within budget (+2), freshness (+1); returns top-N.

---

## 8. Seed Data (`python -m app.seed.seed_demo`)

Idempotent — skips if a company already exists.

| Entity | Seeded |
|--------|--------|
| Company | **TiranaTech** (budget 15,000 ALL/employee, approval above 10,000) |
| Employee | **Arta Hoxha** — `arta@tiranatech.al` / `password123` (interests: wellness, food, travel; level 2, 150 XP, 3-day streak) |
| Employer | **Elira Admin** — `admin@tiranatech.al` / `password123` |
| Providers | Tirana Wellness Club, FitZone Albania, Healthy Bowl Tirana, Bovilla Trips, AI Skills Academy, DentalCare Tirana |
| Offers | Spa Access Pass (3500), Pilates Class (2500), Healthy Dinner Voucher (1200), Bovilla Day Trip (5000), AI Tools Workshop (8000), Dental Checkup (3000) — all ALL / Tirana |
| Packages | **After Work Reset** (7200), **Weekend Explorer** (6200) |
| Challenges | Wellness Week (category `wellness`, goal 3), Explorer Streak (any category, goal 3) |

---

## 9. What to Build / Improve Next

The core backend is feature-complete. Done: persistent saved offers, auto-approval below threshold,
validated + editable provider offers, challenge progress automation, real employer insights,
in-app notifications on approval/rejection, and an **OpenAI tool-calling concierge** with a
rule-based fallback (all covered by the test suite).

Remaining / optional:

1. **Push delivery** — extend `notification_service.py` to send Expo/FCM push, not just in-app rows.
2. **Notification fan-out** — also notify employers when a new request needs approval.
3. **Conversation memory** — the concierge is currently single-turn; persist chat history for multi-turn context.

### First files to edit
| Goal | File |
|------|------|
| Add an endpoint | `app/api/v1/routes/<resource>.py` (+ register in `router.py`) |
| Change request/response shapes | `app/schemas/<resource>.py` |
| Change DB schema | `app/models/<model>.py` → `alembic revision --autogenerate` |
| Tune approval/payment logic | `app/services/approval_service.py` |
| Tune AI / recommendations | `app/services/ai_service.py`, `recommendation_service.py` |

---

## 10. Running

```bash
# Local
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.seed.seed_demo
uvicorn app.main:app --reload

# Docker (from repo root) — runs DB + migrations + seed + server
docker compose up -d --build
```

### New migration
```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```
