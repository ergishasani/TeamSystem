from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.challenge import Challenge, ChallengeProgress
from app.schemas.challenge import ChallengeWithProgressOut

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=List[ChallengeWithProgressOut])
def list_challenges(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return _list_with_progress(current_user.id, db)


@router.get("/me", response_model=List[ChallengeWithProgressOut])
def my_challenges(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return _list_with_progress(current_user.id, db)


def _list_with_progress(user_id: int, db: Session) -> List[ChallengeWithProgressOut]:
    challenges = db.query(Challenge).all()
    progress_map: dict[int, ChallengeProgress] = {
        p.challenge_id: p
        for p in db.query(ChallengeProgress).filter(ChallengeProgress.user_id == user_id).all()
    }
    result = []
    for c in challenges:
        cp = progress_map.get(c.id)
        result.append(ChallengeWithProgressOut(
            id=c.id,
            title=c.title,
            description=c.description,
            type=c.type,
            goal=float(c.goal) if c.goal is not None else None,
            reward=c.reward,
            progress=float(cp.progress) if cp else 0.0,
            completed=cp.completed if cp else False,
        ))
    return result


@router.get("/me/progress")
def my_progress(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return (
        db.query(ChallengeProgress)
        .filter(ChallengeProgress.user_id == current_user.id)
        .all()
    )


@router.post("/{challenge_id}/join", status_code=201)
def join_challenge(challenge_id: int, current_user=Depends(get_employee), db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    existing = db.query(ChallengeProgress).filter(
        ChallengeProgress.challenge_id == challenge_id,
        ChallengeProgress.user_id == current_user.id,
    ).first()
    if existing:
        return {"message": "Already joined", "progress": existing}
    progress = ChallengeProgress(challenge_id=challenge_id, user_id=current_user.id)
    db.add(progress)
    db.commit()
    return {"message": "Joined challenge"}


@router.post("/{challenge_id}/progress", response_model=ChallengeWithProgressOut)
def update_progress(
    challenge_id: int,
    amount: float = 1.0,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    cp = db.query(ChallengeProgress).filter(
        ChallengeProgress.challenge_id == challenge_id,
        ChallengeProgress.user_id == current_user.id,
    ).first()
    if not cp:
        cp = ChallengeProgress(challenge_id=challenge_id, user_id=current_user.id, progress=0)
        db.add(cp)
    cp.progress = float(cp.progress) + amount
    if challenge.goal and float(cp.progress) >= float(challenge.goal):
        cp.completed = True
    db.commit()
    db.refresh(cp)
    return ChallengeWithProgressOut(
        id=challenge.id, title=challenge.title, description=challenge.description,
        type=challenge.type, goal=float(challenge.goal) if challenge.goal else None,
        reward=challenge.reward, progress=float(cp.progress), completed=cp.completed,
    )
