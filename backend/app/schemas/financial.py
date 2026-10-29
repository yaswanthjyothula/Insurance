from typing import List, Optional
from pydantic import BaseModel, Field

class FutureGoal(BaseModel):
    name: str = Field(..., description="Name of the goal, e.g. Child Higher Education")
    cost_today: float = Field(..., ge=0, description="Estimated cost in today's money")
    years_away: int = Field(..., ge=0, le=40, description="Years until the expenditure occurs")
    category: str = Field("education", description="education, marriage, property, or other")

class AssessmentInput(BaseModel):
    age: int = Field(..., ge=18, le=75, description="Current age in years")
    annual_income: float = Field(..., ge=0, description="Annual take-home or net income in INR")
    annual_expenses: float = Field(..., ge=0, description="Annual household living expenditure in INR")
    dependents_count: int = Field(..., ge=0, le=10, description="Number of financial dependents")
    support_horizon_years: Optional[int] = Field(None, ge=1, le=50, description="Years dependents need support")
    outstanding_liabilities: float = Field(0.0, ge=0, description="Total outstanding debt (loans/mortgages)")
    existing_cover: float = Field(0.0, ge=0, description="Current active life insurance sum assured")
    eligible_assets: float = Field(0.0, ge=0, description="Liquid/semi-liquid financial assets (excluding primary residence)")
    immediate_expenses: Optional[float] = Field(None, ge=0, description="Emergency fund buffer & estate transition costs")
    future_goals: List[FutureGoal] = Field(default_factory=list, description="Future milestone financial commitments")
    
    # Assumptions
    inflation_rate: float = Field(0.06, ge=0.01, le=0.15, description="Annual household inflation assumption (default 6.0%)")
    discount_rate: float = Field(0.075, ge=0.02, le=0.18, description="Safe investment discount rate (default 7.5%)")
    edu_inflation_rate: float = Field(0.08, ge=0.02, le=0.20, description="Annual education inflation (default 8.0%)")
    retirement_age: int = Field(60, ge=45, le=75, description="Target retirement age")
    smoker_status: bool = Field(False, description="Tobacco/Nicotine consumption in last 3 years")

class NeedsBreakdown(BaseModel):
    income_replacement_pv: float
    future_goals_pv: float
    outstanding_liabilities: float
    immediate_expenses: float
    total_gross_need: float
    eligible_assets_deducted: float
    existing_cover_deducted: float
    net_coverage_gap: float

class HLVBreakdown(BaseModel):
    hlv_gross: float
    earning_horizon_years: int
    personal_consumption_ratio: float
    wage_growth_rate: float
    discount_rate: float
    hlv_net_gap: float

class MethodologyExplanation(BaseModel):
    method: str
    description: str
    assumptions_summary: str
    limitations: List[str]

class AssessmentResult(BaseModel):
    assessment_id: str
    inputs: AssessmentInput
    net_needs: NeedsBreakdown
    hlv: HLVBreakdown
    methodology: MethodologyExplanation
    recommendation_summary: str

class EMICalculatorInput(BaseModel):
    principal: float = Field(..., gt=0, description="Loan amount in INR")
    annual_interest_rate: float = Field(..., ge=0.1, le=36.0, description="Annual interest rate in percentage, e.g. 8.5")
    tenure_months: int = Field(..., ge=1, le=360, description="Loan tenure in months")

class EMICalculatorResult(BaseModel):
    principal: float
    monthly_emi: float
    total_interest: float
    total_payment: float

class PremiumShockInput(BaseModel):
    current_annual_premium: float = Field(..., ge=0)
    expected_step_up_percent: float = Field(10.0, ge=0, le=100)
    household_budget_monthly: float = Field(..., gt=0)
    years_projection: int = Field(10, ge=1, le=30)

class FutureCostsInput(BaseModel):
    current_cost: float = Field(..., gt=0)
    years_away: int = Field(..., ge=1, le=30)
    annual_inflation_rate: float = Field(0.08, ge=0.01, le=0.25)

class ProtectionGapRadarResult(BaseModel):
    income_replacement_score: float # 0 to 100 coverage ratio
    liabilities_score: float
    future_goals_score: float
    emergency_buffer_score: float
    overall_health_score: float
