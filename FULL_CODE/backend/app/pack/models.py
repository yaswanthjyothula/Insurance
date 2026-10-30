"""Typed views of the problem pack's files (products, riders, funds, advisors, customers)."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SaBand(BaseModel):
    min_sa_inr: int
    max_sa_inr: Optional[int] = None
    factor: float


class IncomeMultipleLimit(BaseModel):
    min_age: int
    max_age: int
    max_multiple_of_annual_income: int


class Product(BaseModel):
    product_id: str
    product_name: str
    product_type: str  # Term Life | Whole Life | Endowment | ULIP
    variant: str
    participation: str  # non_par | par | linked
    plain_language_summary: str
    min_entry_age: int
    max_entry_age: int
    max_maturity_age: int
    min_sum_assured_inr: Optional[int] = None
    max_sum_assured_inr: Optional[int] = None
    sum_assured_step_inr: Optional[int] = None
    policy_term_rule: str = ""
    allowed_policy_terms: str = ""
    min_policy_term_years: Optional[int] = None
    max_policy_term_years: Optional[int] = None
    premium_payment_options: List[str] = Field(default_factory=list)
    premium_payment_rules: Optional[str] = None
    premium_modes: List[str] = Field(default_factory=list)
    modal_factor_annual: Optional[float] = None
    modal_factor_half_yearly: Optional[float] = None
    modal_factor_quarterly: Optional[float] = None
    modal_factor_monthly: Optional[float] = None
    sa_band_factors: List[SaBand] = Field(default_factory=list)
    min_annual_premium_inr: Optional[int] = None
    max_annual_premium_inr: Optional[int] = None
    sa_multiple_of_annual_premium: Optional[Dict[str, List[float]]] = None
    min_annual_income_inr: int = 0
    income_multiple_limits: List[IncomeMultipleLimit] = Field(default_factory=list)
    max_new_non_term_sa_multiple_of_income: Optional[int] = None
    non_earning_applicant_allowed: bool = False
    non_earning_max_cover_inr: Optional[int] = None
    non_earning_max_multiple_of_spouse_income: Optional[int] = None
    riders_allowed: List[str] = Field(default_factory=list)
    ulip_fund_ids: List[str] = Field(default_factory=list)
    death_benefit: str = ""
    maturity_benefit: str = ""
    survival_benefits: str = ""
    key_features: str = ""
    key_exclusions: str = ""
    surrender_and_lock_in: str = ""
    lock_in_years: Optional[int] = None
    medical_underwriting: str = ""
    nri_eligible: bool = False
    illustrative_bonus_4pct_scenario_per_1000_sa_pa: Optional[float] = None
    illustrative_bonus_8pct_scenario_per_1000_sa_pa: Optional[float] = None
    ulip_charges: Optional[Dict[str, Any]] = None
    extra_rules: Optional[Dict[str, Any]] = None
    pricing_source: str = ""

    @property
    def is_ulip(self) -> bool:
        return self.product_type == "ULIP"

    @property
    def is_term(self) -> bool:
        return self.product_type == "Term Life"


class Rider(BaseModel):
    rider_id: str
    rider_name: str
    rider_category: str  # health | other | built_in
    benefit: str
    available_on_product_ids: List[str]
    min_entry_age: int
    max_entry_age: int
    max_cover_age: int
    min_rider_sa_inr: Optional[int] = None
    max_rider_sa_inr: Optional[int] = None
    max_rider_sa_pct_of_base_sa: Optional[int] = None
    rider_sa_rule: str = ""
    rate_basis: str  # per_1000_rider_sa | pct_of_base_annual_premium | included_free
    band_rates: Dict[str, Optional[float]] = Field(default_factory=dict)
    smoker_multiplier: float = 1.0
    max_premium_pct_of_base_premium: Optional[int] = None


class Fund(BaseModel):
    fund_id: str
    fund_name: str
    asset_class: str
    risk_level: str
    fmc_pct_pa: float
    objective: str


class Advisor(BaseModel):
    advisor_id: str
    advisor_name: str
    languages: List[str]
    specialisations: List[str]
    consultation_modes: List[str]
    years_experience: int
    rating: float
    review_count: int


class Slot(BaseModel):
    slot_id: str
    advisor_id: str
    slot_start: str  # ISO local time (IST)
    slot_end: str
    status: str  # available | booked


class Spouse(BaseModel):
    age: Optional[int] = None
    working: bool = False
    annual_income_inr: int = 0


class Liability(BaseModel):
    loan_type: str
    outstanding_principal_inr: int = 0
    remaining_tenure_months: Optional[int] = None
    interest_rate_pct: Optional[float] = None
    emi_inr: Optional[int] = None


class Goal(BaseModel):
    goal_id: str
    goal_type: str
    beneficiary: str = ""
    target_amount_today_inr: int
    target_year: int
    priority: str = "medium"


class Profile(BaseModel):
    profile_id: str
    full_name: str
    age: int
    gender: str
    city: str = ""
    residency_status: str = "resident"
    marital_status: str = ""
    employment_type: str = ""
    occupation: str = ""
    annual_income_inr: int = 0
    expected_income_growth_pct: float = 6.0
    monthly_household_expenses_inr: int = 0
    spouse: Optional[Spouse] = None
    children_ages: List[int] = Field(default_factory=list)
    parent_ages: List[int] = Field(default_factory=list)
    liabilities: List[Liability] = Field(default_factory=list)
    employer_group_cover_inr: int = 0
    individual_cover_inr: int = 0
    liquid_savings_inr: int = 0
    market_investments_inr: int = 0
    retirement_savings_inr: int = 0
    goals: List[Goal] = Field(default_factory=list)
    smoker_status: str = "non_smoker"
    bmi: Optional[float] = None
    health_conditions: List[str] = Field(default_factory=list)
    risk_appetite: str = "moderate"
    monthly_premium_budget_inr: int = 0
    preferred_policy_term_years: Optional[int] = None
    profile_date: str = ""


class Assumptions(BaseModel):
    """Defaults from reference_assumptions.json. Every value can be overridden per request."""

    general_inflation_pct_pa: float = 5.5
    education_inflation_pct_pa: float = 8.0
    post_tax_return_on_payout_pct_pa: float = 7.0
    default_income_growth_pct_pa: float = 6.0
    retirement_age: int = 60
    self_consumption_share_of_income_pct: float = 30
    household_expense_share_of_deceased_pct: float = 25
    child_dependency_end_age: int = 25
    life_expectancy_age: int = 85
    emergency_fund_months: int = 6
    final_expenses_inr: int = 150000
    homemaker_services_value_annual_inr: int = 300000
    count_employer_group_cover: bool = True
    count_retirement_savings_as_available_assets: bool = False
    cover_rounding_inr: int = 500000
    benefit_illustration_gross_returns_pct: List[float] = Field(default_factory=lambda: [4.0, 8.0])
