from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_employer_admin
from app.models.user import User
from app.models.daily_deal import DailyDeal
from app.models.offer import Offer
from app.schemas.offer import OfferOut

router = APIRouter(prefix="/deals", tags=["deals"])


class DailyDealOut(BaseModel):
    id: int
    offer_id: int
    deal_date: date
    deal_price: Optional[float]
    quantity_limit: Optional[int]
    quantity_claimed: int
    offer: OfferOut
    model_config = {"from_attributes": True}


class DailyDealIn(BaseModel):
    offer_id: int
    deal_date: date
    deal_price: Optional[float] = None
    quantity_limit: Optional[int] = None


@router.get("/today", response_model=DailyDealOut)
def get_today_deal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    deal = (
        db.query(DailyDeal)
        .filter(DailyDeal.deal_date == today, DailyDeal.is_active == True)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="No deal today")
    offer = db.query(Offer).filter(Offer.id == deal.offer_id).first()
    return {**deal.__dict__, "offer": offer}


@router.post("", response_model=DailyDealOut, status_code=201)
def create_daily_deal(
    body: DailyDealIn,
    current_user: User = Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.id == body.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    existing = db.query(DailyDeal).filter(DailyDeal.deal_date == body.deal_date).first()
    if existing:
        raise HTTPException(status_code=409, detail="A deal already exists for this date")
    deal = DailyDeal(
        offer_id=body.offer_id,
        deal_date=body.deal_date,
        deal_price=body.deal_price,
        quantity_limit=body.quantity_limit,
        quantity_claimed=0,
        is_active=True,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return {**deal.__dict__, "offer": offer}
