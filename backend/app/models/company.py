from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, JSON, Text
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String(2), default="AL")
    currency = Column(String(3), default="ALL")
    monthly_budget_per_employee = Column(Numeric(12, 2), default=15000)
    approval_required_above = Column(Numeric(12, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # ── Workspace identity ──────────────────────────────────────────────────
    trading_name = Column(String, nullable=True)
    city = Column(String, nullable=True, default="Tirana")
    support_email = Column(String, nullable=True)
    support_phone = Column(String, nullable=True)
    logo_url = Column(Text, nullable=True)
    # {"primary": "#0b1416", "accent": "#c4f24a", "light": "#f5f3ee", "warn": "#fbbf24"}
    brand_colors = Column(JSON, default=dict)

    # ── Localization defaults applied to employees ──────────────────────────
    language = Column(String(5), default="sq")
    timezone = Column(String, default="Europe/Tirane")
    week_start = Column(String(10), default="monday")
    number_format = Column(String(20), default="space_comma")  # "1 234,56"

    # ── Operational policies ─────────────────────────────────────────────────
    # {"auto_approve_under": 2500, "require_signoff_above": 10000,
    #  "lock_wallet_at_cap": false, "ai_bundle_suggestions": true}
    policies = Column(JSON, default=dict)

    # ── Notification preferences ─────────────────────────────────────────────
    # {"new_requests": true, "daily_drop_recap": true,
    #  "provider_downtime": true, "weekly_digest": false}
    notification_prefs = Column(JSON, default=dict)

    # ── Security policies ─────────────────────────────────────────────────────
    # {"enforce_sso": true, "require_2fa_admins": true, "ip_allowlist": false,
    #  "last_security_review": "2026-06-12"}
    security_prefs = Column(JSON, default=dict)
