from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.redemption import Redemption
from app.models.request import BenefitRequest
from app.models.offer import Offer

router = APIRouter(prefix="/redemptions", tags=["redemptions"])


class RedemptionOut(BaseModel):
    id: int
    request_id: int
    offer_id: int
    provider_id: int
    qr_code: str
    status: str
    offer_title: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


def _enrich(r: Redemption, db: Session) -> RedemptionOut:
    offer = db.query(Offer).filter(Offer.id == r.offer_id).first()
    return RedemptionOut(
        id=r.id,
        request_id=r.request_id,
        offer_id=r.offer_id,
        provider_id=r.provider_id,
        qr_code=r.qr_code,
        status=r.status,
        offer_title=offer.title if offer else None,
        redeemed_at=r.redeemed_at,
        expires_at=r.expires_at,
    )


@router.get("/me", response_model=List[RedemptionOut])
def my_redemptions(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    my_request_ids = [
        r.id for r in db.query(BenefitRequest).filter(BenefitRequest.employee_id == current_user.id).all()
    ]
    if not my_request_ids:
        return []
    redemptions = db.query(Redemption).filter(Redemption.request_id.in_(my_request_ids)).all()
    return [_enrich(r, db) for r in redemptions]


@router.get("/by-request/{request_id}", response_model=List[RedemptionOut])
def redemptions_by_request(
    request_id: int,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    req = db.query(BenefitRequest).filter(
        BenefitRequest.id == request_id,
        BenefitRequest.employee_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    redemptions = db.query(Redemption).filter(Redemption.request_id == request_id).all()
    return [_enrich(r, db) for r in redemptions]


@router.get("/{redemption_id}", response_model=RedemptionOut)
def get_redemption(redemption_id: int, current_user=Depends(get_employee), db: Session = Depends(get_db)):
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    req = db.query(BenefitRequest).filter(
        BenefitRequest.id == redemption.request_id,
        BenefitRequest.employee_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=403, detail="Access denied")
    return _enrich(redemption, db)
