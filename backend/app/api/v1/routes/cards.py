from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.card import Card

router = APIRouter(prefix="/cards", tags=["cards"])

VALID_BRANDS = {"Visa", "Mastercard", "Amex", "Other"}


class CardOut(BaseModel):
    id: int
    card_type: str
    brand: Optional[str] = "Visa"
    last_four: str
    expiry: Optional[str] = None
    is_primary: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class CardCreate(BaseModel):
    card_type: str = "credit"
    brand: str = "Visa"
    last_four: str
    expiry: Optional[str] = None
    is_primary: bool = False


@router.get("", response_model=List[CardOut])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Card)
        .filter(Card.user_id == current_user.id, Card.is_active == True)
        .order_by(Card.is_primary.desc(), Card.created_at)
        .all()
    )


@router.post("", response_model=CardOut, status_code=201)
def add_card(
    body: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(body.last_four) != 4 or not body.last_four.isdigit():
        raise HTTPException(status_code=400, detail="last_four must be exactly 4 digits")
    if body.brand not in VALID_BRANDS:
        raise HTTPException(status_code=400, detail=f"brand must be one of {VALID_BRANDS}")

    # If this card is primary, demote all others
    if body.is_primary:
        db.query(Card).filter(Card.user_id == current_user.id).update({"is_primary": False})

    card = Card(
        user_id=current_user.id,
        card_type=body.card_type,
        brand=body.brand,
        last_four=body.last_four,
        expiry=body.expiry,
        is_primary=body.is_primary,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/{card_id}/primary", response_model=CardOut)
def set_primary(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id, Card.is_active == True).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.query(Card).filter(Card.user_id == current_user.id).update({"is_primary": False})
    card.is_primary = True
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def remove_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.is_active = False
    db.commit()
