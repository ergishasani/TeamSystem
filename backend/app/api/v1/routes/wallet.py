from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

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


class TopUpBody(BaseModel):
    amount: float


@router.post("/me/topup", response_model=WalletOut)
def top_up_wallet(
    body: TopUpBody,
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")
    if body.amount > 500_000:
        raise HTTPException(status_code=400, detail="Maximum top-up is 500,000 ALL.")

    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    profile.monthly_budget = float(profile.monthly_budget) + body.amount
    profile.remaining_amount = float(profile.remaining_amount) + body.amount
    db.commit()
    db.refresh(profile)

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


class TransferBody(BaseModel):
    to_email: str
    amount: float


class TransferOut(BaseModel):
    message: str
    to_name: str
    amount: float
    currency: str


@router.post("/me/transfer", response_model=TransferOut)
def transfer_budget(
    body: TransferBody,
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")

    sender = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Your wallet was not found.")
    if float(sender.remaining_amount) < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")

    recipient_user = db.query(User).filter(User.email == body.to_email.lower().strip()).first()
    if not recipient_user:
        raise HTTPException(status_code=404, detail="No user found with that email.")
    if recipient_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot transfer to yourself.")

    recipient = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == recipient_user.id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient has no wallet.")

    sender.remaining_amount = float(sender.remaining_amount) - body.amount
    sender.used_amount = float(sender.used_amount) + body.amount
    recipient.remaining_amount = float(recipient.remaining_amount) + body.amount
    recipient.monthly_budget = float(recipient.monthly_budget) + body.amount
    db.commit()

    return TransferOut(
        message="Transfer successful.",
        to_name=recipient_user.full_name,
        amount=body.amount,
        currency=current_user.currency,
    )
