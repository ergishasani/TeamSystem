from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from app.core.database import Base


class BenefitRequest(Base):
    __tablename__ = "benefit_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    collaboration_id = Column(Integer, ForeignKey("provider_collaborations.id"), nullable=True)
    # package | single_offer | collab
    request_type = Column(String, nullable=False, default="package")
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="ALL")
    # pending | approved | rejected | cancelled
    status = Column(String, default="pending")
    ai_reason = Column(String, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String, nullable=True)
