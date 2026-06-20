from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.user_interest import UserInterest

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

VALID_CATEGORIES = {
    "Fitness", "Wellness", "Food", "Travel", "Learning",
    "Health", "Beauty", "Family", "Technology", "Team Activities",
    "Entertainment", "Shopping",
}


class InterestsIn(BaseModel):
    interests: List[str]


class InterestOut(BaseModel):
    id: int
    category: str
    model_config = {"from_attributes": True}


@router.post("/interests", response_model=List[InterestOut])
def save_interests(
    body: InterestsIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(body.interests) != 5:
        raise HTTPException(status_code=400, detail="Exactly 5 interests required")
    invalid = [i for i in body.interests if i not in VALID_CATEGORIES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid categories: {invalid}")

    db.query(UserInterest).filter(UserInterest.user_id == current_user.id).delete()
    records = [UserInterest(user_id=current_user.id, category=c) for c in body.interests]
    db.add_all(records)
    db.commit()
    for r in records:
        db.refresh(r)
    return records


@router.get("/interests", response_model=List[InterestOut])
def get_interests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(UserInterest).filter(UserInterest.user_id == current_user.id).all()
