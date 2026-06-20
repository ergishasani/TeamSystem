# Perka Webapp — Admin Management Portal

React + TypeScript web dashboard for **employer admins** and **provider admins**. Connects to the same FastAPI backend as the mobile app.

- **Employer admin** — approve/reject benefit requests, view employees, review payments, run AI insights
- **Provider admin** — manage offers (create/edit), confirm QR redemptions, view payments received

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|-----------------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | comes with Node |
| Docker + Docker Compose | any recent | for running the backend |

---

## Quick start (recommended)

```bash
# 1. Start the backend + database from the repo root
docker compose up -d --build

# 2. Move into the webapp directory
cd webapp

# 3. Copy the env file (defaults work out of the box for local dev)
cp .env.example .env

# 4. Install dependencies
npm install

# 5. Start the dev server
npm run dev
# → http://localhost:3001
```

Open [http://localhost:3001](http://localhost:3001) and log in with one of the demo accounts below.

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Employer admin | `admin@tiranatech.al` | `password123` |
| Provider admin | *(seed a provider_admin user via the backend)* | — |

> The seed script (`python -m app.seed.seed_demo`) creates the employer admin automatically.
> Docker Compose runs it on every start.

---

## Manual backend setup (without Docker)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy and edit the env file
copy .env.example .env   # Windows
cp .env.example .env     # macOS / Linux

# Run DB migrations and seed demo data
alembic upgrade head
python -m app.seed.seed_demo

# Start the API server
uvicorn app.main:app --reload
# → http://localhost:8000
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Backend API base URL. The Vite proxy rewrites `/api/*` → `http://localhost:8000/api/*` automatically in dev, so this is only needed when pointing at a remote or non-standard backend. |

Copy `.env.example` to `.env` and edit as needed. All `VITE_*` vars are embedded at build time — **do not put secrets here**.

---

## Available scripts

```bash
npm run dev       # start dev server with hot reload on :3001
npm run build     # type-check + production build → dist/
npm run preview   # serve the production build locally
```

---

## Project structure

```
webapp/
├── .env.example          ← copy to .env
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js    ← custom color tokens (app-bg, app-accent, …)
├── tsconfig.json
├── vite.config.ts        ← dev server :3001, /api proxy to :8000
└── src/
    ├── main.tsx           entry point
    ├── App.tsx            router + role-based route guards
    ├── index.css          Tailwind directives + .form-input utility
    ├── types/
    │   └── index.ts       shared TypeScript types (mirrors mobile/types)
    ├── lib/
    │   └── api.ts         Axios client + all API call functions
    ├── store/
    │   └── authStore.ts   Zustand auth state (JWT in localStorage)
    ├── components/
    │   ├── Layout.tsx      sidebar + <Outlet /> wrapper
    │   ├── Sidebar.tsx     role-aware nav links + user info + logout
    │   ├── StatCard.tsx    metric card with icon
    │   ├── Badge.tsx       status pill + statusBadge() helper
    │   └── LoadingSpinner.tsx
    └── pages/
        ├── LoginPage.tsx
        ├── employer/
        │   ├── DashboardPage.tsx
        │   ├── ApprovalsPage.tsx
        │   ├── EmployeesPage.tsx
        │   ├── PaymentsPage.tsx
        │   └── InsightsPage.tsx
        └── provider/
            ├── DashboardPage.tsx
            ├── OffersPage.tsx
            ├── RedemptionsPage.tsx
            └── PaymentsPage.tsx
```

---

## Architecture notes

### Auth flow
1. User submits credentials on `/login`.
2. `POST /auth/login` returns a JWT.
3. Token is stored in `localStorage` under `perka_token`.
4. Every Axios request attaches it as `Authorization: Bearer <token>`.
5. A 401 response clears the token and redirects to `/login`.
6. On app load, if a token exists, `GET /auth/me` fetches the user to restore state.

### Role routing
- `employer_admin` → redirected to `/employer` after login
- `provider_admin` → redirected to `/provider` after login
- Any other role (employee) → redirected back to `/login`

### Vite proxy
The dev server proxies all `/api/*` requests to `http://localhost:8000`, so no CORS issues during development. For production, point `VITE_API_URL` at the deployed backend and ensure its `BACKEND_CORS_ORIGINS` includes your frontend origin.

### Styling
Tailwind CSS with custom tokens in `tailwind.config.js`:

| Token | Value | Usage |
|-------|-------|-------|
| `app-bg` | `#111111` | page background |
| `app-surface` | `#1a1a1a` | sidebar, input backgrounds |
| `app-card` | `#1e1e1e` | card / panel backgrounds |
| `app-border` | `#2a2a2a` | all borders |
| `app-accent` | `#22c55e` | primary green (buttons, highlights) |
| `app-accent-dark` | `#16a34a` | hover state for accent |
| `app-accent-dim` | `#1a3a25` | dimmed accent background |
| `app-muted` | `#a1a1aa` | secondary text, labels |
| `app-danger` | `#ef4444` | error / reject actions |
| `app-warning` | `#f59e0b` | warning badges |

---

## CORS

The backend's `BACKEND_CORS_ORIGINS` must include the webapp origin. The `docker-compose.yml` already includes `http://localhost:3001`. For a manually started backend, add it to `backend/.env`:

```
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8081
```
