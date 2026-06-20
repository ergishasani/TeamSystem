from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.provider import Provider
from app.models.offer import Offer
from app.schemas.offer import ProviderOut

router = APIRouter(prefix="/providers", tags=["providers"])


def _build_out(provider: Provider, db: Session) -> ProviderOut:
    offer_count = db.query(Offer).filter(Offer.provider_id == provider.id, Offer.status == "active").count()
    return ProviderOut(
        id=provider.id,
        name=provider.name,
        category=provider.category,
        city=provider.city,
        country=provider.country,
        description=provider.description,
        logo_url=provider.logo_url,
        rating=float(provider.rating),
        status=provider.status,
        offer_count=offer_count,
    )


@router.get("", response_model=List[ProviderOut])
def list_providers(
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Provider).filter(Provider.status == "active")
    if category:
        query = query.filter(Provider.category == category)
    if q:
        query = query.filter(Provider.name.ilike(f"%{q}%"))
    providers = query.order_by(Provider.name).all()
    return [_build_out(p, db) for p in providers]


@router.get("/{provider_id}", response_model=ProviderOut)
def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return _build_out(provider, db)
