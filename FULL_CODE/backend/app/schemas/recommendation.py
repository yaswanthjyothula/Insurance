"""Request and response shapes for the product recommendation engine."""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.financial import AssessmentInput
from app.schemas.quote import Applicant, Quote

Priority = Literal["balanced", "lowest_cost", "goal_savings", "growth"]
Risk = Literal["low", "medium", "high"]


class RecommendRequest(BaseModel):
    assessment: AssessmentInput
    applicant: Applicant
    monthly_budget: Optional[int] = Field(
        None, ge=0, le=10_000_000, description="What the customer can pay per month; empty means no limit"
    )
    preferred_term_years: Optional[int] = Field(None, ge=5, le=60)
    risk_appetite: Risk = "medium"
    priority: Priority = "balanced"
    liquid_investable: int = Field(0, ge=0, le=10_000_000_000, description="Savings that could go into a one-time investment")
    goal_types: List[str] = Field(
        default_factory=list,
        max_length=12,
        description="child_education, child_marriage, house_purchase, parents_care, retirement",
    )


class Factor(BaseModel):
    key: str
    label: str
    weight: float
    score: float
    detail: str


class ProductFit(BaseModel):
    product_id: str
    product_name: str
    product_type: str
    variant: str
    summary: str
    eligible: bool
    issues: List[str] = Field(default_factory=list)
    role: str = ""  # core protection | goal funding | long-term growth | lifelong cover | alternative
    rank: int = 0
    match_percent: int = 0
    rule_percent: int = 0
    model_percent: Optional[int] = None
    factors: List[Factor] = Field(default_factory=list)
    reason: str = ""
    quote: Optional[Quote] = None
    in_basket: bool = False
    fund_id: Optional[str] = None
    sa_multiple: Optional[float] = None


class Basket(BaseModel):
    items: List[ProductFit]
    total_monthly: int
    total_cover: int
    budget_monthly: Optional[int] = None
    within_budget: bool = True
    cover_shortfall: int = 0
    notes: List[str] = Field(default_factory=list)


class RecommendResponse(BaseModel):
    recommended_cover: int
    coverage_gap: int
    term_years: int
    budget_monthly: Optional[int]
    products: List[ProductFit]
    basket: Basket
    ranking_method: str
    methodology_note: str
    type_counts: Dict[str, int] = Field(default_factory=dict)
