"""The admin configuration: every business rule an administrator may change, strictly validated (Pydantic v2).

This is the single source of truth for configurable rules. The calculation engines read the active, validated snapshot of it and
nothing else, so nothing here may be hard-coded again in a service.
"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Category = Literal["Term Life", "Whole Life", "Endowment", "ULIP"]
PRODUCT_ID = r"^PRD-[A-Z0-9]{4,12}$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class NeedsConfig(Strict):
    """Percentages are plain numbers: 7 means 7%."""

    income_replacement_multiple_min: float = Field(
        ..., ge=1, le=50, description="Lowest rule-of-thumb cover, as a multiple of annual income"
    )
    income_replacement_multiple_max: float = Field(
        ..., ge=1, le=50, description="Highest rule-of-thumb cover, as a multiple of annual income"
    )
    inflation_rate: float = Field(..., ge=1, le=15, description="Yearly household inflation, percent")
    discount_rate: float = Field(..., ge=2, le=18, description="Yearly post-tax return on the payout, percent")
    deceased_expense_reduction_factor: float = Field(
        ..., ge=0, le=80, description="Share of household spending that stops when the earner dies, percent"
    )
    emergency_fund_months: int = Field(..., ge=0, le=36, description="Months of expenses kept as an emergency reserve")

    @model_validator(mode="after")
    def _ordered(self):
        if self.income_replacement_multiple_min > self.income_replacement_multiple_max:
            raise ValueError("The minimum income multiple cannot be above the maximum.")
        return self


class UnderwritingConfig(Strict):
    non_medical_sum_assured_limit: int = Field(..., gt=0, le=10_000_000_000)
    non_medical_maximum_age: int = Field(..., ge=18, le=80)
    tele_medical_threshold: int = Field(..., gt=0, le=10_000_000_000)
    physical_medical_threshold: int = Field(..., gt=0, le=10_000_000_000)
    stp_enabled: bool = True
    stp_maximum_sum_assured: int = Field(..., gt=0, le=10_000_000_000)
    stp_maximum_age: int = Field(..., ge=18, le=80)
    stp_allow_smokers: bool = False

    @model_validator(mode="after")
    def _ordered(self):
        if not self.non_medical_sum_assured_limit <= self.tele_medical_threshold <= self.physical_medical_threshold:
            raise ValueError("Thresholds must rise: non-medical limit, then tele-medical, then physical medical.")
        if self.stp_maximum_sum_assured > self.non_medical_sum_assured_limit:
            raise ValueError(
                "Straight-through processing only applies to non-medical cover, so its limit cannot exceed the non-medical limit."
            )
        if self.stp_maximum_age > self.non_medical_maximum_age:
            raise ValueError("The straight-through age limit cannot exceed the maximum non-medical age.")
        return self


class GenderFactors(Strict):
    male: float = Field(1.0, ge=0.5, le=1.5)
    female: float = Field(1.0, ge=0.5, le=1.5)


class ProductConfig(Strict):
    product_id: str = Field(..., pattern=PRODUCT_ID)
    product_name: str = Field(..., min_length=3, max_length=80)
    category: Category
    active: bool = True
    minimum_entry_age: int = Field(..., ge=0, le=99)
    maximum_entry_age: int = Field(..., ge=1, le=99)
    minimum_maturity_age: int = Field(..., ge=1, le=120)
    maximum_maturity_age: int = Field(..., ge=1, le=120)
    minimum_tenure: int = Field(..., ge=1, le=99)
    maximum_tenure: int = Field(..., ge=1, le=99)
    minimum_sum_assured: int = Field(..., gt=0, le=10_000_000_000)
    maximum_sum_assured: int = Field(..., gt=0, le=10_000_000_000)
    maximum_income_multiple: Optional[float] = Field(
        None, gt=0, le=100, description="Overrides the pack's income-multiple cap at every age"
    )
    base_rate_per_1000: Optional[float] = Field(
        None, gt=0, le=10_000, description="Annual premium per Rs 1,000 of cover at the reference point"
    )
    reference_rate_per_1000: Optional[float] = Field(None, gt=0, description="The pack's own rate at the reference point (read only)")
    age_loading_percentage_per_year: float = Field(
        3.0, ge=0, le=10, description="Admin-created products only: rate rises this much for each year above 30"
    )
    smoker_loading_percentage: float = Field(0.0, ge=0, le=100)
    gender_discount_factors: GenderFactors = Field(default_factory=GenderFactors)
    allowed_riders: List[str] = Field(default_factory=list, max_length=12)
    custom: bool = False

    @field_validator("product_name")
    @classmethod
    def _clean(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def _consistent(self):
        if not self.minimum_entry_age < self.maximum_entry_age:
            raise ValueError("The minimum entry age must be lower than the maximum entry age.")
        if self.minimum_maturity_age > self.maximum_maturity_age:
            raise ValueError("The minimum maturity age cannot be above the maximum.")
        if self.minimum_tenure > self.maximum_tenure:
            raise ValueError("The minimum tenure cannot be above the maximum tenure.")
        if self.minimum_sum_assured > self.maximum_sum_assured:
            raise ValueError("The minimum sum assured cannot be above the maximum.")
        if self.category != "ULIP" and self.base_rate_per_1000 is None:
            raise ValueError("A rate per Rs 1,000 is required.")
        if self.category == "ULIP" and self.base_rate_per_1000 is not None:
            raise ValueError("ULIPs are priced from the premium the customer chooses, so they have no rate per Rs 1,000.")
        if len(set(self.allowed_riders)) != len(self.allowed_riders):
            raise ValueError("A rider is listed twice.")
        return self


class AdminConfig(Strict):
    version: int = Field(..., ge=1)
    updated_at: str
    updated_by: str
    needs: NeedsConfig
    underwriting: UnderwritingConfig
    products: List[ProductConfig]

    @model_validator(mode="after")
    def _unique(self):
        ids = [p.product_id for p in self.products]
        if len(set(ids)) != len(ids):
            raise ValueError("Product IDs must be unique.")
        return self


# ---- updates ----


class NeedsPatch(Strict):
    income_replacement_multiple_min: Optional[float] = None
    income_replacement_multiple_max: Optional[float] = None
    inflation_rate: Optional[float] = None
    discount_rate: Optional[float] = None
    deceased_expense_reduction_factor: Optional[float] = None
    emergency_fund_months: Optional[int] = None


class UnderwritingPatch(Strict):
    non_medical_sum_assured_limit: Optional[int] = None
    non_medical_maximum_age: Optional[int] = None
    tele_medical_threshold: Optional[int] = None
    physical_medical_threshold: Optional[int] = None
    stp_enabled: Optional[bool] = None
    stp_maximum_sum_assured: Optional[int] = None
    stp_maximum_age: Optional[int] = None
    stp_allow_smokers: Optional[bool] = None


class GenderFactorsPatch(Strict):
    male: Optional[float] = None
    female: Optional[float] = None


class ProductPatch(Strict):
    """Any subset of a product's rules. The ID and category are fixed once a product exists."""

    product_name: Optional[str] = None
    active: Optional[bool] = None
    minimum_entry_age: Optional[int] = None
    maximum_entry_age: Optional[int] = None
    minimum_maturity_age: Optional[int] = None
    maximum_maturity_age: Optional[int] = None
    minimum_tenure: Optional[int] = None
    maximum_tenure: Optional[int] = None
    minimum_sum_assured: Optional[int] = None
    maximum_sum_assured: Optional[int] = None
    maximum_income_multiple: Optional[float] = None
    clear_income_multiple: bool = False
    base_rate_per_1000: Optional[float] = None
    age_loading_percentage_per_year: Optional[float] = None
    smoker_loading_percentage: Optional[float] = None
    gender_discount_factors: Optional[GenderFactorsPatch] = None
    allowed_riders: Optional[List[str]] = None


