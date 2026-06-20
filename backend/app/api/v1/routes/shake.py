import random
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.shake import ShakeCredit, ShakeAttempt

router = APIRouter(prefix="/shake", tags=["shake"])

DAILY_LIMIT = 3
CREDIT_COST = 1

PRIZES = [
    {"type": "xp", "description": "10 XP bonus", "weight": 500, "xp": 10, "win": False},
    {"type": "xp", "description": "25 XP bonus", "weight": 300, "xp": 25, "win": False},
    {"type": "badge", "description": "Lucky badge earned", "weight": 150, "xp": 5, "win": False},
    {"type": "discount", "description": "5% discount on next offer", "weight": 40, "xp": 0, "win": False},
    {"type": "voucher", "description": "Free coffee voucher", "weight": 9, "xp": 50, "win": True},
    {"type": "credit", "description": "1 extra benefit credit", "weight": 1, "xp": 100, "win": True},
]


def _pick_prize():
    pool = []
    for p in PRIZES:
        pool.extend([p] * p["weight"])
    return random.choice(pool)


def _get_or_create_credits(user_id: int, db: Session) -> ShakeCredit:
    sc = db.query(ShakeCredit).filter(ShakeCredit.user_id == user_id).first()
    if not sc:
        sc = ShakeCredit(user_id=user_id, credits=5)
        db.add(sc)
        db.commit()
        db.refresh(sc)
    return sc


class ShakeStatusOut(BaseModel):
    credits: int
    tries_today: int
    tries_remaining: int


class ShakeResultOut(BaseModel):
    won: bool
    prize_type: str
    prize_description: str
    xp_earned: int
    credits_remaining: int
    tries_remaining: int


@router.get("/status", response_model=ShakeStatusOut)
def shake_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sc = _get_or_create_credits(current_user.id, db)
    today = date.today()
    tries_today = db.query(ShakeAttempt).filter(
        ShakeAttempt.user_id == current_user.id,
        ShakeAttempt.attempt_date == today,
    ).count()
    return ShakeStatusOut(
        credits=sc.credits,
        tries_today=tries_today,
        tries_remaining=max(0, DAILY_LIMIT - tries_today),
    )


@router.post("/play", response_model=ShakeResultOut)
def play_shake(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sc = _get_or_create_credits(current_user.id, db)
    if sc.credits < CREDIT_COST:
        raise HTTPException(status_code=400, detail="Not enough credits")

    today = date.today()
    tries_today = db.query(ShakeAttempt).filter(
        ShakeAttempt.user_id == current_user.id,
        ShakeAttempt.attempt_date == today,
    ).count()
    if tries_today >= DAILY_LIMIT:
        raise HTTPException(status_code=400, detail="Daily limit reached (3 tries per day)")

    prize = _pick_prize()
    sc.credits -= CREDIT_COST
    sc.updated_at = datetime.now(timezone.utc)

    attempt = ShakeAttempt(
        user_id=current_user.id,
        attempt_date=today,
        won=prize["win"],
        prize_type=prize["type"],
        prize_description=prize["description"],
        xp_earned=prize["xp"],
    )
    db.add(attempt)
    db.commit()
    db.refresh(sc)

    new_tries = tries_today + 1
    return ShakeResultOut(
        won=prize["win"],
        prize_type=prize["type"],
        prize_description=prize["description"],
        xp_earned=prize["xp"],
        credits_remaining=sc.credits,
        tries_remaining=max(0, DAILY_LIMIT - new_tries),
    )
