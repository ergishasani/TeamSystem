# Perka Backend — FastAPI

## Requirements
- Python 3.11+
- PostgreSQL running locally

## Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Mac/Linux
venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file and fill in your values
cp .env.example .env

# Run database migrations
alembic upgrade head

# Seed demo data (Tirana companies, users, providers, offers)
python -m app.seed.seed_demo

# Start the dev server
uvicorn app.main:app --reload
```

The API will be running at **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Employee | arta@tiranatech.al | password123 |
| Employer Admin | admin@tiranatech.al | password123 |

## Project Structure
```
app/
  core/           # Config, database, security, deps
  models/         # SQLAlchemy ORM models
  schemas/        # Pydantic v2 request/response schemas
  api/v1/routes/  # FastAPI route handlers
  services/       # Business logic (auth, AI, approval)
  seed/           # Demo data seeding script
alembic/          # Database migrations
```

## Key Endpoints
- `POST /api/v1/auth/login` — Get JWT token
- `GET /api/v1/wallet/me` — Employee wallet balance
- `GET /api/v1/offers` — Browse offers (filterable)
- `POST /api/v1/ai/concierge` — AI chat for benefit recommendations
- `POST /api/v1/benefit-requests` — Submit a request
- `POST /api/v1/employer/approvals/{id}/approve` — Employer approval

## AI Service
The AI is rule-based for demo purposes. To upgrade to a real LLM (OpenAI etc.),
replace the logic in `app/services/ai_service.py` — the interface is already structured for it.

## Creating a New Migration
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```
