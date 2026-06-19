from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    company_id: Optional[int] = None
    provider_id: Optional[int] = None
    language: str
    country: str
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None


class InterestsUpdate(BaseModel):
    interests: List[str]


class TasteProfile(BaseModel):
    interests: List[str]
    benefit_style: Optional[str]
    level: int
    xp: int
    streak_count: int
