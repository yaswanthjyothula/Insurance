from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class InsuranceProduct(BaseModel):
    id: str
    name: str
    insurer: str
    category: str # term, life, health, general, investment_linked, business, other
    tagline: str
    min_entry_age: Optional[int] = 18  # None = not confirmed
    max_entry_age: Optional[int] = 65
    min_annual_income: float = 300000.0
    min_sum_assured: float = 2500000.0
    max_sum_assured: float = 100000000.0
    claim_settlement_ratio: Optional[float] = 98.5 # e.g. 98.5% (None when not published / not found)
    solvency_ratio: Optional[float] = 1.95 # IRDAI minimum is 1.50 (None when not found)
    base_rate_per_lakh: float = 120.0 # Indicative annual premium rate per ₹1 Lakh sum assured
    key_features: List[str]
    riders_available: List[str]
    exclusions: List[str]
    source_provenance: str = "Verified Regulatory Filing / Insurer Disclosure"
    is_synthetic_demonstration: bool = False

    # --- Sourced plan facts (populated for the verified term-plan catalogue) ---
    data_status: str = "unverified_sample"  # "sourced" | "unverified_sample"
    uin: Optional[str] = None
    as_of: Optional[str] = None  # date the facts were last checked
    min_term_years: Optional[int] = None
    max_term_years: Optional[int] = None
    max_maturity_age: Optional[int] = None
    death_benefit_options: List[str] = Field(default_factory=list)
    premium_payment_options: List[str] = Field(default_factory=list)
    has_smoker_rates: Optional[bool] = None
    brochure_url: Optional[str] = None
    product_page_url: Optional[str] = None
    quote_url: Optional[str] = None  # insurer's own calculator for an exact price
    claim_ratio_basis: Optional[str] = None  # e.g. "Individual death claims, by number, FY 2023-24"
    claim_ratio_source_url: Optional[str] = None
    solvency_basis: Optional[str] = None
    solvency_source_url: Optional[str] = None
    sum_assured_note: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    sample_premium: Optional[Dict[str, Any]] = None  # an official sample premium published by the insurer
    unconfirmed_fields: List[str] = Field(default_factory=list)  # facts we could not confirm from an official page

class RecommendationRequest(BaseModel):
    age: int = Field(..., ge=18, le=75)
    annual_income: float = Field(..., ge=0)
    coverage_gap: float = Field(..., ge=0)
    dependents_count: int = Field(0, ge=0)
    desired_tenure_years: int = Field(30, ge=5, le=50)
    smoker_status: bool = False
    preferred_category: Optional[str] = "term"
    budget_monthly: Optional[float] = None
    preferred_features: List[str] = Field(default_factory=list)
    priority: str = Field("balanced", description="balanced | lowest_cost | strongest_insurer | most_features")

class ScoreFactor(BaseModel):
    key: str
    label: str
    weight: float  # share of the total score, sums to 1.0
    score: float  # 0.0 to 1.0 for this factor
    detail: str  # plain-language reason with the fact it used

class RankedRecommendation(BaseModel):
    rank: int
    product: InsuranceProduct
    suitability_score: float # 0.0 to 1.0 weighted match score
    match_percent: int = 0
    score_breakdown: List[ScoreFactor] = Field(default_factory=list)
    suggested_sum_assured: float = 0.0
    suggested_term_years: int = 0
    premium_is_estimate: bool = True
    eligibility_status: str # "eligible" or "unsuitable_criteria"
    estimated_annual_premium: float
    estimated_monthly_premium: float
    rule_percent: int = 0  # transparent rule score, 0 to 100
    model_percent: Optional[int] = None  # trained model fit to the user's priority, 100 = best of the eligible plans
    grounded_explanation: str
    pros: List[str]
    cons: List[str]

class RecommendationResponse(BaseModel):
    recommendation_id: str
    model_version: str
    recommendations: List[RankedRecommendation]
    total_evaluated: int
    eligible_count: int
    methodology_note: str
    ranking_method: str = "rules"  # "rules" or "rules+trained-model"

class ProductCompareRequest(BaseModel):
    product_ids: List[str]
    target_sum_assured: float = 10000000.0 # Default ₹1 Cr
    tenure_years: int = 30
    age: Optional[int] = None
    smoker_status: bool = False

class ComparedProductItem(BaseModel):
    product: InsuranceProduct
    estimated_annual_premium: float
    estimated_monthly_premium: float
    fit_summary: str
    key_tradeoffs: List[str]

class ProductCompareResponse(BaseModel):
    compared_products: List[ComparedProductItem]
    target_sum_assured: float
    tenure_years: int
    comparison_summary: str

