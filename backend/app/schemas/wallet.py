from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class WalletOut(BaseModel):
    monthly_budget: float
    used_amount: float
    pending_amount: float
    remaining_amount: float
    currency: str
    level: int
    xp: int
    streak_count: int


class WalletHistoryItem(BaseModel):
    id: int
    title: Optional[str] = None
    request_type: str
    total_amount: float
    currency: str
    status: str
    submitted_at: datetime

    model_config = {"from_attributes": True}
