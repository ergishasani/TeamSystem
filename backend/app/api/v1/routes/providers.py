from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_admin_user
from app.models.provider import Provider
from app.models.offer import Offer
from app.models.redemption import Redemption
from app.schemas.offer import ProviderOut, ProviderAdminOut, ProviderCreate, ProviderUpdate

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


def _health_status(uptime_pct: int) -> str:
    if uptime_pct >= 90:
        return "healthy"
    if uptime_pct >= 70:
        return "watch"
    return "down"


def _build_admin_out(provider: Provider, db: Session) -> ProviderAdminOut:
    offer_count = db.query(Offer).filter(Offer.provider_id == provider.id, Offer.status == "active").count()
    redemptions = db.query(Redemption).filter(Redemption.provider_id == provider.id).all()
    redemption_count = len(redemptions)
    if redemption_count > 0:
        successful = sum(1 for r in redemptions if r.status != "expired")
        uptime_pct = round(successful / redemption_count * 100)
    else:
        # No activity yet — fall back to the provider's rating as a stand-in signal.
        uptime_pct = round(float(provider.rating) / 5 * 100)
    uptime_pct = min(99, max(50, uptime_pct))
    return ProviderAdminOut(
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
        redemption_count=redemption_count,
        uptime_pct=uptime_pct,
        health_status=_health_status(uptime_pct),
    )


@router.get("/admin/network", response_model=List[ProviderAdminOut])
def admin_list_providers(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    providers = db.query(Provider).order_by(Provider.name).all()
    return [_build_admin_out(p, db) for p in providers]


@router.post("/admin", response_model=ProviderAdminOut, status_code=201)
def admin_create_provider(
    body: ProviderCreate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    provider = Provider(**body.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return _build_admin_out(provider, db)


@router.patch("/admin/{provider_id}", response_model=ProviderAdminOut)
def admin_update_provider(
    provider_id: int,
    body: ProviderUpdate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)
    db.commit()
    db.refresh(provider)
    return _build_admin_out(provider, db)


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
