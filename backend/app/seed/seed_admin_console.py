"""
Backfills demo data for the three platform-admin console pages added after
the analytics/settings work: Team & Roles, Notifications (broadcasts +
templates), and Campaigns.

Additive only — safe to run once against an already-seeded demo database.
Idempotent: skips if the target company already has campaigns seeded.

Run with:
  python -m app.seed.seed_admin_console
"""
import sys
import os
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal

import app.models  # noqa: F401

from app.models.company import Company
from app.models.user import User
from app.models.invite import Invite
from app.models.broadcast import Broadcast, NotificationTemplate
from app.models.campaign import Campaign

random.seed(7)

ADMIN_ROLES = ["admin", "approver", "approver", "editor"]


def now():
    return datetime.now(timezone.utc)


def run(force: bool = False):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == 1).first()
        if not company:
            print("No company id=1 found, aborting.")
            return

        existing_campaigns = db.query(Campaign).filter(Campaign.company_id == company.id).count()
        if existing_campaigns > 0 and not force:
            print("Admin console demo data already exists. Use --force to reseed.")
            return

        # ── Team & Roles: assign permission roles, 2FA, last_active ─────────────
        users = (
            db.query(User)
            .filter(User.company_id == company.id)
            .order_by(User.id)
            .all()
        )

        admins = [u for u in users if u.role == "employer_admin"]
        employees = [u for u in users if u.role != "employer_admin"]

        if admins:
            admins[0].permission_role = "owner"
            for u in admins[1:]:
                u.permission_role = "admin"

        random.shuffle(employees)
        cursor = 0
        for tag, count in [("admin", 2), ("approver", 4), ("editor", 3)]:
            for u in employees[cursor:cursor + count]:
                u.permission_role = tag
            cursor += count
        for u in employees[cursor:]:
            u.permission_role = "viewer"

        all_users = admins + employees
        random.shuffle(all_users)
        coverage_target = int(round(len(all_users) * 0.78))
        for i, u in enumerate(all_users):
            u.two_factor_enabled = i < coverage_target
            days_ago = random.choice([0, 0, 1, 2, 3, 5, 9, 14])
            hours_ago = random.randint(0, 23)
            u.last_active_at = now() - timedelta(days=days_ago, hours=hours_ago)

        db.add(
            Invite(
                company_id=company.id,
                email="orion.dema@tiranatech.al",
                role="editor",
                invited_by_id=admins[0].id if admins else None,
                status="pending",
            )
        )
        db.add(
            Invite(
                company_id=company.id,
                email="silva.kola@tiranatech.al",
                role="viewer",
                invited_by_id=admins[0].id if admins else None,
                status="pending",
            )
        )

        # ── Notifications: broadcasts + templates ────────────────────────────────
        broadcast_defs = [
            ("Spring Wellness Drop", "push", "All employees", 2, 6240, 64.2, 1, "sent"),
            ("New Provider: Glow Studio", "email", "All employees", 3, 1980, 51.8, 0, "sent"),
            ("Weekly Digest #24", "email", "All employees", 5, 2940, 47.5, 2, "sent"),
            ("Wallet Cap Reminder", "push", "Near-cap employees", 1, 412, 71.0, 0, "sent"),
            ("Team Challenge Kickoff", "slack", "Engineering, Sales", 6, 116, 58.9, 0, "sent"),
            ("Summer Perks Preview", "push", "All employees", -2, 0, 0, 0, "scheduled"),
            ("New Hire Welcome Pack", "email", "New employees", None, 0, 0, 0, "draft"),
        ]
        for name, channel, audience, days_ago, sent_count, open_rate, unsub, status in broadcast_defs:
            sent_at = now() - timedelta(days=days_ago) if status == "sent" and days_ago is not None else None
            scheduled_at = now() - timedelta(days=days_ago) if status == "scheduled" and days_ago is not None else None
            db.add(
                Broadcast(
                    company_id=company.id,
                    name=name,
                    channel=channel,
                    audience_label=audience,
                    sent_count=sent_count,
                    open_rate_pct=open_rate,
                    unsubscribes=unsub,
                    status=status,
                    sent_at=sent_at,
                    scheduled_at=scheduled_at,
                )
            )

        template_defs = [
            ("Weekly digest", "email", 24, 2),
            ("Wallet cap reminder", "push", 18, 5),
            ("New drop alert", "push", 31, 1),
            ("Provider downtime notice", "email", 4, 20),
            ("Team challenge invite", "slack", 9, 12),
        ]
        for name, channel, sends, days_ago in template_defs:
            db.add(
                NotificationTemplate(
                    company_id=company.id,
                    name=name,
                    channel=channel,
                    sends_count=sends,
                    last_used_at=now() - timedelta(days=days_ago),
                )
            )

        prefs = dict(company.notification_prefs or {})
        prefs.setdefault("quiet_hours_start", "21:00")
        prefs.setdefault("quiet_hours_end", "08:00")
        prefs.setdefault("push_muted_during_quiet_hours", True)
        company.notification_prefs = prefs

        # ── Campaigns ─────────────────────────────────────────────────────────────
        campaign_defs = [
            (
                "Spring Wellness", "live", "All employees",
                "Push employees toward fitness & wellness offers ahead of summer.",
                14200, 31.0, 220000, 186400,
                {"delivered": 14200, "opened": 9840, "tapped": 5210, "redeemed": 2940},
                148.0, 3.4, -10,
            ),
            (
                "New Provider Blitz: Glow Studio", "live", "Design, Marketing",
                "Drive trial redemptions for the newly onboarded beauty provider.",
                3100, 22.4, 40000, 18900,
                {"delivered": 3100, "opened": 1860, "tapped": 940, "redeemed": 312},
                205.0, 2.1, -6,
            ),
            (
                "Wallet Cap Nudge", "live", "Near-cap employees",
                "Remind employees with low remaining balance to spend before reset.",
                620, 41.2, 8000, 4100,
                {"delivered": 620, "opened": 410, "tapped": 290, "redeemed": 178},
                89.0, 4.6, -3,
            ),
            (
                "Summer Perks Preview", "scheduled", "All employees",
                "Teaser campaign for the upcoming summer offer catalogue refresh.",
                0, 0, 60000, 0,
                {"delivered": 0, "opened": 0, "tapped": 0, "redeemed": 0},
                None, None, 3,
            ),
            (
                "Engineering Team Challenge", "draft", "Engineering",
                "Gamified swipe streak challenge to boost weekly engagement.",
                0, 0, 15000, 0,
                {"delivered": 0, "opened": 0, "tapped": 0, "redeemed": 0},
                None, None, 7,
            ),
        ]
        for (
            name, status, audience, desc, reach, conv, budget, spend,
            funnel, cac, roas, start_offset_days,
        ) in campaign_defs:
            db.add(
                Campaign(
                    company_id=company.id,
                    name=name,
                    description=desc,
                    audience_label=audience,
                    status=status,
                    reach=reach,
                    conversion_pct=conv,
                    budget=budget,
                    spend=spend,
                    funnel=funnel,
                    cac=cac,
                    roas=roas,
                    starts_at=now() + timedelta(days=start_offset_days),
                )
            )

        db.commit()
        print(f"Seeded admin console data for company {company.id}: "
              f"{len(all_users)} users tagged, 2 invites, "
              f"{len(broadcast_defs)} broadcasts, {len(template_defs)} templates, "
              f"{len(campaign_defs)} campaigns.")
    finally:
        db.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    run(force=force)
