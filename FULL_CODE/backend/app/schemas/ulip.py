from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.quote import Applicant


class UlipProjectionRequest(BaseModel):
    product_id: str = Field(..., max_length=32)
    applicant: Applicant
    annual_premium: int = Field(..., ge=1, le=1_000_000_000)
    sa_multiple: float = Field(..., ge=0, le=50)
    policy_term_years: int = Field(..., ge=1, le=60)
    payment_option: str = Field("regular", max_length=16)
    fund_id: str = Field(..., max_length=32)
    gross_return_pct: Optional[float] = Field(None, ge=0, le=20, description="Defaults to the 4% and 8% illustration scenarios")


class UlipYear(BaseModel):
    year: int
    premiums_paid: int
    fund_value: int
    death_benefit: int


class UlipScenario(BaseModel):
    gross_return_pct: float
    net_return_pct: float
    maturity_value: int
    total_premiums: int
    total_charges: int
    years: List[UlipYear]


class UlipProjection(BaseModel):
    product_name: str
    fund_name: str
    sum_assured: int
    scenarios: List[UlipScenario]
    note: str
