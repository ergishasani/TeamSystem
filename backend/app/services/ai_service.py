"""
AI concierge service.

`concierge()` uses the OpenAI tool-calling engine when OPENAI_API_KEY is set,
and transparently falls back to the rule-based engine otherwise (or on any LLM
error). The rule-based functions are kept as that fallback and for offline use.
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import ConciergeResponse, RecommendedOffer, RecommendationsResponse

logger = logging.getLogger(__name__)


KEYWORD_MAP = {
    "relax": ["wellness", "food"],
    "stress": ["wellness", "fitness"],
    "weekend": ["travel", "food"],
    "trip": ["travel"],
    "learn": ["learning"],
    "skill": ["learning"],
    "book": ["learning"],
    "gym": ["fitness"],
    "fitness": ["fitness"],
    "food": ["food"],
    "eat": ["food"],
    "dental": ["health"],
    "health": ["health", "wellness"],
    "spa": ["wellness"],
}

STYLE_NAMES = {
    "wellness": "Wellness Seeker",
    "fitness": "Active Achiever",
    "food": "Foodie",
    "travel": "Explorer",
    "learning": "Lifelong Learner",
    "health": "Health Champion",
}


def _detect_categories(message: str) -> List[str]:
    message_lower = message.lower()
    matched = []
    for keyword, cats in KEYWORD_MAP.items():
        if keyword in message_lower:
            matched.extend(cats)
    return list(dict.fromkeys(matched)) or ["wellness", "food"]


def rule_based_concierge(message: str, interests: List[str], budget: Optional[float]) -> ConciergeResponse:
    categories = _detect_categories(message)
    all_cats = list(dict.fromkeys(categories + interests))[:3]

    cat_labels = ", ".join(all_cats)
    budget_note = f" within your {budget:,.0f} ALL budget" if budget else ""
    reply = (
        f"Based on your message, I'd suggest exploring {cat_labels} options{budget_note}. "
        f"These categories match your interests and are popular in Tirana right now. "
        f"Want me to build you a package?"
    )

    package_title = None
    if "wellness" in all_cats and "food" in all_cats:
        package_title = "After Work Reset"
    elif "travel" in all_cats:
        package_title = "Weekend Explorer"
    elif "learning" in all_cats:
        package_title = "Skill Boost Bundle"

    return ConciergeResponse(
        reply=reply,
        suggested_categories=all_cats,
        suggested_package_title=package_title,
    )


def concierge(db: Session, user: User, message: str, budget: Optional[float]) -> ConciergeResponse:
    """Primary entry point. Uses OpenAI when configured, else rule-based."""
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
    interests = profile.interests if profile and profile.interests else []

    if settings.OPENAI_API_KEY:
        try:
            # Imported lazily so the app (and tests) run without the openai package.
            from app.services.llm_concierge import run_concierge
            return run_concierge(db, user, message, budget)
        except Exception:  # noqa: BLE001 — never let the AI break the endpoint
            logger.exception("OpenAI concierge failed; falling back to rule-based")

    return rule_based_concierge(message, interests, budget)


def get_recommendations(db: Session, user_id: int) -> RecommendationsResponse:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user_id).first()
    interests = profile.interests if profile and profile.interests else ["wellness", "food"]
    budget = float(profile.remaining_amount) if profile else 15000

    offers = (
        db.query(Offer)
        .filter(Offer.status == "active", Offer.category.in_(interests), Offer.price <= budget)
        .order_by(Offer.created_at.desc())
        .limit(6)
        .all()
    )

    result = []
    for offer in offers:
        style = STYLE_NAMES.get(offer.category, "great match")
        reason = f"Matches your {offer.category} interest and fits your budget."
        result.append(
            RecommendedOffer(
                offer_id=offer.id,
                title=offer.title,
                category=offer.category,
                price=float(offer.price),
                currency=offer.currency,
                reason=reason,
            )
        )

    return RecommendationsResponse(recommendations=result)
