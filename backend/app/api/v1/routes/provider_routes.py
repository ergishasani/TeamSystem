from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_provider_admin
from app.models.offer import Offer
from app.models.redemption import Redemption
from app.models.payment import Payment
from app.models.request import BenefitRequest
from app.schemas.offer import OfferOut, OfferCreate, OfferUpdate
from app.services.challenge_service import advance_challenges

router = APIRouter(prefix="/provider", tags=["provider"])


@router.get("/dashboard")
def provider_dashboard(current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    total_offers = db.query(Offer).filter(Offer.provider_id == current_user.provider_id).count()
    pending_redemptions = db.query(Redemption).filter(
        Redemption.provider_id == current_user.provider_id,
        Redemption.status == "active",
    ).count()
    return {"total_offers": total_offers, "pending_redemptions": pending_redemptions}


@router.get("/offers", response_model=List[OfferOut])
def provider_offers(current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    return db.query(Offer).filter(Offer.provider_id == current_user.provider_id).all()


@router.post("/offers", response_model=OfferOut, status_code=201)
def create_offer(offer_data: OfferCreate, current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    offer = Offer(provider_id=current_user.provider_id, **offer_data.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.patch("/offers/{offer_id}", response_model=OfferOut)
def update_offer(offer_id: int, offer_data: OfferUpdate, current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(
        Offer.id == offer_id,
        Offer.provider_id == current_user.provider_id,
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    for field, value in offer_data.model_dump(exclude_unset=True).items():
        setattr(offer, field, value)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/redemptions")
def provider_redemptions(current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    return db.query(Redemption).filter(Redemption.provider_id == current_user.provider_id).all()


@router.post("/redemptions/{redemption_id}/confirm")
def confirm_redemption(redemption_id: int, current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    redemption = db.query(Redemption).filter(
        Redemption.id == redemption_id,
        Redemption.provider_id == current_user.provider_id,
    ).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    redemption.status = "redeemed"
    redemption.redeemed_at = datetime.now(timezone.utc)

    # Advance the employee's challenge progress for this redeemed offer.
    req = db.query(BenefitRequest).filter(BenefitRequest.id == redemption.request_id).first()
    offer = db.query(Offer).filter(Offer.id == redemption.offer_id).first()
    if req:
        advance_challenges(db, req.employee_id, offer)

    db.commit()
    return {"message": "Redemption confirmed"}


@router.get("/payments")
def provider_payments(current_user=Depends(get_provider_admin), db: Session = Depends(get_db)):
    return db.query(Payment).filter(Payment.provider_id == current_user.provider_id).all()
