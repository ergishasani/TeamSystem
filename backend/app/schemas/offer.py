from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OfferCreate(BaseModel):
    title: str
    category: str
    price: float = Field(gt=0)
    description: Optional[str] = None
    currency: str = "ALL"
    city: str = "Tirana"
    country: str = "AL"
    discount_percent: float = Field(default=0, ge=0, le=100)
    quantity_available: Optional[int] = Field(default=None, ge=0)
    valid_until: Optional[datetime] = None
    is_limited_drop: bool = False
    image_url: Optional[str] = None
    status: str = "active"


class OfferUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None
    currency: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)
    quantity_available: Optional[int] = Field(default=None, ge=0)
    valid_until: Optional[datetime] = None
    is_limited_drop: Optional[bool] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


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
    offer_count: int = 0

    model_config = {"from_attributes": True}


class OfferOut(BaseModel):
    id: int
    provider_id: int
    provider_name: Optional[str] = None
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
