from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from app.core.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    city = Column(String, default="Tirana")
    country = Column(String(2), default="AL")
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    rating = Column(Numeric(3, 2), default=4.5)
    # active | inactive | pending
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
