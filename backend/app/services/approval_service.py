"""
Handles the employer approval flow:
  1. Mark request as approved
  2. Deduct employee budget
  3. Create simulated payment rows for each provider
  4. Create redemption records with QR codes
"""
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.request import BenefitRequest
from app.models.employee_profile import EmployeeProfile
from app.models.package import PackageItem
from app.models.payment import Payment
from app.models.redemption import Redemption
from app.models.offer import Offer


def _generate_qr(request_id: int, offer_id: int) -> str:
    return f"PERKA-{request_id}-{offer_id}-{uuid.uuid4().hex[:8].upper()}"


def approve_request(db: Session, request_id: int, approver_company_id: int) -> BenefitRequest:
    req = db.query(BenefitRequest).filter(BenefitRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.company_id != approver_company_id:
        raise HTTPException(status_code=403, detail="Not your company's request")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "approved"
    req.approved_at = datetime.now(timezone.utc)

    # Deduct from employee budget
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == req.employee_id).first()
    if profile:
        profile.used_amount = float(profile.used_amount) + float(req.total_amount)
        profile.pending_amount = max(0, float(profile.pending_amount) - float(req.total_amount))
        profile.remaining_amount = float(profile.monthly_budget) - float(profile.used_amount)

    # Create payments and redemptions
    if req.request_type == "package" and req.package_id:
        items = db.query(PackageItem).filter(PackageItem.package_id == req.package_id).all()
        for item in items:
            payment = Payment(
                request_id=req.id,
                provider_id=item.provider_id,
                amount=item.price_share,
                currency=req.currency,
                status="simulated_paid",
            )
            db.add(payment)

            redemption = Redemption(
                request_id=req.id,
                offer_id=item.offer_id,
                provider_id=item.provider_id,
                qr_code=_generate_qr(req.id, item.offer_id),
                status="active",
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            )
            db.add(redemption)

    elif req.request_type == "single_offer" and req.offer_id:
        offer = db.query(Offer).filter(Offer.id == req.offer_id).first()
        if offer:
            payment = Payment(
                request_id=req.id,
                provider_id=offer.provider_id,
                amount=req.total_amount,
                currency=req.currency,
                status="simulated_paid",
            )
            db.add(payment)

            redemption = Redemption(
                request_id=req.id,
                offer_id=offer.id,
                provider_id=offer.provider_id,
                qr_code=_generate_qr(req.id, offer.id),
                status="active",
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            )
            db.add(redemption)

    db.commit()
    db.refresh(req)
    return req


def reject_request(db: Session, request_id: int, approver_company_id: int, reason: str | None) -> BenefitRequest:
    req = db.query(BenefitRequest).filter(BenefitRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.company_id != approver_company_id:
        raise HTTPException(status_code=403, detail="Not your company's request")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "rejected"
    req.rejected_at = datetime.now(timezone.utc)
    req.rejection_reason = reason

    # Release the reserved budget back to the employee
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == req.employee_id).first()
    if profile:
        profile.pending_amount = max(0, float(profile.pending_amount) - float(req.total_amount))
        profile.remaining_amount = float(profile.remaining_amount) + float(req.total_amount)

    db.commit()
    db.refresh(req)
    return req
