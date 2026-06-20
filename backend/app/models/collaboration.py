from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from app.core.database import Base


class ProviderCollaboration(Base):
    __tablename__ = "provider_collaborations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    total_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="ALL")
    city = Column(String, default="Tirana")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CollaborationItem(Base):
    __tablename__ = "collaboration_items"

    id = Column(Integer, primary_key=True, index=True)
    collaboration_id = Column(Integer, ForeignKey("provider_collaborations.id"), nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    price_share = Column(Numeric(12, 2), nullable=False)
