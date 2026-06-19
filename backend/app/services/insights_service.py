"""Real employer analytics — aggregates a company's benefit activity."""
from sqlalchemy.orm import Session

from app.models.request import BenefitRequest
from app.models.offer import Offer
from app.models.package import PackageItem
from app.models.employee_profile import EmployeeProfile
from app.models.user import User
from app.schemas.ai import EmployerInsightResponse, CategorySpend


def _category_spend(db: Session, approved: list[BenefitRequest]) -> dict[str, float]:
    spend: dict[str, float] = {}
    for req in approved:
        if req.offer_id:
            offer = db.query(Offer).filter(Offer.id == req.offer_id).first()
            if offer:
                spend[offer.category] = spend.get(offer.category, 0.0) + float(req.total_amount)
        elif req.package_id:
            items = db.query(PackageItem).filter(PackageItem.package_id == req.package_id).all()
            for item in items:
                offer = db.query(Offer).filter(Offer.id == item.offer_id).first()
                if offer:
                    spend[offer.category] = spend.get(offer.category, 0.0) + float(item.price_share)
    return spend


def _build_insight(top_categories: list[str], approval_rate: float,
                   utilization: float, pending_count: int) -> str:
    parts: list[str] = []
    if top_categories:
        parts.append(f"Employees spend most on {', '.join(top_categories)}.")
    else:
        parts.append("No approved spending yet.")
    parts.append(f"{approval_rate * 100:.0f}% of requests get approved.")
    parts.append(f"Average budget utilization is {utilization * 100:.0f}%.")
    if pending_count:
        parts.append(f"{pending_count} request(s) are awaiting your approval.")
    return " ".join(parts)


def employer_insights(db: Session, company_id: int) -> EmployerInsightResponse:
    requests = db.query(BenefitRequest).filter(BenefitRequest.company_id == company_id).all()
    total_requests = len(requests)
    approved = [r for r in requests if r.status == "approved"]
    pending = [r for r in requests if r.status == "pending"]

    approved_total = sum(float(r.total_amount) for r in approved)
    pending_total = sum(float(r.total_amount) for r in pending)
    approval_rate = (len(approved) / total_requests) if total_requests else 0.0
    avg_spend = (approved_total / len(approved)) if approved else 0.0

    spend = _category_spend(db, approved)
    category_spend = sorted(
        (CategorySpend(category=c, total=t) for c, t in spend.items()),
        key=lambda c: c.total, reverse=True,
    )
    top_categories = [c.category for c in category_spend[:3]]

    profiles = (
        db.query(EmployeeProfile)
        .join(User, User.id == EmployeeProfile.user_id)
        .filter(User.company_id == company_id)
        .all()
    )
    ratios = [
        float(p.used_amount or 0) / float(p.monthly_budget)
        for p in profiles if p.monthly_budget and float(p.monthly_budget) > 0
    ]
    avg_budget_utilization = (sum(ratios) / len(ratios)) if ratios else 0.0

    return EmployerInsightResponse(
        top_categories=top_categories,
        category_spend=category_spend,
        avg_spend=round(avg_spend, 2),
        approval_rate=round(approval_rate, 4),
        total_requests=total_requests,
        pending_total=round(pending_total, 2),
        approved_total=round(approved_total, 2),
        avg_budget_utilization=round(avg_budget_utilization, 4),
        insight=_build_insight(top_categories, approval_rate, avg_budget_utilization, len(pending)),
    )
