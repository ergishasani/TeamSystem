from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

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
from app.models.employee_profile import EmployeeProfile
from app.models.notification import Notification
from app.models.charity import Charity, CharitySuggestion
from app.schemas.offer import OfferOut, OfferCreateAdmin
from app.schemas.request import BenefitRequestOut, ApprovalAction
from app.schemas.charity import (
    CharityOut, CharityCreate, CharityUpdate,
    CharitySuggestionOut, CharitySuggestionReview,
    DonationStats, CharityBreakdown,
)
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


# ── Employee directory helpers ────────────────────────────────────────────────

def _employee_or_404(db: Session, company_id: int, user_id: int) -> User:
    emp = db.query(User).filter(
        User.id == user_id, User.company_id == company_id, User.role == "employee"
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found in your company")
    return emp


def _request_ids(db: Session, user_id: int) -> list:
    return [r.id for r in db.query(BenefitRequest.id).filter(
        BenefitRequest.employee_id == user_id
    ).all()]


def _wallet_used(db: Session, req_ids: list) -> float:
    if not req_ids:
        return 0.0
    return sum(float(p.amount) for p in db.query(Payment).filter(
        Payment.request_id.in_(req_ids)
    ).all())


def _wallet_cap(profile: Optional[EmployeeProfile], company_default: float) -> float:
    """Per-employee budget override when set, otherwise the company default."""
    if profile and profile.monthly_budget and float(profile.monthly_budget) > 0:
        return float(profile.monthly_budget)
    return company_default


def _status_for(used: float, pct: int, req_ids: list) -> str:
    if used == 0 and not req_ids:
        return "invited"
    return "near_cap" if pct >= 80 else "active"


def _user_row(db: Session, emp: User, company: Optional[Company], company_default: float) -> dict:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == emp.id).first()
    req_ids = _request_ids(db, emp.id)
    used = _wallet_used(db, req_ids)
    cap = _wallet_cap(profile, company_default)
    pct = round(used / cap * 100) if cap > 0 else 0
    name = emp.full_name
    return {
        "id": emp.id,
        "full_name": name,
        "email": emp.email,
        "initials": "".join(w[0].upper() for w in name.split()[:2]),
        "company_name": company.name if company else None,
        "department": profile.department if profile else None,
        "wallet_used": round(used),
        "wallet_cap": round(cap),
        "usage_pct": pct,
        "status": _status_for(used, pct, req_ids),
        "joined": emp.created_at.strftime("%Y-%m-%d") if emp.created_at else None,
    }


