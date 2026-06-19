from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime
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
