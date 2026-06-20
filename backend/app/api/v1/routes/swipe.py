from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.offer import Offer
from app.models.swipe import SwipeInteraction
from app.schemas.offer import OfferOut, OfferListResponse

router = APIRouter(prefix="/offers", tags=["swipe"])


class SwipeIn(BaseModel):
    direction: str  # like | dislike


@router.post("/{offer_id}/swipe", status_code=200)
def swipe_offer(
    offer_id: int,
    body: SwipeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.direction not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="direction must be 'like' or 'dislike'")
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    db.query(SwipeInteraction).filter(
        SwipeInteraction.user_id == current_user.id,
        SwipeInteraction.offer_id == offer_id,
    ).delete()
    db.add(SwipeInteraction(user_id=current_user.id, offer_id=offer_id, direction=body.direction))
    db.commit()
    return {"message": "Swipe recorded", "direction": body.direction}


@router.get("/swipe/deck", response_model=OfferListResponse)
def get_swipe_deck(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns offers the user hasn't swiped yet."""
    swiped_ids = [
        s.offer_id for s in db.query(SwipeInteraction.offer_id)
        .filter(SwipeInteraction.user_id == current_user.id).all()
    ]
    q = db.query(Offer).filter(Offer.status == "active")
    if swiped_ids:
        q = q.filter(Offer.id.notin_(swiped_ids))
    items = q.order_by(Offer.created_at.desc()).limit(limit).all()
    return OfferListResponse(items=items, total=len(items))
