from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_employee, get_employer_admin
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import (
    ConciergeRequest, ConciergeResponse,
    GeneratePackageRequest,
    RecommendationsResponse,
    EmployerInsightRequest, EmployerInsightResponse,
)
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
