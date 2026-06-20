from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date
from app.core.database import Base


class ShakeCredit(Base):
    __tablename__ = "shake_credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    credits = Column(Integer, default=5)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ShakeAttempt(Base):
    __tablename__ = "shake_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attempt_date = Column(Date, nullable=False)
    won = Column(Boolean, default=False)
    prize_type = Column(String, nullable=True)
    prize_description = Column(String, nullable=True)
    xp_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
