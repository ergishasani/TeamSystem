from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_employer_admin
from app.models.user import User
from app.models.offer import Offer
from app.models.provider import Provider
from app.models.collaboration import ProviderCollaboration, CollaborationItem

router = APIRouter(prefix="/collaborations", tags=["collaborations"])


class CollabItemIn(BaseModel):
    offer_id: int
    price_share: float


class CollabIn(BaseModel):
    title: str
    description: Optional[str] = None
    items: List[CollabItemIn]


class CollabItemOut(BaseModel):
    id: int
    offer_id: int
    provider_id: int
    price_share: float
    model_config = {"from_attributes": True}


class CollabOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    total_price: float
    currency: str
    city: str
    is_active: bool
    items: List[CollabItemOut] = []
    model_config = {"from_attributes": True}


@router.get("", response_model=List[CollabOut])
def list_collaborations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    collabs = db.query(ProviderCollaboration).filter(ProviderCollaboration.is_active == True).all()
    result = []
    for c in collabs:
        items = db.query(CollaborationItem).filter(CollaborationItem.collaboration_id == c.id).all()
        result.append({**c.__dict__, "items": items})
    return result


@router.post("", response_model=CollabOut, status_code=201)
def create_collaboration(
    body: CollabIn,
    current_user: User = Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    total = sum(i.price_share for i in body.items)
    collab = ProviderCollaboration(
        title=body.title,
        description=body.description,
        total_price=total,
        currency="ALL",
        city="Tirana",
        is_active=True,
    )
    db.add(collab)
    db.flush()

    items = []
    for item in body.items:
        offer = db.query(Offer).filter(Offer.id == item.offer_id).first()
        if not offer:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Offer {item.offer_id} not found")
        ci = CollaborationItem(
            collaboration_id=collab.id,
            offer_id=item.offer_id,
            provider_id=offer.provider_id,
            price_share=item.price_share,
        )
        db.add(ci)
        items.append(ci)

    db.commit()
    db.refresh(collab)
    return {**collab.__dict__, "items": items}


@router.get("/{collab_id}", response_model=CollabOut)
def get_collaboration(
    collab_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    collab = db.query(ProviderCollaboration).filter(ProviderCollaboration.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    items = db.query(CollaborationItem).filter(CollaborationItem.collaboration_id == collab_id).all()
    return {**collab.__dict__, "items": items}
