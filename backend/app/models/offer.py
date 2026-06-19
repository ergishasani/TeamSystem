from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from app.core.database import Base


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="ALL")
    city = Column(String, default="Tirana")
    country = Column(String(2), default="AL")
    discount_percent = Column(Numeric(5, 2), default=0)
    quantity_available = Column(Integer, nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_limited_drop = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    # active | inactive | draft
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
