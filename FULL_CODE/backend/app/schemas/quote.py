"""Request and response shapes for premium quotes and eligibility."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Gender = Literal["male", "female"]
Mode = Literal["annual", "half_yearly", "quarterly", "monthly"]


class Applicant(BaseModel):
    age: int = Field(..., ge=18, le=75)
    gender: Gender
    smoker: bool = False
    annual_income: int = Field(0, ge=0, le=1_000_000_000)
    residency: Literal["resident", "nri"] = "resident"
    spouse_working: bool = False
    spouse_annual_income: int = Field(0, ge=0, le=1_000_000_000)
    existing_individual_cover: int = Field(0, ge=0, le=10_000_000_000)
    youngest_child_age: Optional[int] = Field(None, ge=0, le=40)


class RiderChoice(BaseModel):
    rider_id: str = Field(..., max_length=32)
    sum_assured: Optional[int] = Field(None, ge=0, le=1_000_000_000)


class QuoteRequest(BaseModel):
    product_id: str = Field(..., max_length=32)
    applicant: Applicant
    sum_assured: Optional[int] = Field(None, ge=0, le=10_000_000_000)
    policy_term_years: Optional[int] = Field(None, ge=1, le=99)
    payment_option: str = Field("regular", max_length=16)
    mode: Mode = "monthly"
    riders: List[RiderChoice] = Field(default_factory=list, max_length=6)
    # ULIP only: premium chosen by the customer and the multiple of it that becomes the sum assured
    annual_premium: Optional[int] = Field(None, ge=0, le=1_000_000_000)
    sa_multiple: Optional[float] = Field(None, ge=0, le=50)
    fund_id: Optional[str] = Field(None, max_length=32)


class RiderLine(BaseModel):
    rider_id: str
    rider_name: str
    sum_assured: Optional[int] = None
    annual_premium: float
    instalment: int


class Quote(BaseModel):
    product_id: str
    product_name: str
    product_type: str
    valid: bool
    issues: List[str] = Field(default_factory=list)
    sum_assured: int = 0
    policy_term_years: int = 0
    premium_paying_term_years: int = 0
    payment_option: str = "regular"
    mode: str = "monthly"
    rate_per_1000: Optional[float] = None
    band_factor: Optional[float] = None
    base_annual_premium: float = 0.0
    base_instalment: int = 0
    riders: List[RiderLine] = Field(default_factory=list)
    total_annual_premium: float = 0.0
    total_instalment: int = 0
    allowed_terms: List[int] = Field(default_factory=list)
    max_sum_assured_for_applicant: Optional[int] = None


class BasketItem(BaseModel):
    product_id: str = Field(..., max_length=32)
    sum_assured: int = Field(..., ge=0, le=10_000_000_000)


class BasketCheckRequest(BaseModel):
    applicant: Applicant
    items: List[BasketItem] = Field(..., min_length=1, max_length=8)


class BasketCheck(BaseModel):
    valid: bool
    issues: List[str] = Field(default_factory=list)
    total_new_cover: int = 0
    cover_cap: Optional[int] = None
