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
    # Optional — insights are always scoped to the authenticated employer's company.
    company_id: Optional[int] = None


class CategorySpend(BaseModel):
    category: str
    total: float


class EmployerInsightResponse(BaseModel):
    top_categories: List[str]
    category_spend: List[CategorySpend]
    avg_spend: float
    approval_rate: float
    total_requests: int
    pending_total: float
    approved_total: float
    avg_budget_utilization: float
    insight: str
