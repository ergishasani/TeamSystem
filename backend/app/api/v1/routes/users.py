from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_employee
from app.models.user import User
from app.models.employee_profile import EmployeeProfile
from app.schemas.user import UserOut, UserUpdate, InterestsUpdate, TasteProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.language:
        current_user.language = data.language
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/interests", response_model=TasteProfile)
def update_interests(
    data: InterestsUpdate,
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)
    profile.interests = data.interests
    db.commit()
    db.refresh(profile)
    return TasteProfile(
        interests=profile.interests or [],
        benefit_style=profile.benefit_style,
        level=profile.level,
        xp=profile.xp,
        streak_count=profile.streak_count,
    )


@router.get("/me/taste-profile", response_model=TasteProfile)
def get_taste_profile(
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        return TasteProfile(interests=[], benefit_style=None, level=1, xp=0, streak_count=0)
    return TasteProfile(
        interests=profile.interests or [],
        benefit_style=profile.benefit_style,
        level=profile.level,
        xp=profile.xp,
        streak_count=profile.streak_count,
    )
