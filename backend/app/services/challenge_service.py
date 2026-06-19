"""
Advances challenge progress when an employee redeems a benefit.

Matching rule (intentionally simple, swap for richer logic later):
- A challenge applies if it is currently active and either targets the redeemed
  offer's category (`Challenge.category`) or targets any category (null).
- `spending` challenges advance by the offer price; others advance by 1.
- When progress reaches the goal, the challenge is completed and its XP reward
  is added to the employee's profile.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.challenge import Challenge, ChallengeProgress
from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile


def _is_active(challenge: Challenge, now: datetime) -> bool:
    try:
        if challenge.starts_at and challenge.starts_at > now:
            return False
        if challenge.ends_at and challenge.ends_at < now:
            return False
    except TypeError:
        # Naive vs aware datetimes (e.g. SQLite) — treat as active.
        return True
    return True


def advance_challenges(db: Session, user_id: int, offer: Offer | None) -> None:
    now = datetime.now(timezone.utc)
    challenges = db.query(Challenge).all()

    for challenge in challenges:
        if not _is_active(challenge, now):
            continue
        if challenge.category and offer and challenge.category != offer.category:
            continue

        progress = (
            db.query(ChallengeProgress)
            .filter(
                ChallengeProgress.challenge_id == challenge.id,
                ChallengeProgress.user_id == user_id,
            )
            .first()
        )
        if not progress:
            progress = ChallengeProgress(
                challenge_id=challenge.id, user_id=user_id, progress=0, completed=False
            )
            db.add(progress)
            db.flush()
        if progress.completed:
            continue

        increment = float(offer.price) if (challenge.type == "spending" and offer) else 1
        progress.progress = float(progress.progress or 0) + increment

        if challenge.goal is not None and float(progress.progress) >= float(challenge.goal):
            progress.completed = True
            profile = (
                db.query(EmployeeProfile)
                .filter(EmployeeProfile.user_id == user_id)
                .first()
            )
            if profile:
                profile.xp = (profile.xp or 0) + (challenge.reward or 0)
