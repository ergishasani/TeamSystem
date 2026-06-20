from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employer_admin, get_admin_user
from app.models.offer import Offer
from app.models.package import Package
from app.models.provider import Provider
from app.models.redemption import Redemption
from app.models.request import BenefitRequest
from app.models.payment import Payment
from app.models.company import Company
from app.models.user import User
from app.schemas.offer import OfferOut, OfferCreateAdmin
from app.schemas.request import BenefitRequestOut, ApprovalAction
from app.services.approval_service import approve_request, reject_request

router = APIRouter(prefix="/employer", tags=["employer"])


@router.get("/dashboard")
def employer_dashboard(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    total_requests = db.query(BenefitRequest).filter(BenefitRequest.company_id == current_user.company_id).count()
    pending = db.query(BenefitRequest).filter(
        BenefitRequest.company_id == current_user.company_id,
        BenefitRequest.status == "pending",
    ).count()
    approved = db.query(BenefitRequest).filter(
        BenefitRequest.company_id == current_user.company_id,
        BenefitRequest.status == "approved",
    ).count()
    return {"total_requests": total_requests, "pending": pending, "approved": approved}


@router.get("/approvals", response_model=List[BenefitRequestOut])
def list_approvals(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return (
        db.query(BenefitRequest)
        .filter(BenefitRequest.company_id == current_user.company_id, BenefitRequest.status == "pending")
        .order_by(BenefitRequest.submitted_at.desc())
        .all()
    )


@router.post("/approvals/{request_id}/approve", response_model=BenefitRequestOut)
def approve(request_id: int, current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return approve_request(db, request_id, current_user.company_id)


@router.post("/approvals/{request_id}/reject", response_model=BenefitRequestOut)
def reject(request_id: int, data: ApprovalAction, current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return reject_request(db, request_id, current_user.company_id, data.rejection_reason)


@router.get("/payments")
def employer_payments(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    requests = db.query(BenefitRequest).filter(BenefitRequest.company_id == current_user.company_id).all()
    request_ids = [r.id for r in requests]
    payments = db.query(Payment).filter(Payment.request_id.in_(request_ids)).all() if request_ids else []
    return payments


@router.get("/employees")
def employer_employees(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return (
        db.query(User)
        .filter(User.company_id == current_user.company_id, User.role == "employee")
        .all()
    )


@router.get("/requests")
def all_requests(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    reqs = (
        db.query(BenefitRequest)
        .filter(BenefitRequest.company_id == current_user.company_id)
        .order_by(BenefitRequest.submitted_at.asc())
        .all()
    )
    result = []
    for r in reqs:
        emp = db.query(User).filter(User.id == r.employee_id).first()
        item_title = None
        if r.offer_id:
            o = db.query(Offer).filter(Offer.id == r.offer_id).first()
            item_title = o.title if o else None
        elif r.package_id:
            p = db.query(Package).filter(Package.id == r.package_id).first()
            item_title = p.title if p else None
        name = emp.full_name if emp else "Unknown"
        result.append({
            "id": r.id,
            "employee_name": name,
            "employee_initials": "".join(w[0].upper() for w in name.split()[:2]),
            "item_title": item_title,
            "request_type": r.request_type,
            "total_amount": float(r.total_amount),
            "currency": r.currency,
            "status": r.status,
            "ai_reason": r.ai_reason,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None,
            "rejected_at": r.rejected_at.isoformat() if r.rejected_at else None,
        })
    return result


@router.get("/redemptions")
def company_redemptions(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    req_ids = [r.id for r in db.query(BenefitRequest.id).filter(
        BenefitRequest.company_id == current_user.company_id
    ).all()]
    if not req_ids:
        return []
    redemptions = db.query(Redemption).filter(Redemption.request_id.in_(req_ids)).all()
    result = []
    for r in redemptions:
        offer = db.query(Offer).filter(Offer.id == r.offer_id).first()
        provider = db.query(Provider).filter(Provider.id == r.provider_id).first()
        raw = (r.qr_code or "").replace("-", "").upper()
        code = f"PRK-{raw[0:4]}-{raw[4:8]}" if len(raw) >= 8 else f"PRK-{r.id:04X}"
        result.append({
            "id": r.id,
            "code": code,
            "offer_title": offer.title if offer else None,
            "provider_name": provider.name if provider else None,
            "status": r.status,
            "expires_at": r.expires_at.isoformat() if r.expires_at else None,
            "redeemed_at": r.redeemed_at.isoformat() if r.redeemed_at else None,
        })
    return result


@router.get("/users")
def employer_users_wallets(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    budget_per_seat = float(company.monthly_budget_per_employee) if company else 15000
    emps = db.query(User).filter(
        User.company_id == current_user.company_id, User.role == "employee"
    ).all()
    result = []
    for emp in emps:
        req_ids = [r.id for r in db.query(BenefitRequest.id).filter(
            BenefitRequest.employee_id == emp.id
        ).all()]
        used = sum(float(p.amount) for p in db.query(Payment).filter(
            Payment.request_id.in_(req_ids)
        ).all()) if req_ids else 0.0
        pct = round(used / budget_per_seat * 100) if budget_per_seat > 0 else 0
        status = "invited" if (used == 0 and not req_ids) else ("near_cap" if pct >= 80 else "active")
        name = emp.full_name
        result.append({
            "id": emp.id,
            "full_name": name,
            "email": emp.email,
            "initials": "".join(w[0].upper() for w in name.split()[:2]),
            "company_name": company.name if company else None,
            "wallet_used": round(used),
            "wallet_cap": round(budget_per_seat),
            "usage_pct": pct,
            "status": status,
            "joined": emp.created_at.strftime("%Y-%m-%d") if emp.created_at else None,
        })
    return result


@router.get("/wallets")
def company_wallets_summary(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        return []
    seats = db.query(User).filter(
        User.company_id == company.id, User.role == "employee"
    ).count()
    budget_total = float(company.monthly_budget_per_employee) * seats
    req_ids = [r.id for r in db.query(BenefitRequest.id).filter(
        BenefitRequest.company_id == company.id
    ).all()]
    used = sum(float(p.amount) for p in db.query(Payment).filter(
        Payment.request_id.in_(req_ids)
    ).all()) if req_ids else 0.0
    utilization = round(used / budget_total * 100) if budget_total > 0 else 0
    return [{
        "company_id": company.id,
        "company_name": company.name,
        "seats": seats,
        "budget": round(budget_total),
        "used": round(used),
        "utilization_pct": utilization,
        "currency": company.currency,
    }]


@router.post("/offers", response_model=OfferOut, status_code=201)
def admin_create_offer(
    offer_data: OfferCreateAdmin,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    provider = db.query(Provider).filter(Provider.id == offer_data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    data = offer_data.model_dump()
    offer = Offer(**data)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer
