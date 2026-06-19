# Perka — Employee Benefits Marketplace

> Spotify-inspired benefits marketplace for Albanian companies.
> Employees browse, request, and redeem personalized benefits funded by their employer.

Perka gives employees a company-funded benefit budget. They browse personalized offers, ask an AI concierge for a package, submit a benefit request, and — once the employer approves — the backend simulates payments to providers and issues QR redemption codes. Currency is **ALL**, default city **Tirana**, payments are **simulated only**.

---

## Monorepo Structure

```
TeamSystem/
├── backend/              # Python FastAPI + PostgreSQL
│   ├── API_REFERENCE.md  # ← Full backend reference (models, endpoints, logic)
│   └── README.md         # Backend setup
├── mobile/               # Expo React Native (TypeScript)
│   ├── APP_REFERENCE.md  # ← Full mobile reference (screens, components, api)
│   └── README.md         # Mobile setup
├── docker-compose.yml    # Postgres + backend (migrations + seed + server)
└── README.md             # You are here
```

### Documentation map
| Doc | What's inside |
|-----|---------------|
| [`backend/API_REFERENCE.md`](./backend/API_REFERENCE.md) | Every data model, every API endpoint (grouped), business logic, AI/recommendation logic, seed data, extension points |
| [`mobile/APP_REFERENCE.md`](./mobile/APP_REFERENCE.md) | Every screen/page, components, types, API client modules, auth store, theme, what to build next |
| [`backend/README.md`](./backend/README.md) | Backend quick-start commands |
| [`mobile/README.md`](./mobile/README.md) | Mobile quick-start commands |

---

## Quick Start

### Option A — Docker (recommended for the backend)

Runs PostgreSQL **and** the API, applying migrations + seed automatically. Uses Python 3.12 inside the container (no local Python version conflicts).

```bash
docker compose up -d --build
```

- API: http://localhost:8000  ·  Docs: http://localhost:8000/docs
- Stop: `docker compose down`  (add `-v` to also wipe the database)

Then start the mobile app:

```bash
cd mobile
npm install
copy .env.example .env        # Windows  (cp on Mac/Linux)
npx expo start
```

### Option B — Local backend (no Docker)

Requires a local PostgreSQL with a `perka_db` database.

```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows  (source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
copy .env.example .env          # Edit DATABASE_URL and JWT_SECRET_KEY
alembic upgrade head
python -m app.seed.seed_demo
uvicorn app.main:app --reload
```

---

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Employee | arta@tiranatech.al | password123 |
| Employer | admin@tiranatech.al | password123 |

---

## Core Demo Flow
1. Employee logs into the mobile app and sees their wallet balance.
2. Browses offers, or asks the AI concierge for a package.
3. Submits a benefit request (budget moves to *pending*).
4. Employer approves via `POST /api/v1/employer/approvals/{id}/approve`.
5. Backend deducts budget, creates **simulated payments** to providers, and issues **QR redemption codes**.
6. Employee sees the approved benefit + QR code in the app.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose) + passlib/bcrypt |
| Mobile | Expo, React Native, TypeScript |
| Routing | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios |
| Icons | lucide-react-native |
| Infra | Docker Compose |

---

## Build Status

The foundation is complete and runnable end-to-end.

**Backend** — all 13 models, JWT auth + role guards, and ~45 endpoints across auth, users, wallet, offers, providers, packages, AI, benefit-requests, employer, provider, redemptions, challenges, and interactions. Approval flow creates simulated payments + QR redemptions. Rule-based AI + recommendation services. Idempotent Tirana seed data.

**Mobile** — auth gate, 12 screens (welcome/login/register, 5 tabs, 4 detail screens), 12 reusable components, full typed Axios client, and Zustand auth store with secure token storage.

### Known stubs / next steps
- Saved offers are stored in-memory (see `backend/API_REFERENCE.md` §9).
- `POST /ai/employer-insights` returns canned data.
- `approval_required_above` threshold is stored but not yet used for auto-approval.
- Real AI/LLM, QR scanner, and package-builder UI are not yet implemented.

See the §"What to Build Next" sections in each reference doc for the full list and the exact files to edit first.
