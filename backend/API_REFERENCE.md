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
│   ├── models/                 # SQLAlchemy ORM models (13 tables)
│   ├── schemas/                # Pydantic v2 request/response models
│   ├── api/v1/
│   │   ├── router.py           # Aggregates all route modules under /api/v1
│   │   └── routes/             # One file per resource group
│   ├── services/               # Business logic (auth, approval, ai, recommendation)
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

### Challenge
`id, title, description, type, goal, reward, starts_at, ends_at`

### ChallengeProgress
`id, challenge_id (FK), user_id (FK), progress, completed`

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

> ⚠️ Saved offers are stored **in-memory** (`_saved_offers` dict). Move to a DB table for persistence — see §9.

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
| POST | `/ai/concierge` | 🧑‍💼 | `message, budget?` | Rule-based reply + suggested categories/package |
| POST | `/ai/packages/generate` | 🧑‍💼 | `message, budget?` | Same engine as concierge |
| GET | `/ai/recommendations/me` | 🧑‍💼 | — | Personalized offer recommendations |
| POST | `/ai/employer-insights` | 👤 | `EmployerInsightRequest` | **Stub** — returns canned analytics |

### Benefit Requests — `/benefit-requests`
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/benefit-requests` | 🧑‍💼 | `package_id? \| offer_id?, request_type?, ai_reason?` | Reserves budget as pending; status `pending` |
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
| POST | `/provider/offers` | 🛠 | offer fields (dict) | Creates offer for provider |
| GET | `/provider/redemptions` | 🛠 | — | Provider's redemptions |
| POST | `/provider/redemptions/{redemption_id}/confirm` | 🛠 | — | Marks `redeemed` |
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

---

## 7. Business Logic

### Approval flow — `app/services/approval_service.py`
On `POST /employer/approvals/{id}/approve` (employer's own company only, request must be `pending`):
1. Set request `status = approved`, stamp `approved_at`.
2. Update employee budget: `used += total`, `pending -= total`, `remaining = monthly_budget - used`.
3. For each provider involved (every `PackageItem`, or the single offer) create a **`Payment`** with `status = simulated_paid`.
4. Create a **`Redemption`** per offer with a generated `qr_code` and `expires_at = now + 30 days`, `status = active`.

**Reject** sets `status = rejected`, stores `rejection_reason`, and releases the reserved `pending_amount`.

### Submit flow — `app/api/v1/routes/benefit_requests.py`
Computes `total_amount` from the package or offer, validates `remaining_amount >= total`, then moves that amount from `remaining` into `pending` and creates the request as `pending`.

### AI (rule-based) — `app/services/ai_service.py`
- `rule_based_concierge(message, interests, budget)` maps keywords (`relax`, `weekend`, `learn`, `gym`, …) to categories via `KEYWORD_MAP`, blends them with the employee's interests, and returns a human-like `reply`, `suggested_categories`, and an optional `suggested_package_title`.
- `get_recommendations(db, user_id)` returns offers matching the employee's interests that fit their remaining budget, each with a `reason`.
- **Swap point:** replace the function bodies with an LLM call (e.g. OpenAI) — the response schemas (`ConciergeResponse`, `RecommendationsResponse`) stay the same.

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
| Challenges | Wellness Week, Explorer Streak |

---

## 9. What to Build / Improve Next

1. **Persist saved offers** — replace the in-memory `_saved_offers` dict in `routes/offers.py` with a `SavedOffer` table (or reuse `UserInteraction`).
2. **Real AI** — implement an LLM call inside `services/ai_service.py` (keep the schemas).
3. **`approval_required_above` logic** — auto-approve requests below the threshold instead of always requiring approval.
4. **Provider offer validation** — `POST /provider/offers` takes a raw dict; add a Pydantic `OfferCreate` schema.
5. **Challenge progress automation** — increment `ChallengeProgress.progress` when relevant benefits are redeemed.
6. **Employer insights** — replace the stub in `routes/ai.py` with real aggregation queries.
7. **Notifications** — push updates on approval/rejection.

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
