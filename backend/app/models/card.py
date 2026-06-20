from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_type = Column(String, nullable=False, default="debit")  # debit | credit
    brand = Column(String, nullable=True, default="Visa")        # Visa | Mastercard | Amex | Other
    last_four = Column(String(4), nullable=False)
    expiry = Column(String(5), nullable=True)                    # MM/YY
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="cards")
