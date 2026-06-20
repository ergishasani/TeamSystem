from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_employer_admin
from app.models.user import User
from app.models.company import Company
from app.models.broadcast import Broadcast, NotificationTemplate

router = APIRouter(prefix="/notifications/admin", tags=["broadcasts"])

DEFAULT_CADENCE = {
    "quiet_hours_start": "21:00",
    "quiet_hours_end": "08:00",
    "push_muted_during_quiet_hours": True,
}


@router.get("/overview")
def overview(db: Session = Depends(get_db), current_user: User = Depends(get_employer_admin)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    sent_this_week = (
        db.query(Broadcast)
        .filter(
            Broadcast.company_id == company.id,
            Broadcast.status == "sent",
            Broadcast.sent_at >= week_ago,
        )
        .all()
    )
    total_sent = sum(b.sent_count or 0 for b in sent_this_week)
    total_unsub = sum(b.unsubscribes or 0 for b in sent_this_week)
    weighted_open = (
        sum(float(b.open_rate_pct or 0) * (b.sent_count or 0) for b in sent_this_week) / total_sent
        if total_sent else 0
    )
    scheduled_count = (
        db.query(Broadcast)
        .filter(Broadcast.company_id == company.id, Broadcast.status == "scheduled")
        .count()
    )

    channel_volume = {"push": 0, "email": 0, "slack": 0}
    for b in sent_this_week:
        channel_volume[b.channel] = channel_volume.get(b.channel, 0) + (b.sent_count or 0)

    recent = (
        db.query(Broadcast)
        .filter(Broadcast.company_id == company.id)
        .order_by(Broadcast.created_at.desc())
        .limit(12)
        .all()
    )
    broadcasts = [
        {
            "id": b.id,
            "name": b.name,
            "channel": b.channel,
            "audience": b.audience_label,
            "sent_count": b.sent_count,
            "open_rate_pct": float(b.open_rate_pct or 0),
            "status": b.status,
            "sent_at": b.sent_at,
            "scheduled_at": b.scheduled_at,
        }
        for b in recent
    ]

    templates = (
        db.query(NotificationTemplate)
        .filter(NotificationTemplate.company_id == company.id)
        .order_by(NotificationTemplate.sends_count.desc())
        .all()
    )
    template_rows = [
        {
            "id": t.id,
            "name": t.name,
            "channel": t.channel,
            "sends_count": t.sends_count,
            "last_used_at": t.last_used_at,
        }
        for t in templates
    ]

    cadence = {**DEFAULT_CADENCE, **(company.notification_prefs or {})}

    return {
        "stats": {
            "sent_this_week": total_sent,
            "avg_open_rate_pct": round(weighted_open, 1),
            "unsubscribes": total_unsub,
            "scheduled": scheduled_count,
        },
        "recent_broadcasts": broadcasts,
        "channels": {
            "volume_7d": channel_volume,
            "quiet_hours_start": cadence["quiet_hours_start"],
            "quiet_hours_end": cadence["quiet_hours_end"],
            "push_muted_during_quiet_hours": cadence["push_muted_during_quiet_hours"],
        },
        "templates": template_rows,
    }


class CadenceUpdate(BaseModel):
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    push_muted_during_quiet_hours: Optional[bool] = None


@router.patch("/cadence")
def update_cadence(
    data: CadenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    prefs = {**DEFAULT_CADENCE, **(company.notification_prefs or {})}
    updates = data.model_dump(exclude_unset=True)
    prefs.update(updates)
    company.notification_prefs = prefs
    db.commit()
    return prefs


class TemplateCreate(BaseModel):
    name: str
    channel: str = "push"


@router.post("/templates")
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    template = NotificationTemplate(
        company_id=current_user.company_id,
        name=data.name,
        channel=data.channel,
        sends_count=0,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return {
        "id": template.id,
        "name": template.name,
        "channel": template.channel,
        "sends_count": template.sends_count,
        "last_used_at": template.last_used_at,
    }
