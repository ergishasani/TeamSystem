from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # role: employee | employer_admin | provider_admin
    role = Column(String, nullable=False, default="employee")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    language = Column(String(5), default="sq")
    country = Column(String(2), default="AL")
    currency = Column(String(3), default="ALL")
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # admin-console permission tag: owner | admin | approver | editor | viewer
    permission_role = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
