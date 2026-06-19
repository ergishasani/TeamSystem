from typing import List, Optional
from pydantic import BaseModel


class ConciergeRequest(BaseModel):
    message: str
    budget: Optional[float] = None


class ConciergeResponse(BaseModel):
    reply: str
    suggested_categories: List[str] = []
    suggested_package_title: Optional[str] = None


class GeneratePackageRequest(BaseModel):
    message: str
    budget: Optional[float] = None


class RecommendedOffer(BaseModel):
    offer_id: int
    title: str
    category: str
    price: float
    currency: str
    reason: str


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendedOffer]


class EmployerInsightRequest(BaseModel):
    company_id: int


class EmployerInsightResponse(BaseModel):
    top_categories: List[str]
    avg_spend: float
    insight: str
