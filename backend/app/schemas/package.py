from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PackageItemOut(BaseModel):
    id: int
    offer_id: int
    provider_id: int
    price_share: float
    category: str = "wellness"
    offer_title: Optional[str] = None
    provider_name: Optional[str] = None
    valid_until: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PackageOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    total_price: float
    currency: str
    city: str
    country: str
    created_by: Optional[int] = None
    ai_reason: Optional[str] = None
    created_at: datetime
    items: List[PackageItemOut] = []

    model_config = {"from_attributes": True}


class PackageCreate(BaseModel):
    title: str
    description: Optional[str] = None
    offer_ids: List[int]
    ai_reason: Optional[str] = None
