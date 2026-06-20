from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user, get_employee
from app.models.package import Package, PackageItem
from app.models.offer import Offer
from app.models.provider import Provider
from app.schemas.package import PackageOut, PackageCreate, PackageItemOut

router = APIRouter(prefix="/packages", tags=["packages"])


def _build_item_out(item: PackageItem, db: Session) -> PackageItemOut:
    offer = db.query(Offer).filter(Offer.id == item.offer_id).first()
    provider = db.query(Provider).filter(Provider.id == item.provider_id).first() if offer else None
    return PackageItemOut(
        id=item.id,
        offer_id=item.offer_id,
        provider_id=item.provider_id,
        price_share=float(item.price_share),
        category=offer.category if offer else "wellness",
        offer_title=offer.title if offer else None,
        provider_name=provider.name if provider else None,
        valid_until=offer.valid_until if offer else None,
    )


def _build_package_out(pkg: Package, db: Session) -> PackageOut:
    items = db.query(PackageItem).filter(PackageItem.package_id == pkg.id).all()
    return PackageOut(
        id=pkg.id,
        title=pkg.title,
        description=pkg.description,
        total_price=float(pkg.total_price),
        currency=pkg.currency,
        city=pkg.city,
        country=pkg.country,
        created_by=pkg.created_by,
        ai_reason=pkg.ai_reason,
        created_at=pkg.created_at,
        items=[
            _build_item_out(i, db)
            for i in items
        ],
    )


@router.get("", response_model=List[PackageOut])
def list_packages(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    packages = db.query(Package).order_by(Package.created_at.desc()).all()
    return [_build_package_out(p, db) for p in packages]


@router.get("/{package_id}", response_model=PackageOut)
def get_package(package_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    pkg = db.query(Package).filter(Package.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return _build_package_out(pkg, db)


@router.post("", response_model=PackageOut, status_code=201)
def create_package(
    data: PackageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_employee),
):
    offers = db.query(Offer).filter(Offer.id.in_(data.offer_ids)).all()
    if len(offers) != len(data.offer_ids):
        raise HTTPException(status_code=400, detail="Some offer IDs are invalid")

    total = sum(float(o.price) for o in offers)
    pkg = Package(
        title=data.title,
        description=data.description,
        total_price=total,
        currency=offers[0].currency if offers else "ALL",
        city=offers[0].city if offers else "Tirana",
        country="AL",
        created_by=current_user.id,
        ai_reason=data.ai_reason,
    )
    db.add(pkg)
    db.flush()

    for offer in offers:
        item = PackageItem(
            package_id=pkg.id,
            offer_id=offer.id,
            provider_id=offer.provider_id,
            price_share=float(offer.price),
        )
        db.add(item)

    db.commit()
    db.refresh(pkg)
    return _build_package_out(pkg, db)
