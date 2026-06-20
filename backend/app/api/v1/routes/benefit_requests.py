from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employee
from app.models.request import BenefitRequest
from app.models.employee_profile import EmployeeProfile
from app.models.package import Package
from app.models.offer import Offer
from app.models.company import Company
from app.models.collaboration import ProviderCollaboration
from app.schemas.request import BenefitRequestCreate, BenefitRequestOut
from app.services.approval_service import approve_request

router = APIRouter(prefix="/benefit-requests", tags=["benefit_requests"])


@router.post("", response_model=BenefitRequestOut, status_code=201)
def create_request(
    data: BenefitRequestCreate,
    current_user=Depends(get_employee),
    db: Session = Depends(get_db),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company assigned")

    # Calculate amount from package, offer, or collaboration
    total_amount = 0.0
    if data.package_id:
        pkg = db.query(Package).filter(Package.id == data.package_id).first()
        if not pkg:
            raise HTTPException(status_code=404, detail="Package not found")
        total_amount = float(pkg.total_price)
    elif data.offer_id:
        offer = db.query(Offer).filter(Offer.id == data.offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        total_amount = float(offer.price)
    elif data.collaboration_id:
        collab = db.query(ProviderCollaboration).filter(ProviderCollaboration.id == data.collaboration_id).first()
        if not collab:
            raise HTTPException(status_code=404, detail="Collaboration not found")
        total_amount = float(collab.total_price)
    else:
        raise HTTPException(status_code=400, detail="Must provide package_id, offer_id, or collaboration_id")

    # Reserve budget as pending
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if profile:
        if float(profile.remaining_amount) < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient budget")
        profile.pending_amount = float(profile.pending_amount) + total_amount
        profile.remaining_amount = float(profile.remaining_amount) - total_amount

    req = BenefitRequest(
        employee_id=current_user.id,
        company_id=current_user.company_id,
        package_id=data.package_id,
        offer_id=data.offer_id,
        collaboration_id=data.collaboration_id,
        request_type=data.request_type,
        total_amount=total_amount,
        currency=current_user.currency,
        status="pending",
        ai_reason=data.ai_reason,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Auto-approve when the amount is at or below the company's approval threshold.
    # A null threshold means every request needs manual employer approval.
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    threshold = company.approval_required_above if company else None
    if threshold is not None and total_amount <= float(threshold):
        return approve_request(db, req.id, req.company_id)

    return req


def _enrich(req: BenefitRequest, db: Session) -> BenefitRequestOut:
    title: str | None = None
    if req.offer_id:
        row = db.query(Offer.title).filter(Offer.id == req.offer_id).first()
        title = row[0] if row else None
    elif req.package_id:
        row = db.query(Package.title).filter(Package.id == req.package_id).first()
        title = row[0] if row else None
    d = BenefitRequestOut.model_validate(req).model_dump()
    d["title"] = title
    return BenefitRequestOut(**d)


@router.get("/me", response_model=List[BenefitRequestOut])
def my_requests(current_user=Depends(get_employee), db: Session = Depends(get_db)):
    reqs = (
        db.query(BenefitRequest)
        .filter(BenefitRequest.employee_id == current_user.id)
        .order_by(BenefitRequest.submitted_at.desc())
        .all()
    )
    return [_enrich(r, db) for r in reqs]


@router.get("/{request_id}", response_model=BenefitRequestOut)
def get_request(request_id: int, current_user=Depends(get_employee), db: Session = Depends(get_db)):
    req = db.query(BenefitRequest).filter(
        BenefitRequest.id == request_id,
        BenefitRequest.employee_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return _enrich(req, db)


@router.patch("/{request_id}/cancel", response_model=BenefitRequestOut)
def cancel_request(request_id: int, current_user=Depends(get_employee), db: Session = Depends(get_db)):
    req = db.query(BenefitRequest).filter(
        BenefitRequest.id == request_id,
        BenefitRequest.employee_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be cancelled")
    req.status = "cancelled"

    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if profile:
        profile.pending_amount = max(0, float(profile.pending_amount) - float(req.total_amount))
        profile.remaining_amount = float(profile.remaining_amount) + float(req.total_amount)

    db.commit()
    db.refresh(req)
    return req
