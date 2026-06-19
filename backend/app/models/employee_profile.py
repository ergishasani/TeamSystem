from sqlalchemy import Column, Integer, String, Numeric, JSON, ForeignKey
from app.core.database import Base


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String, nullable=True)
    monthly_budget = Column(Numeric(12, 2), default=0)
    used_amount = Column(Numeric(12, 2), default=0)
    pending_amount = Column(Numeric(12, 2), default=0)
    remaining_amount = Column(Numeric(12, 2), default=0)
    # stored as JSON list of category strings e.g. ["wellness", "food"]
    interests = Column(JSON, default=list)
    # e.g. "explorer", "wellness-seeker"
    benefit_style = Column(String, nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
