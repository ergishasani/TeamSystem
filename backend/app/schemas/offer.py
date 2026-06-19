from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProviderOut(BaseModel):
    id: int
    name: str
    category: str
    city: str
    country: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    rating: float
    status: str

    model_config = {"from_attributes": True}


class OfferOut(BaseModel):
    id: int
    provider_id: int
    title: str
    description: Optional[str] = None
    category: str
    price: float
    currency: str
    city: str
    country: str
    discount_percent: float
    quantity_available: Optional[int] = None
    valid_until: Optional[datetime] = None
    is_limited_drop: bool
    image_url: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OfferListResponse(BaseModel):
    items: list[OfferOut]
    total: int
