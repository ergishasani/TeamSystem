from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Boolean
from app.core.database import Base


class DailyDeal(Base):
    __tablename__ = "daily_deals"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False)
    deal_date = Column(Date, nullable=False, unique=True, index=True)
    deal_price = Column(Numeric(12, 2), nullable=True)
    quantity_limit = Column(Integer, nullable=True)
    quantity_claimed = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
