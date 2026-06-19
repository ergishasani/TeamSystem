from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.redemption import Redemption
from app.models.request import BenefitRequest

router = APIRouter(prefix="/redemptions", tags=["redemptions"])


@router.get("/me")
def my_redemptions(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    my_request_ids = [
        r.id for r in db.query(BenefitRequest).filter(BenefitRequest.employee_id == current_user.id).all()
    ]
    if not my_request_ids:
        return []
    return db.query(Redemption).filter(Redemption.request_id.in_(my_request_ids)).all()


@router.get("/{redemption_id}")
def get_redemption(redemption_id: int, current_user=Depends(get_employee), db: Session = Depends(get_db)):
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    # Verify it belongs to this employee
    req = db.query(BenefitRequest).filter(
        BenefitRequest.id == redemption.request_id,
        BenefitRequest.employee_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=403, detail="Access denied")
    return redemption
