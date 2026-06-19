from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_employee
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import (
    ConciergeRequest, ConciergeResponse,
    GeneratePackageRequest,
    RecommendationsResponse,
    EmployerInsightRequest, EmployerInsightResponse,
)
from app.services.ai_service import rule_based_concierge, get_recommendations

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/concierge", response_model=ConciergeResponse)
def concierge(
    data: ConciergeRequest,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    interests = profile.interests if profile and profile.interests else []
    budget = data.budget or (float(profile.remaining_amount) if profile else None)
    return rule_based_concierge(data.message, interests, budget)


@router.post("/packages/generate", response_model=ConciergeResponse)
def generate_package(
    data: GeneratePackageRequest,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    interests = profile.interests if profile and profile.interests else []
    budget = data.budget or (float(profile.remaining_amount) if profile else None)
    return rule_based_concierge(data.message, interests, budget)


@router.get("/recommendations/me", response_model=RecommendationsResponse)
def my_recommendations(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    return get_recommendations(db, current_user.id)


@router.post("/employer-insights", response_model=EmployerInsightResponse)
def employer_insights(data: EmployerInsightRequest, current_user=Depends(get_current_user)):
    # Stub — replace with real analytics when needed
    return EmployerInsightResponse(
        top_categories=["wellness", "food", "fitness"],
        avg_spend=8500.0,
        insight="Employees prefer wellness and food benefits. Consider adding more wellness partners.",
    )
