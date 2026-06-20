from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

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
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.language is not None:
        current_user.language = data.language
    if data.phone is not None:
        current_user.phone = data.phone
    if data.address is not None:
        current_user.address = data.address
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
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


class ColleagueOut(BaseModel):
    id: int
    full_name: str
    email: str
    department: Optional[str] = None
    model_config = {"from_attributes": True}


@router.get("/colleagues", response_model=List[ColleagueOut])
def get_colleagues(
    q: Optional[str] = Query(default=None),
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    query = (
        db.query(User, EmployeeProfile)
        .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.id)
        .filter(
            User.company_id == current_user.company_id,
            User.id != current_user.id,
            User.role == "employee",
        )
    )
    if q:
        query = query.filter(User.full_name.ilike(f"%{q}%"))
    rows = query.order_by(User.full_name).all()
    return [
        ColleagueOut(id=u.id, full_name=u.full_name, email=u.email, department=p.department if p else None)
        for u, p in rows
    ]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    full_name: str
    department: Optional[str]
    xp: int
    is_me: bool


class MyStats(BaseModel):
    xp: int
    level: int
    streak_count: int
    rank: Optional[int]
    redemption_count: int


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(User, EmployeeProfile)
        .join(EmployeeProfile, EmployeeProfile.user_id == User.id)
        .filter(User.company_id == current_user.company_id, User.role == "employee")
        .order_by(EmployeeProfile.xp.desc())
        .limit(20)
        .all()
    )
    result = []
    for rank, (user, profile) in enumerate(rows, start=1):
        result.append(LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            full_name=user.full_name,
            department=profile.department,
            xp=int(profile.xp or 0),
            is_me=user.id == current_user.id,
        ))
    return result


@router.get("/me/stats", response_model=MyStats)
def get_my_stats(
    current_user: User = Depends(get_employee),
    db: Session = Depends(get_db),
):
    from app.models.redemption import Redemption
    from app.models.request import BenefitRequest
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    redemption_count = (
        db.query(Redemption)
        .join(BenefitRequest, BenefitRequest.id == Redemption.request_id)
        .filter(BenefitRequest.employee_id == current_user.id)
        .count()
    )

    # Compute rank
    all_xp = (
        db.query(EmployeeProfile.xp)
        .join(User, User.id == EmployeeProfile.user_id)
        .filter(User.company_id == current_user.company_id, User.role == "employee")
        .all()
    )
    my_xp = int(profile.xp or 0) if profile else 0
    rank = sum(1 for (x,) in all_xp if (x or 0) > my_xp) + 1

    return MyStats(
        xp=my_xp,
        level=profile.level if profile else 1,
        streak_count=profile.streak_count if profile else 0,
        rank=rank,
        redemption_count=redemption_count,
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
