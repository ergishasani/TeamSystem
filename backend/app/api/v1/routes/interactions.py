from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.interaction import UserInteraction
from app.services.recommendation_service import get_ranked_offers
from app.schemas.offer import OfferOut

router = APIRouter(prefix="/interactions", tags=["interactions"])


class InteractionCreate(BaseModel):
    offer_id: int
    action: str  # view | save | click | request


class SearchQuery(BaseModel):
    query: str
    category: Optional[str] = None


@router.post("", status_code=201)
def log_interaction(
    data: InteractionCreate,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    interaction = UserInteraction(user_id=current_user.id, offer_id=data.offer_id, action=data.action)
    db.add(interaction)
    db.commit()
    return {"message": "Interaction logged"}


@router.post("/search")
def search_offers(
    data: SearchQuery,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    # Returns ranked offers filtered by search query
    ranked = get_ranked_offers(db, current_user.id, limit=20)
    query_lower = data.query.lower()
    filtered = [o for o in ranked if query_lower in o.title.lower() or query_lower in o.category.lower()]
    return filtered[:10]
