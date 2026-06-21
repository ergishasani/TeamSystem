from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


CATEGORIES = ("environment", "education", "health", "community", "animals", "children", "other")


class CharityOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: str
    company_id: Optional[int] = None
    is_platform_wide: bool
    is_active: bool

    model_config = {"from_attributes": True}


class CharityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: str = "other"
    is_platform_wide: bool = False


class CharityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class DonationCreate(BaseModel):
    charity_id: int
    # Exactly one of these decides how much to give.
    amount: Optional[float] = Field(default=None, gt=0)
    # 1-100; donate this % of remaining balance when amount is omitted.
    percent_of_remaining: Optional[int] = Field(default=None, ge=1, le=100)
    donate_full_remaining: bool = False


class CharitySuggestionCreate(BaseModel):
    charity_name: str
    charity_website: Optional[str] = None
    reason: Optional[str] = None


class CharitySuggestionOut(BaseModel):
    id: int
    suggested_by_user_id: int
    company_id: int
    charity_name: str
    charity_website: Optional[str] = None
    reason: Optional[str] = None
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CharitySuggestionReview(BaseModel):
    # approved | rejected
    status: str


# ── Employer donations dashboard ──────────────────────────────────────────────

class CharityBreakdown(BaseModel):
    charity_id: Optional[int] = None
    charity_name: str
    category: str
    total: float
    count: int


class DonationStats(BaseModel):
    currency: str
    total_donated_this_month: float
    total_donated_all_time: float
    donor_count: int
    pending_count: int
    pending_amount: float
    employer_match_paid: float
    by_charity: List[CharityBreakdown]
    by_category: List[CharityBreakdown]
