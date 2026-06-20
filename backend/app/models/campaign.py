from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, JSON
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    audience_label = Column(String, nullable=True)
    # live | scheduled | draft | ended
    status = Column(String, nullable=False, default="draft")
    reach = Column(Integer, default=0)
    conversion_pct = Column(Numeric(5, 2), default=0)
    budget = Column(Numeric(12, 2), default=0)
    spend = Column(Numeric(12, 2), default=0)
    # {"delivered": n, "opened": n, "tapped": n, "redeemed": n}
    funnel = Column(JSON, default=dict)
    cac = Column(Numeric(10, 2), nullable=True)
    roas = Column(Numeric(6, 2), nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
