from typing import List
from sqlalchemy.orm import Session

from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile


def get_ranked_offers(db: Session, user_id: int, limit: int = 10) -> List[Offer]:
    """
    Simple scoring: category match (3pts) + city match (2pts) + budget fit (2pts) + freshness (1pt)
    """
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user_id).first()
    interests = profile.interests if profile and profile.interests else []
    budget = float(profile.remaining_amount) if profile else 99999

    offers = db.query(Offer).filter(Offer.status == "active").all()

    def score(offer: Offer) -> int:
        s = 0
        if offer.category in interests:
            s += 3
        if offer.city == "Tirana":
            s += 2
        if float(offer.price) <= budget:
            s += 2
        s += 1  # freshness bonus for all (could rank by created_at)
        return s

    ranked = sorted(offers, key=score, reverse=True)
    return ranked[:limit]
