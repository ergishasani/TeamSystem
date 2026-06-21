from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.charity import Charity, CharitySuggestion
from app.models.company import Company
from app.schemas.charity import CharityOut, CharitySuggestionCreate, CharitySuggestionOut

router = APIRouter(tags=["charities"])


@router.get("/charities", response_model=List[CharityOut])
def list_charities(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    """Active charities available to the employee: their company's plus platform-wide."""
    return (
        db.query(Charity)
        .filter(
            Charity.is_active == True,
            or_(
                Charity.is_platform_wide == True,
                Charity.company_id == current_user.company_id,
            ),
        )
        .order_by(Charity.is_platform_wide.asc(), Charity.name.asc())
        .all()
    )


@router.post("/charity-suggestions", response_model=CharitySuggestionOut, status_code=201)
def suggest_charity(
    data: CharitySuggestionCreate,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    """Employee suggests a new charity for employer approval."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company assigned")

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if company and not company.allow_employee_charity_suggestions:
        raise HTTPException(status_code=403, detail="Charity suggestions are disabled for your company")

    suggestion = CharitySuggestion(
        suggested_by_user_id=current_user.id,
        company_id=current_user.company_id,
        charity_name=data.charity_name.strip(),
        charity_website=data.charity_website,
        reason=data.reason,
        status="pending",
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion
