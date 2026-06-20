from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_employer_admin
from app.models.company import Company
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_BRAND = {"primary": "#0b1416", "accent": "#c4f24a", "light": "#f5f3ee", "warn": "#fbbf24"}
DEFAULT_POLICIES = {
    "auto_approve_under": 2500,
    "require_signoff_above": 10000,
    "lock_wallet_at_cap": False,
    "ai_bundle_suggestions": True,
}
DEFAULT_NOTIFICATIONS = {
    "new_requests": True,
    "daily_drop_recap": True,
    "provider_downtime": True,
    "weekly_digest": False,
}
DEFAULT_SECURITY = {
    "enforce_sso": False,
    "require_2fa_admins": False,
    "ip_allowlist": False,
    "last_security_review": None,
}


def _company(db: Session, current_user: User) -> Company:
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


def _serialize(company: Company, db: Session) -> dict:
    seats = db.query(User).filter(User.company_id == company.id, User.role == "employee").count()
    return {
        "id": company.id,
        "name": company.name,
        "trading_name": company.trading_name,
        "city": company.city,
        "country": company.country,
        "currency": company.currency,
        "support_email": company.support_email,
        "support_phone": company.support_phone,
        "logo_url": company.logo_url,
        "brand_colors": company.brand_colors or DEFAULT_BRAND,
        "language": company.language or "sq",
        "timezone": company.timezone or "Europe/Tirane",
        "week_start": company.week_start or "monday",
        "number_format": company.number_format or "space_comma",
        "policies": {**DEFAULT_POLICIES, **(company.policies or {})},
        "notification_prefs": {**DEFAULT_NOTIFICATIONS, **(company.notification_prefs or {})},
        "security_prefs": {**DEFAULT_SECURITY, **(company.security_prefs or {})},
        "seats": seats,
    }


@router.get("/workspace")
def get_workspace_settings(
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    return _serialize(_company(db, current_user), db)


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    trading_name: Optional[str] = None
    city: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None


@router.patch("/workspace")
def update_workspace(
    data: WorkspaceUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    return _serialize(company, db)


class BrandUpdate(BaseModel):
    logo_url: Optional[str] = None
    brand_colors: Optional[dict] = None


@router.patch("/brand")
def update_brand(
    data: BrandUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    if data.logo_url is not None:
        company.logo_url = data.logo_url
    if data.brand_colors is not None:
        company.brand_colors = {**DEFAULT_BRAND, **(company.brand_colors or {}), **data.brand_colors}
    db.commit()
    return _serialize(company, db)


class LocalizationUpdate(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    week_start: Optional[str] = None
    number_format: Optional[str] = None


@router.patch("/localization")
def update_localization(
    data: LocalizationUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    return _serialize(company, db)


class PoliciesUpdate(BaseModel):
    auto_approve_under: Optional[float] = None
    require_signoff_above: Optional[float] = None
    lock_wallet_at_cap: Optional[bool] = None
    ai_bundle_suggestions: Optional[bool] = None


@router.patch("/policies")
def update_policies(
    data: PoliciesUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    merged = {**DEFAULT_POLICIES, **(company.policies or {}), **data.model_dump(exclude_unset=True)}
    company.policies = merged
    if merged.get("require_signoff_above") is not None:
        company.approval_required_above = merged["require_signoff_above"]
    db.commit()
    return _serialize(company, db)


class NotificationsUpdate(BaseModel):
    new_requests: Optional[bool] = None
    daily_drop_recap: Optional[bool] = None
    provider_downtime: Optional[bool] = None
    weekly_digest: Optional[bool] = None


@router.patch("/notifications")
def update_notifications(
    data: NotificationsUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    company.notification_prefs = {
        **DEFAULT_NOTIFICATIONS, **(company.notification_prefs or {}), **data.model_dump(exclude_unset=True)
    }
    db.commit()
    return _serialize(company, db)


class SecurityUpdate(BaseModel):
    enforce_sso: Optional[bool] = None
    require_2fa_admins: Optional[bool] = None
    ip_allowlist: Optional[bool] = None


@router.patch("/security")
def update_security(
    data: SecurityUpdate,
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    company = _company(db, current_user)
    company.security_prefs = {
        **DEFAULT_SECURITY, **(company.security_prefs or {}), **data.model_dump(exclude_unset=True)
    }
    db.commit()
    return _serialize(company, db)


@router.get("/workspaces")
def list_connected_workspaces(
    current_user: User = Depends(get_employer_admin), db: Session = Depends(get_db)
):
    companies = db.query(Company).order_by(Company.id).all()
    out = []
    for c in companies:
        seats = db.query(User).filter(User.company_id == c.id, User.role == "employee").count()
        out.append({
            "id": c.id,
            "name": c.name,
            "seats": seats,
            "is_primary": c.id == current_user.company_id,
        })
    return out
