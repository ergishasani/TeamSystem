from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from app.core.database import Base


class Charity(Base):
    __tablename__ = "charities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    # environment | education | health | community | animals | children | other
    category = Column(String, nullable=False, default="other")
    # null company_id + is_platform_wide => available to every company
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    is_platform_wide = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CharitySuggestion(Base):
    __tablename__ = "charity_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    suggested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    charity_name = Column(String, nullable=False)
    charity_website = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    # pending | approved | rejected
    status = Column(String, nullable=False, default="pending")
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
