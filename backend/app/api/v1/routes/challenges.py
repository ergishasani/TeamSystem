from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.challenge import Challenge, ChallengeProgress

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("")
def list_challenges(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return db.query(Challenge).all()


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
