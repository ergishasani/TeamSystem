from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_employee
from app.models.offer import Offer
from app.models.interaction import UserInteraction
from app.models.saved_offer import SavedOffer
from app.models.user import User
from app.schemas.offer import OfferOut, OfferListResponse
from app.services.recommendation_service import get_ranked_offers

router = APIRouter(prefix="/offers", tags=["offers"])


@router.get("", response_model=OfferListResponse)
def list_offers(
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Offer).filter(Offer.status == "active")
    if category:
        q = q.filter(Offer.category == category)
    if city:
        q = q.filter(Offer.city == city)
    if max_price:
        q = q.filter(Offer.price <= max_price)
    if search:
        q = q.filter(Offer.title.ilike(f"%{search}%"))

    total = q.count()
    items = q.order_by(Offer.created_at.desc()).offset(offset).limit(limit).all()
    return OfferListResponse(items=items, total=total)


@router.get("/{offer_id}", response_model=OfferOut)
def get_offer(offer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("/{offer_id}/save", status_code=200)
def save_offer(offer_id: int, current_user: User = Depends(get_employee), db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    already_saved = db.query(SavedOffer).filter(
        SavedOffer.user_id == current_user.id,
        SavedOffer.offer_id == offer_id,
    ).first()
    if not already_saved:
        db.add(SavedOffer(user_id=current_user.id, offer_id=offer_id))
        db.add(UserInteraction(user_id=current_user.id, offer_id=offer_id, action="save"))
        db.commit()
    return {"message": "Offer saved"}


@router.delete("/{offer_id}/save", status_code=200)
def unsave_offer(offer_id: int, current_user: User = Depends(get_employee), db: Session = Depends(get_db)):
    db.query(SavedOffer).filter(
        SavedOffer.user_id == current_user.id,
        SavedOffer.offer_id == offer_id,
    ).delete()
    db.commit()
    return {"message": "Offer removed from saved"}


@router.get("/users/me/saved-offers", response_model=List[OfferOut])
def get_saved_offers(current_user: User = Depends(get_employee), db: Session = Depends(get_db)):
    return (
        db.query(Offer)
        .join(SavedOffer, SavedOffer.offer_id == Offer.id)
        .filter(SavedOffer.user_id == current_user.id)
        .order_by(SavedOffer.created_at.desc())
        .all()
    )
