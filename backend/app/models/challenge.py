from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from app.core.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    # streak | spending | category
    type = Column(String, nullable=False)
    # optional offer category this challenge targets; null = any category counts
    category = Column(String, nullable=True)
    goal = Column(Numeric(12, 2), nullable=True)
    reward = Column(Integer, default=100)  # XP reward
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)


class ChallengeProgress(Base):
    __tablename__ = "challenge_progress"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    progress = Column(Numeric(12, 2), default=0)
    completed = Column(Boolean, default=False)
