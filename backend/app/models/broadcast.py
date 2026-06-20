from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from app.core.database import Base


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    # push | email | slack
    channel = Column(String, nullable=False, default="push")
    audience_label = Column(String, nullable=False, default="All employees")
    sent_count = Column(Integer, default=0)
    open_rate_pct = Column(Numeric(5, 2), default=0)
    unsubscribes = Column(Integer, default=0)
    # sent | scheduled | draft
    status = Column(String, nullable=False, default="draft")
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    channel = Column(String, nullable=False, default="push")
    sends_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
