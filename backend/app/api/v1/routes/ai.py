from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_employee, get_employer_admin, get_current_user
from app.models.employee_profile import EmployeeProfile
from app.models.offer import Offer
from app.schemas.ai import (
    ConciergeRequest, ConciergeResponse,
    GeneratePackageRequest,
    RecommendationsResponse,
    EmployerInsightRequest, EmployerInsightResponse,
)
from app.schemas.offer import OfferListResponse
from app.services.ai_service import concierge as concierge_service, get_recommendations
from app.services.insights_service import employer_insights

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/concierge", response_model=ConciergeResponse)
def concierge(
    data: ConciergeRequest,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    budget = data.budget or (float(profile.remaining_amount) if profile else None)
    return concierge_service(db, current_user, data.message, budget)


@router.post("/packages/generate", response_model=ConciergeResponse)
def generate_package(
    data: GeneratePackageRequest,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    budget = data.budget or (float(profile.remaining_amount) if profile else None)
    return concierge_service(db, current_user, data.message, budget)


@router.get("/recommendations/me", response_model=RecommendationsResponse)
def my_recommendations(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return get_recommendations(db, current_user.id)


@router.post("/employer-insights", response_model=EmployerInsightResponse)
def employer_insights_route(
    data: EmployerInsightRequest | None = None,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    # Always scoped to the authenticated employer's company.
    return employer_insights(db, current_user.company_id)


@router.get("/filter-offers", response_model=OfferListResponse)
def filter_offers_ai(
    q: str = Query(..., description="Natural language query, e.g. 'show me wellness offers under 5000 ALL'"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Parse a free-text query and return filtered offers."""
    text = q.lower()

    # Simple keyword-based filter engine (works without OpenAI key)
    category_map = {
        "wellness": "wellness", "spa": "wellness", "massage": "wellness", "relax": "wellness",
        "fitness": "fitness", "gym": "fitness", "pilates": "fitness", "workout": "fitness",
        "food": "food", "lunch": "food", "dinner": "food", "meal": "food", "eat": "food",
        "travel": "travel", "trip": "travel", "adventure": "travel",
        "learning": "learning", "course": "learning", "workshop": "learning", "skill": "learning",
        "health": "health", "dental": "health", "medical": "health",
    }

    detected_category: Optional[str] = None
    for keyword, cat in category_map.items():
        if keyword in text:
            detected_category = cat
            break

    max_price: Optional[float] = None
    import re
    price_match = re.search(r"(\d[\d,\.]*)\s*(all|lek)?", text)
    if price_match:
        try:
            max_price = float(price_match.group(1).replace(",", ""))
        except ValueError:
            pass

    offers_q = db.query(Offer).filter(Offer.status == "active")
    if detected_category:
        offers_q = offers_q.filter(Offer.category == detected_category)
    if max_price:
        offers_q = offers_q.filter(Offer.price <= max_price)

    items = offers_q.order_by(Offer.price.asc()).limit(20).all()
    return OfferListResponse(items=items, total=len(items))
