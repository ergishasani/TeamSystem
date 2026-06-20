from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.deps import get_current_user, get_employer_admin
from app.models.user import User
from app.models.daily_deal import DailyDeal
from app.models.offer import Offer
from app.models.provider import Provider
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
    # Exact match first, then fall back to most recent active deal
    deal = (
        db.query(DailyDeal)
        .filter(DailyDeal.deal_date == today, DailyDeal.is_active == True)
        .first()
    )
    if not deal:
        deal = (
            db.query(DailyDeal)
            .filter(DailyDeal.is_active == True)
            .order_by(DailyDeal.deal_date.desc())
            .first()
        )
    if not deal:
        raise HTTPException(status_code=404, detail="No deal today")
    return _build_deal_out(deal, db)


def _build_deal_out(deal: DailyDeal, db):
    offer = db.query(Offer).filter(Offer.id == deal.offer_id).first()
    provider = db.query(Provider).filter(Provider.id == offer.provider_id).first() if offer else None
    offer_dict = OfferOut.model_validate(offer).model_dump() if offer else {}
    offer_dict["provider_name"] = provider.name if provider else None
    return {**deal.__dict__, "offer": offer_dict}


@router.get("/upcoming", response_model=List[DailyDealOut])
def get_upcoming_deals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    end = today + timedelta(days=7)
    deals = (
        db.query(DailyDeal)
        .filter(DailyDeal.deal_date > today, DailyDeal.deal_date <= end, DailyDeal.is_active == True)
        .order_by(DailyDeal.deal_date.asc())
        .all()
    )
    return [_build_deal_out(d, db) for d in deals]


@router.patch("/{deal_id}/pause")
def pause_deal(
    deal_id: int,
    current_user: User = Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    deal = db.query(DailyDeal).filter(DailyDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.is_active = False
    db.commit()
    return {"message": "Deal paused"}


@router.patch("/{deal_id}/boost", response_model=DailyDealOut)
def boost_deal(
    deal_id: int,
    current_user: User = Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    deal = db.query(DailyDeal).filter(DailyDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    offer = db.query(Offer).filter(Offer.id == deal.offer_id).first()
    current_price = float(deal.deal_price or offer.price)
    deal.deal_price = round(current_price * 0.80, 2)
    db.commit()
    db.refresh(deal)
    return _build_deal_out(deal, db)


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
    return _build_deal_out(deal, db)
