from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_employer_admin
from app.models.user import User
from app.models.invite import Invite

router = APIRouter(prefix="/team", tags=["team"])

ROLE_ORDER = ["owner", "admin", "approver", "editor", "viewer"]

ROLE_META = {
    "owner": {"label": "Owner", "description": "Full control over billing, security, and every workspace setting."},
    "admin": {"label": "Admin", "description": "Manage catalog, wallets, and members. Cannot change billing."},
    "approver": {"label": "Approver", "description": "Review and approve benefit requests above the auto-approve limit."},
    "editor": {"label": "Editor", "description": "Create and edit offers, packages, and campaigns."},
    "viewer": {"label": "Viewer", "description": "Read-only access to analytics and the offer catalog."},
}

CAPABILITIES = [
    "Manage catalog",
    "Approve requests",
    "Manage wallets",
    "Invite members",
    "Billing & invoices",
    "View analytics",
]

# capability -> set of roles that hold it
PERMISSION_MATRIX = {
    "Manage catalog": {"owner", "admin", "editor"},
    "Approve requests": {"owner", "admin", "approver"},
    "Manage wallets": {"owner", "admin"},
    "Invite members": {"owner", "admin"},
    "Billing & invoices": {"owner"},
    "View analytics": {"owner", "admin", "approver", "editor", "viewer"},
}


def _effective_role(u: User) -> str:
    return u.permission_role or ("admin" if u.role == "employer_admin" else "viewer")


def _time_ago(dt: Optional[datetime]) -> str:
    if not dt:
        return "Never"
    delta = datetime.now(timezone.utc) - dt
    seconds = delta.total_seconds()
    if seconds < 3600:
        return f"{max(1, int(seconds // 60))}m ago"
    if seconds < 86400:
        return f"{int(seconds // 3600)}h ago"
    return f"{int(seconds // 86400)}d ago"


def _members(db: Session, company_id: int):
    return db.query(User).filter(User.company_id == company_id).order_by(User.id).all()


@router.get("/overview")
def overview(db: Session = Depends(get_db), current_user: User = Depends(get_employer_admin)):
    members = _members(db, current_user.company_id)
    admins = sum(1 for u in members if _effective_role(u) in ("owner", "admin"))
    with_2fa = sum(1 for u in members if u.two_factor_enabled)
    coverage = round((with_2fa / len(members)) * 100) if members else 0
    pending_invites = (
        db.query(Invite)
        .filter(Invite.company_id == current_user.company_id, Invite.status == "pending")
        .count()
    )

    role_counts = {r: 0 for r in ROLE_ORDER}
    for u in members:
        role_counts[_effective_role(u)] += 1

    roles = [
        {
            "key": r,
            "label": ROLE_META[r]["label"],
            "description": ROLE_META[r]["description"],
            "count": role_counts[r],
        }
        for r in ROLE_ORDER
    ]

    member_rows = [
        {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "role": _effective_role(u),
            "role_label": ROLE_META[_effective_role(u)]["label"],
            "two_factor_enabled": bool(u.two_factor_enabled),
            "last_active": _time_ago(u.last_active_at),
            "last_active_at": u.last_active_at,
        }
        for u in members
    ]

    matrix = [
        {
            "capability": cap,
            "roles": {r: (r in allowed) for r in ROLE_ORDER},
        }
        for cap, allowed in PERMISSION_MATRIX.items()
    ]

    return {
        "stats": {
            "members": len(members),
            "admins": admins,
            "two_factor_coverage_pct": coverage,
            "pending_invites": pending_invites,
        },
        "roles": roles,
        "members_table": member_rows,
        "permission_matrix": {"roles": ROLE_ORDER, "capabilities": matrix},
    }


class MemberUpdate(BaseModel):
    permission_role: Optional[str] = None
    two_factor_enabled: Optional[bool] = None


@router.patch("/members/{user_id}")
def update_member(
    user_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.company_id == current_user.company_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    if data.permission_role is not None:
        if data.permission_role not in ROLE_ORDER:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.permission_role = data.permission_role
    if data.two_factor_enabled is not None:
        user.two_factor_enabled = data.two_factor_enabled
    db.commit()
    return {"ok": True}


class InviteCreate(BaseModel):
    email: str
    role: str = "viewer"


@router.get("/invites")
def list_invites(db: Session = Depends(get_db), current_user: User = Depends(get_employer_admin)):
    invites = (
        db.query(Invite)
        .filter(Invite.company_id == current_user.company_id, Invite.status == "pending")
        .order_by(Invite.created_at.desc())
        .all()
    )
    return [
        {"id": i.id, "email": i.email, "role": i.role, "created_at": i.created_at}
        for i in invites
    ]


@router.post("/invites")
def create_invite(
    data: InviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    if data.role not in ROLE_ORDER:
        raise HTTPException(status_code=400, detail="Invalid role")
    invite = Invite(
        company_id=current_user.company_id,
        email=data.email,
        role=data.role,
        invited_by_id=current_user.id,
        status="pending",
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return {"id": invite.id, "email": invite.email, "role": invite.role, "created_at": invite.created_at}


@router.delete("/invites/{invite_id}")
def revoke_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    invite = (
        db.query(Invite)
        .filter(Invite.id == invite_id, Invite.company_id == current_user.company_id)
        .first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "revoked"
    db.commit()
    return {"ok": True}