@router.get("/users")
def employer_users_wallets(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    budget_per_seat = float(company.monthly_budget_per_employee) if company else 15000
    emps = db.query(User).filter(
        User.company_id == current_user.company_id, User.role == "employee"
    ).all()
    return [_user_row(db, emp, company, budget_per_seat) for emp in emps]


@router.get("/users/{user_id}")
def employer_user_detail(user_id: int, current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    budget_per_seat = float(company.monthly_budget_per_employee) if company else 15000
    emp = _employee_or_404(db, current_user.company_id, user_id)
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == emp.id).first()

    req_ids = _request_ids(db, emp.id)
    used = _wallet_used(db, req_ids)
    cap = _wallet_cap(profile, budget_per_seat)
    pct = round(used / cap * 100) if cap > 0 else 0
    pending = sum(float(r.total_amount) for r in db.query(BenefitRequest).filter(
        BenefitRequest.employee_id == emp.id, BenefitRequest.status == "pending"
    ).all())
    row = _user_row(db, emp, company, budget_per_seat)
    row.update({
        "phone": emp.phone,
        "avatar_url": emp.avatar_url,
        "level": profile.level if profile else 1,
        "xp": profile.xp if profile else 0,
        "streak": profile.streak_count if profile else 0,
        "benefit_style": profile.benefit_style if profile else None,
        "interests": (profile.interests if profile else []) or [],
        "wallet_pending": round(pending),
        "wallet_remaining": round(max(0.0, cap - used - pending)),
        "requests_count": len(req_ids),
        "last_active": emp.last_active_at.isoformat() if emp.last_active_at else None,
    })
    return row


class EmployeeUpdate(BaseModel):
    monthly_budget: Optional[float] = None
    department: Optional[str] = None


@router.patch("/users/{user_id}")
def employer_update_user(
    user_id: int,
    data: EmployeeUpdate,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    budget_per_seat = float(company.monthly_budget_per_employee) if company else 15000
    emp = _employee_or_404(db, current_user.company_id, user_id)
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == emp.id).first()
    if not profile:
        profile = EmployeeProfile(user_id=emp.id, monthly_budget=budget_per_seat)
        db.add(profile)
        db.flush()

    if data.monthly_budget is not None:
        if data.monthly_budget < 0:
            raise HTTPException(status_code=400, detail="Budget cannot be negative")
        profile.monthly_budget = data.monthly_budget
        # Keep the wallet internally consistent after a cap change.
        profile.remaining_amount = max(
            0, float(data.monthly_budget) - float(profile.used_amount or 0) - float(profile.pending_amount or 0)
        )
    if data.department is not None:
        profile.department = data.department.strip() or None

    db.commit()
    return employer_user_detail(user_id, current_user, db)


class NudgeIn(BaseModel):
    message: Optional[str] = None
    title: Optional[str] = None


@router.post("/users/{user_id}/nudge", status_code=201)
def employer_nudge_user(
    user_id: int,
    data: NudgeIn,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    emp = _employee_or_404(db, current_user.company_id, user_id)
    note = Notification(
        user_id=emp.id,
        title=(data.title or "A reminder from your admin").strip(),
        message=(data.message or "Don't forget to make the most of your benefits wallet this month!").strip(),
        type="info",
        read=False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"ok": True, "notification_id": note.id, "sent_to": emp.full_name}


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


# ── Charity donations ─────────────────────────────────────────────────────────

@router.get("/donations", response_model=DonationStats)
def donations_dashboard(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    currency = company.currency if company else "ALL"

    donations = (
        db.query(BenefitRequest)
        .filter(
            BenefitRequest.company_id == current_user.company_id,
            BenefitRequest.request_type == "donation",
        )
        .all()
    )
    approved = [d for d in donations if d.status == "approved"]
    pending = [d for d in donations if d.status == "pending"]

    now = datetime.now(timezone.utc)

    def _is_this_month(d: BenefitRequest) -> bool:
        ts = d.approved_at or d.submitted_at
        if not ts:
            return False
        try:
            return ts.year == now.year and ts.month == now.month
        except TypeError:
            return False

    def _amt(d: BenefitRequest) -> float:
        return float(d.donation_amount or d.total_amount or 0)

    # Charity / category names for the breakdowns.
    charity_ids = {d.charity_id for d in approved if d.charity_id}
    charities = {
        c.id: c for c in db.query(Charity).filter(Charity.id.in_(charity_ids)).all()
    } if charity_ids else {}

    by_charity: dict = {}
    by_category: dict = {}
    for d in approved:
        c = charities.get(d.charity_id)
        cname = c.name if c else "Unknown charity"
        cat = c.category if c else "other"
        bc = by_charity.setdefault(d.charity_id, {"name": cname, "category": cat, "total": 0.0, "count": 0})
        bc["total"] += _amt(d)
        bc["count"] += 1
        cc = by_category.setdefault(cat, {"name": cat, "category": cat, "total": 0.0, "count": 0})
        cc["total"] += _amt(d)
        cc["count"] += 1

    return DonationStats(
        currency=currency,
        total_donated_this_month=round(sum(_amt(d) for d in approved if _is_this_month(d)), 2),
        total_donated_all_time=round(sum(_amt(d) for d in approved), 2),
        donor_count=len({d.employee_id for d in approved}),
        pending_count=len(pending),
        pending_amount=round(sum(_amt(d) for d in pending), 2),
        employer_match_paid=round(sum(float(d.donation_match_amount or 0) for d in approved), 2),
        by_charity=sorted(
            [CharityBreakdown(charity_id=k, charity_name=v["name"], category=v["category"],
                              total=round(v["total"], 2), count=v["count"]) for k, v in by_charity.items()],
            key=lambda x: x.total, reverse=True,
        ),
        by_category=sorted(
            [CharityBreakdown(charity_name=v["name"], category=v["category"],
                              total=round(v["total"], 2), count=v["count"]) for v in by_category.values()],
            key=lambda x: x.total, reverse=True,
        ),
    )


@router.get("/charities", response_model=List[CharityOut])
def list_company_charities(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    from sqlalchemy import or_
    return (
        db.query(Charity)
        .filter(or_(Charity.company_id == current_user.company_id, Charity.is_platform_wide == True))
        .order_by(Charity.is_platform_wide.asc(), Charity.name.asc())
        .all()
    )


@router.post("/charities", response_model=CharityOut, status_code=201)
def create_company_charity(
    data: CharityCreate,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    charity = Charity(
        name=data.name.strip(),
        description=data.description,
        logo_url=data.logo_url,
        category=data.category,
        company_id=current_user.company_id,
        is_platform_wide=False,
        is_active=True,
    )
    db.add(charity)
    db.commit()
    db.refresh(charity)
    return charity


@router.patch("/charities/{charity_id}", response_model=CharityOut)
def update_company_charity(
    charity_id: int,
    data: CharityUpdate,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    charity = db.query(Charity).filter(Charity.id == charity_id).first()
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    # Employers may only edit their own charities, never platform-wide ones.
    if charity.is_platform_wide or charity.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You can only edit your company's charities")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(charity, field, value)
    db.commit()
    db.refresh(charity)
    return charity


@router.get("/charity-suggestions", response_model=List[CharitySuggestionOut])
def list_charity_suggestions(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return (
        db.query(CharitySuggestion)
        .filter(CharitySuggestion.company_id == current_user.company_id)
        .order_by(CharitySuggestion.created_at.desc())
        .all()
    )


@router.patch("/charity-suggestions/{suggestion_id}", response_model=CharitySuggestionOut)
def review_charity_suggestion(
    suggestion_id: int,
    data: CharitySuggestionReview,
    current_user=Depends(get_employer_admin),
    db: Session = Depends(get_db),
):
    if data.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
    suggestion = db.query(CharitySuggestion).filter(
        CharitySuggestion.id == suggestion_id,
        CharitySuggestion.company_id == current_user.company_id,
    ).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != "pending":
        raise HTTPException(status_code=400, detail=f"Suggestion is already {suggestion.status}")

    suggestion.status = data.status
    suggestion.reviewed_by_admin_id = current_user.id
    suggestion.reviewed_at = datetime.now(timezone.utc)

    # Approving a suggestion promotes it into an active company charity.
    if data.status == "approved":
        db.add(Charity(
            name=suggestion.charity_name,
            description=f"Suggested by an employee. {suggestion.reason or ''}".strip(),
            category="other",
            company_id=current_user.company_id,
            is_platform_wide=False,
            is_active=True,
        ))
    db.commit()
    db.refresh(suggestion)
    return suggestion


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
