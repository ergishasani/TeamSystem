from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.company import Company
from app.models.employee_profile import EmployeeProfile
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password, verify_password, create_access_token


def register_user(db: Session, data: RegisterRequest) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        company_id=data.company_id,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    if data.role == "employee" and data.company_id:
        company = db.query(Company).filter(Company.id == data.company_id).first()
        budget = float(company.monthly_budget_per_employee) if company else 0
        profile = EmployeeProfile(
            user_id=user.id,
            monthly_budget=budget,
            remaining_amount=budget,
        )
        db.add(profile)

    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, email: str, password: str) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    user.last_active_at = datetime.now(timezone.utc)
    db.commit()
    return create_access_token(subject=str(user.id))
