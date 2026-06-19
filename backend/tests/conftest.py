"""
Shared pytest fixtures.

Tests run against an in-memory SQLite database (no PostgreSQL needed),
with the FastAPI `get_db` dependency overridden to use that database.
Environment variables required by app.core.config are set here BEFORE
any application module is imported.
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Importing app.models registers every table on Base.metadata
import app.models  # noqa: F401
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.company import Company
from app.models.user import User
from app.models.employee_profile import EmployeeProfile
from app.models.provider import Provider
from app.models.offer import Offer

# Single shared in-memory connection for the whole test (StaticPool),
# so the app session and the fixture session see the same data.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _fresh_db():
    """Create a clean schema for every test, drop it afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


# ─── Seeding helpers ────────────────────────────────────────────────────────

PASSWORD = "password123"


@pytest.fixture
def company(db):
    # approval_required_above=None → every request needs manual employer approval.
    # The auto-approval path is exercised explicitly in test_auto_approval_below_threshold.
    c = Company(name="TiranaTech", country="AL", currency="ALL",
                monthly_budget_per_employee=15000, approval_required_above=None)
    db.add(c)
    db.commit()
    return c


@pytest.fixture
def employee(db, company):
    user = User(
        full_name="Arta Hoxha", email="arta@tiranatech.al",
        hashed_password=hash_password(PASSWORD), role="employee",
        company_id=company.id, language="sq", country="AL", currency="ALL",
    )
    db.add(user)
    db.flush()
    db.add(EmployeeProfile(
        user_id=user.id, department="Engineering", monthly_budget=15000,
        used_amount=0, pending_amount=0, remaining_amount=15000,
        interests=["wellness", "food", "travel"], benefit_style="Explorer",
        level=2, xp=150, streak_count=3,
    ))
    db.commit()
    return user


@pytest.fixture
def employer(db, company):
    user = User(
        full_name="Elira Admin", email="admin@tiranatech.al",
        hashed_password=hash_password(PASSWORD), role="employer_admin",
        company_id=company.id, language="sq", country="AL", currency="ALL",
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def provider(db):
    p = Provider(name="Tirana Wellness Club", category="wellness", city="Tirana",
                 country="AL", description="Spa", rating=4.5, status="active")
    db.add(p)
    db.commit()
    return p


@pytest.fixture
def offer(db, provider):
    o = Offer(
        provider_id=provider.id, title="Spa Access Pass", description="Full day spa",
        category="wellness", price=3500, currency="ALL", city="Tirana", country="AL",
        discount_percent=0, is_limited_drop=False, status="active",
    )
    db.add(o)
    db.commit()
    return o


@pytest.fixture
def auth(client):
    """Return a function that logs in and yields Authorization headers."""
    def _login(email: str, password: str = PASSWORD) -> dict:
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
        return {"Authorization": f"Bearer {res.json()['access_token']}"}
    return _login
