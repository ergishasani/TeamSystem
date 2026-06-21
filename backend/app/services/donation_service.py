"""
Charity donation flow — an employee redirects unused wallet budget to a
company-approved (or platform-wide) charity.

A donation is modelled as a BenefitRequest with ``request_type == "donation"`` so
it reuses the existing wallet reservation and employer approval pipeline. Unlike
offer/package requests it never creates payments or redemptions — approving a
donation simply debits the reserved budget.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.request import BenefitRequest
from app.models.employee_profile import EmployeeProfile
from app.models.company import Company
from app.models.charity import Charity
from app.services.notification_service import create_notification

FIRST_DONATION_XP = 50


def _charity_for_employee(db: Session, charity_id: int, company_id: int) -> Charity:
    charity = db.query(Charity).filter(Charity.id == charity_id, Charity.is_active == True).first()
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    # Employees may only give to their own company's charities or platform-wide ones.
    if not charity.is_platform_wide and charity.company_id != company_id:
        raise HTTPException(status_code=403, detail="This charity is not available to your company")
    return charity


def resolve_donation_amount(
    *, amount: float | None, percent_of_remaining: int | None,
    donate_full_remaining: bool, remaining: float,
) -> float:
    if donate_full_remaining:
        resolved = remaining
    elif percent_of_remaining is not None:
        resolved = round(remaining * percent_of_remaining / 100, 2)
    elif amount is not None:
        resolved = round(float(amount), 2)
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide an amount, a percent_of_remaining, or donate_full_remaining.",
        )
    if resolved <= 0:
        raise HTTPException(status_code=400, detail="Donation amount must be greater than 0.")
    return resolved


def create_donation_request(
    db: Session, employee, charity_id: int, *,
    amount: float | None, percent_of_remaining: int | None, donate_full_remaining: bool,
) -> BenefitRequest:
    if not employee.company_id:
        raise HTTPException(status_code=400, detail="User has no company assigned")

    company = db.query(Company).filter(Company.id == employee.company_id).first()
    if not company or not company.allow_charity_donations:
        raise HTTPException(status_code=403, detail="Charity donations are disabled for your company")

    charity = _charity_for_employee(db, charity_id, employee.company_id)

    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == employee.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found")
    remaining = float(profile.remaining_amount)

    donation_amount = resolve_donation_amount(
        amount=amount, percent_of_remaining=percent_of_remaining,
        donate_full_remaining=donate_full_remaining, remaining=remaining,
    )
    if donation_amount > remaining:
        raise HTTPException(status_code=400, detail="Insufficient balance for this donation.")

    match_percent = int(company.donation_match_percent or 0)
    match_amount = round(donation_amount * match_percent / 100, 2) if match_percent else 0.0

    # Reserve the budget as pending, exactly like a benefit request.
    profile.pending_amount = float(profile.pending_amount) + donation_amount
    profile.remaining_amount = remaining - donation_amount

    req = BenefitRequest(
        employee_id=employee.id,
        company_id=employee.company_id,
        request_type="donation",
        charity_id=charity.id,
        donation_amount=donation_amount,
        donation_match_amount=match_amount,
        total_amount=donation_amount,
        currency=employee.currency,
        status="pending",
        ai_reason=f"Donation to {charity.name}",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    create_notification(
        db, employee.id,
        f"Your donation request of {donation_amount:,.0f} {req.currency} to {charity.name} has been submitted.",
        type="donation_created",
    )
    db.commit()

    # Auto-approve when below the company's donation approval threshold
    # (a null threshold means donations never need manual sign-off).
    threshold = company.donation_approval_required_above
    if threshold is None or donation_amount <= float(threshold):
        from app.services.approval_service import approve_request
        return approve_request(db, req.id, req.company_id)

    return req


def award_first_donation_xp(db: Session, employee_id: int) -> None:
    """Grant a one-off XP bonus the first time an employee's donation is approved."""
    prior = (
        db.query(BenefitRequest)
        .filter(
            BenefitRequest.employee_id == employee_id,
            BenefitRequest.request_type == "donation",
            BenefitRequest.status == "approved",
        )
        .count()
    )
    # The donation being approved is already counted, so >1 means not the first.
    if prior > 1:
        return
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == employee_id).first()
    if profile:
        profile.xp = (profile.xp or 0) + FIRST_DONATION_XP
    create_notification(
        db, employee_id,
        f"You earned the First Donation badge and +{FIRST_DONATION_XP} XP. Thanks for giving back!",
        type="badge_earned",
    )
