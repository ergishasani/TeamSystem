from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BenefitRequestCreate(BaseModel):
    package_id: Optional[int] = None
    offer_id: Optional[int] = None
    request_type: str = "package"
    ai_reason: Optional[str] = None


class BenefitRequestOut(BaseModel):
    id: int
    employee_id: int
    company_id: int
    package_id: Optional[int] = None
    offer_id: Optional[int] = None
    request_type: str
    total_amount: float
    currency: str
    status: str
    ai_reason: Optional[str] = None
    submitted_at: datetime
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    rejection_reason: Optional[str] = None
