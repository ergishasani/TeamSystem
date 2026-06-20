from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # pending | accepted | revoked
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
