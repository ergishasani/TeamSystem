# Perka — Employee Benefits Marketplace

> Spotify-inspired benefits marketplace for Albanian companies.
> Employees browse, request, and redeem personalized benefits funded by their employer.

## Monorepo Structure

```
TeamSystem/
├── backend/     # Python FastAPI + PostgreSQL
└── mobile/      # Expo React Native (TypeScript)
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env           # Edit DATABASE_URL and JWT_SECRET_KEY
alembic upgrade head
python -m app.seed.seed_demo
uvicorn app.main:app --reload
```

API: http://localhost:8000 | Docs: http://localhost:8000/docs

### 2. Mobile App

```bash
cd mobile
npm install
cp .env.example .env           # Set EXPO_PUBLIC_API_URL
npx expo start
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Employee | arta@tiranatech.al | password123 |
| Employer | admin@tiranatech.al | password123 |

## Core Flow
1. Employee logs into mobile app
2. Browses offers or asks AI concierge for a package
3. Submits a benefit request
4. Employer approves via `POST /api/v1/employer/approvals/{id}/approve`
5. Backend creates simulated payments + QR redemption codes
6. Employee sees the QR code in the app

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Mobile | Expo, React Native, TypeScript |
| Routing | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios |
| Icons | lucide-react-native |

## What to Build Next
- Employer web dashboard (the API routes are ready)
- Real AI integration (swap `app/services/ai_service.py`)
- Push notifications for approval status
- QR code scanner for providers (`react-native-qrcode-svg`)
- Offer image upload for providers