class ProductPatchWithId(ProductPatch):
    product_id: str


class ConfigPatch(Strict):
    needs: Optional[NeedsPatch] = None
    underwriting: Optional[UnderwritingPatch] = None
    products: Optional[List[ProductPatchWithId]] = None
    expected_version: Optional[int] = Field(None, ge=1, description="Refuse the update if the active version has moved on")
    note: Optional[str] = Field(None, max_length=200)


class RollbackRequest(Strict):
    version: int = Field(..., ge=1)
    expected_version: Optional[int] = Field(None, ge=1)


# ---- responses ----


class ProductView(ProductConfig):
    rate_matrix_entry_ages: Optional[List[int]] = None  # youngest and oldest age the pack's rate table prices (catalogue products)


class ConfigView(BaseModel):
    version: int
    updated_at: str
    updated_by: str
    needs: NeedsConfig
    underwriting: UnderwritingConfig
    products: List[ProductView]
    available_riders: List[Dict[str, str]]
    categories: List[str]


class ChangeResult(BaseModel):
    version: int
    updated_at: str
    changed_fields: List[str]
    activation_ms: float
    persisted_ms: float
    config: ConfigView


class HistoryEntry(BaseModel):
    version: int
    at: str
    actor: str
    summary: str
    changed_fields: List[str]
