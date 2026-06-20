from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_employer_admin
from app.models.user import User
from app.models.campaign import Campaign

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), current_user: User = Depends(get_employer_admin)):
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.company_id == current_user.company_id)
        .order_by(Campaign.created_at.desc())
        .all()
    )

    live = [c for c in campaigns if c.status == "live"]
    scheduled = [c for c in campaigns if c.status == "scheduled"]
    convs = [float(c.conversion_pct or 0) for c in live] or [0]
    avg_conversion = round(sum(convs) / len(convs), 1)
    spend_mtd = sum(float(c.spend or 0) for c in campaigns)

    campaign_rows = [
        {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "description": c.description,
            "audience": c.audience_label,
            "reach": c.reach,
            "conversion_pct": float(c.conversion_pct or 0),
            "budget": float(c.budget or 0),
            "spend": float(c.spend or 0),
            "starts_at": c.starts_at,
        }
        for c in campaigns
    ]

    focal = max(live, key=lambda c: c.reach or 0) if live else (campaigns[0] if campaigns else None)
    funnel_block = None
    if focal:
        funnel = focal.funnel or {}
        funnel_block = {
            "campaign_id": focal.id,
            "campaign_name": focal.name,
            "delivered": funnel.get("delivered", 0),
            "opened": funnel.get("opened", 0),
            "tapped": funnel.get("tapped", 0),
            "redeemed": funnel.get("redeemed", 0),
            "cac": float(focal.cac) if focal.cac is not None else None,
            "roas": float(focal.roas) if focal.roas is not None else None,
        }

    today = datetime.now(timezone.utc).date()
    calendar = []
    for i in range(7):
        day = today + timedelta(days=i)
        day_campaigns = [
            {"id": c.id, "name": c.name, "status": c.status}
            for c in campaigns
            if c.starts_at and c.starts_at.date() == day
        ]
        calendar.append({"date": day.isoformat(), "campaigns": day_campaigns})

    return {
        "stats": {
            "live": len(live),
            "scheduled": len(scheduled),
            "avg_conversion_pct": avg_conversion,
            "spend_mtd": round(spend_mtd, 2),
        },
        "campaigns": campaign_rows,
        "funnel": funnel_block,
        "calendar": calendar,
    }


@router.get("/{campaign_id}/funnel")
def campaign_funnel(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_employer_admin),
):
    c = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.company_id == current_user.company_id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    funnel = c.funnel or {}
    return {
        "campaign_id": c.id,
        "campaign_name": c.name,
        "delivered": funnel.get("delivered", 0),
        "opened": funnel.get("opened", 0),
        "tapped": funnel.get("tapped", 0),
        "redeemed": funnel.get("redeemed", 0),
        "cac": float(c.cac) if c.cac is not None else None,
        "roas": float(c.roas) if c.roas is not None else None,
    }
