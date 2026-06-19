from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.user import User
from app.models.employee_profile import EmployeeProfile
from app.models.request import BenefitRequest
from app.schemas.wallet import WalletOut, WalletHistoryItem

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/me", response_model=WalletOut)
def get_wallet(current_user: User = Depends(get_employee), db: Session = Depends(get_db)):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        return WalletOut(
            monthly_budget=0, used_amount=0, pending_amount=0, remaining_amount=0,
            currency=current_user.currency, level=1, xp=0, streak_count=0,
        )
    return WalletOut(
        monthly_budget=float(profile.monthly_budget),
        used_amount=float(profile.used_amount),
        pending_amount=float(profile.pending_amount),
        remaining_amount=float(profile.remaining_amount),
        currency=current_user.currency,
        level=profile.level,
        xp=profile.xp,
        streak_count=profile.streak_count,
    )


@router.get("/me/history", response_model=List[WalletHistoryItem])
def get_wallet_history(current_user: User = Depends(get_employee), db: Session = Depends(get_db)):
    requests = (
        db.query(BenefitRequest)
        .filter(BenefitRequest.employee_id == current_user.id)
        .order_by(BenefitRequest.submitted_at.desc())
        .all()
    )
    return requests
