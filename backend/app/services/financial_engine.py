import math
import uuid
from typing import List, Dict, Any
from app.schemas.financial import (
    AssessmentInput,
    AssessmentResult,
    NeedsBreakdown,
    HLVBreakdown,
    MethodologyExplanation,
    EMICalculatorInput,
    EMICalculatorResult,
    PremiumShockInput,
    FutureCostsInput,
    ProtectionGapRadarResult
)

class FinancialEngine:
    @staticmethod
    def calculate_income_replacement(
        annual_expenses: float,
        horizon_years: int,
        inflation_rate: float,
        discount_rate: float
    ) -> float:
        """
        Calculates Present Value of recurring household expenses adjusted for inflation
        using the real discount rate formula.
        """
        if horizon_years <= 0 or annual_expenses <= 0:
            return 0.0
            
        # Real discount rate = (1 + r) / (1 + i) - 1
        r_real = (1.0 + discount_rate) / (1.0 + inflation_rate) - 1.0
        
        if abs(r_real) < 1e-6:
            # If inflation matches discount rate exactly
            return round(annual_expenses * horizon_years, 2)
            
        pv = annual_expenses * (1.0 - math.pow(1.0 + r_real, -horizon_years)) / r_real
        return max(0.0, round(pv, 2))

    @staticmethod
    def calculate_future_goals_pv(
        goals: List[Any],
        general_inflation: float,
        edu_inflation: float,
        discount_rate: float
    ) -> float:
        """
        Computes the discounted present value of future milestone commitments
        (e.g., child university degree, wedding, home down payment).
        """
        total_pv = 0.0
        for g in goals:
            cost = getattr(g, "cost_today", 0.0)
            years = getattr(g, "years_away", 0)
            cat = getattr(g, "category", "education").lower()
            
            inf = edu_inflation if "edu" in cat else general_inflation
            # Inflate cost to milestone year
            future_cost = cost * math.pow(1.0 + inf, years)
            # Discount back to today
            pv = future_cost / math.pow(1.0 + discount_rate, years)
            total_pv += pv
            
        return max(0.0, round(total_pv, 2))

    @classmethod
    def calculate_needs(cls, inp: AssessmentInput) -> NeedsBreakdown:
        # Determine support horizon if not explicitly specified
        horizon = inp.support_horizon_years
        if not horizon or horizon <= 0:
            horizon = max(5, inp.retirement_age - inp.age)
            
        # 1. Income replacement PV
        income_pv = cls.calculate_income_replacement(
            inp.annual_expenses,
            horizon,
            inp.inflation_rate,
            inp.discount_rate
        )
        
        # 2. Future goals PV
        goals_pv = cls.calculate_future_goals_pv(
            inp.future_goals,
            inp.inflation_rate,
            inp.edu_inflation_rate,
            inp.discount_rate
        )
        
        # 3. Immediate expenses (default: 6 months living expenses + ₹3 Lakh emergency buffer)
        immediate = inp.immediate_expenses
        if immediate is None:
            six_months = (inp.annual_expenses / 12.0) * 6.0
            immediate = round(max(300000.0, six_months), 2)
            
        # 4. Liabilities
        liabilities = max(0.0, inp.outstanding_liabilities)
        
        # Gross Total Need
        gross_need = round(income_pv + goals_pv + liabilities + immediate, 2)
        
        # Deductions
        eligible_assets = max(0.0, inp.eligible_assets)
        existing_cover = max(0.0, inp.existing_cover)
        
        # Net Coverage Gap (non-negative)
        net_gap = max(0.0, round(gross_need - eligible_assets - existing_cover, 2))
        
        return NeedsBreakdown(
            income_replacement_pv=income_pv,
            future_goals_pv=goals_pv,
            outstanding_liabilities=liabilities,
            immediate_expenses=immediate,
            total_gross_need=gross_need,
            eligible_assets_deducted=eligible_assets,
            existing_cover_deducted=existing_cover,
            net_coverage_gap=net_gap
        )

    @classmethod
    def calculate_hlv(cls, inp: AssessmentInput) -> HLVBreakdown:
        """
        Computes Human Life Value (economic present value of lifetime net earnings).
        """
        years_to_retire = max(1, inp.retirement_age - inp.age)
        
        # Personal consumption deduction based on family size
        if inp.dependents_count == 0:
            p_consumption = 0.40
        elif inp.dependents_count == 1:
            p_consumption = 0.30
        else:
            p_consumption = 0.25
            
        wage_growth = 0.07  # 7% expected annual nominal salary hike
        annual_surplus = inp.annual_income * (1.0 - p_consumption)
        
        gross_hlv = 0.0
        for t in range(1, years_to_retire + 1):
            earning_t = annual_surplus * math.pow(1.0 + wage_growth, t - 1)
            pv_t = earning_t / math.pow(1.0 + inp.discount_rate, t)
            gross_hlv += pv_t
            
        gross_hlv = round(gross_hlv, 2)
        
        # Economic loss gap = HLV + debt obligations - existing resources
        hlv_gap = max(0.0, round(gross_hlv + inp.outstanding_liabilities - inp.eligible_assets - inp.existing_cover, 2))
        
        return HLVBreakdown(
            hlv_gross=gross_hlv,
            earning_horizon_years=years_to_retire,
            personal_consumption_ratio=p_consumption,
            wage_growth_rate=wage_growth,
            discount_rate=inp.discount_rate,
            hlv_net_gap=hlv_gap
        )

    @classmethod
    def assess(cls, inp: AssessmentInput, assessment_id: str = None) -> AssessmentResult:
        aid = assessment_id or str(uuid.uuid4())
        net_needs = cls.calculate_needs(inp)
        hlv = cls.calculate_hlv(inp)
        
        methodology = MethodologyExplanation(
            method="Capital Needs Analysis with HLV Cross-Reference",
            description=(
                "Estimates capital required to replace dependent household expenditure, "
                "fund specific future milestones, retire all debts immediately, and retain "
                "an emergency reserve, offset by current financial assets and active life insurance."
            ),
            assumptions_summary=(
                f"Inflation: {inp.inflation_rate*100:.1f}%, Education Inflation: {inp.edu_inflation_rate*100:.1f}%, "
                f"Discount Rate: {inp.discount_rate*100:.1f}%, Retirement Age: {inp.retirement_age}"
            ),
            limitations=[
                "Assumes continuous safe reinvestment of proceeds at the stated discount rate.",
                "Does not account for unanticipated tax law modifications or catastrophic macroeconomic hyperinflation.",
                "Eligible financial assets exclude primary family residence to protect living stability."
            ]
        )
        
        if net_needs.net_coverage_gap > 0:
            summary = (
                f"Based on your profile, an estimated additional life protection of "
                f"₹{net_needs.net_coverage_gap:,.0f} is recommended to fully safeguard "
                f"your {inp.dependents_count} dependents against liabilities and long-term expenses."
            )
        else:
            summary = (
                "Your existing life cover and eligible assets currently cover your estimated financial "
                "liabilities and dependent support needs under baseline assumptions."
            )
            
        return AssessmentResult(
            assessment_id=aid,
            inputs=inp,
            net_needs=net_needs,
            hlv=hlv,
            methodology=methodology,
            recommendation_summary=summary
        )

    @staticmethod
    def calculate_emi(inp: EMICalculatorInput) -> EMICalculatorResult:
        P = inp.principal
        r = (inp.annual_interest_rate / 100.0) / 12.0
        n = inp.tenure_months
        
        if r == 0:
            emi = P / n
        else:
            emi = (P * r * math.pow(1.0 + r, n)) / (math.pow(1.0 + r, n) - 1.0)
            
        total_payment = emi * n
        total_interest = total_payment - P
        
        return EMICalculatorResult(
            principal=round(P, 2),
            monthly_emi=round(emi, 2),
            total_interest=round(total_interest, 2),
            total_payment=round(total_payment, 2)
        )

    @staticmethod
    def calculate_future_cost(inp: FutureCostsInput) -> Dict[str, Any]:
        fv = inp.current_cost * math.pow(1.0 + inp.annual_inflation_rate, inp.years_away)
        return {
            "current_cost": round(inp.current_cost, 2),
            "years_away": inp.years_away,
            "annual_inflation_rate": inp.annual_inflation_rate,
            "projected_future_cost": round(fv, 2),
            "multiplier": round(fv / inp.current_cost, 2)
        }

    @staticmethod
    def calculate_protection_radar(needs: NeedsBreakdown) -> ProtectionGapRadarResult:
        # Score from 0 to 100 representing health of coverage
        total = needs.total_gross_need
        if total <= 0:
            return ProtectionGapRadarResult(
                income_replacement_score=100.0,
                liabilities_score=100.0,
                future_goals_score=100.0,
                emergency_buffer_score=100.0,
                overall_health_score=100.0
            )
            
        covered = needs.eligible_assets_deducted + needs.existing_cover_deducted
        coverage_ratio = min(1.0, covered / total)
        
        # Weights
        inc_score = min(100.0, round(coverage_ratio * 100.0, 1))
        liab_score = 100.0 if needs.outstanding_liabilities == 0 else min(100.0, round(coverage_ratio * 105.0, 1))
        goals_score = 100.0 if needs.future_goals_pv == 0 else min(100.0, round(coverage_ratio * 95.0, 1))
        buffer_score = min(100.0, round((needs.eligible_assets_deducted / max(1.0, needs.immediate_expenses)) * 100.0, 1))
        overall = round((inc_score * 0.4 + liab_score * 0.3 + goals_score * 0.2 + buffer_score * 0.1), 1)
        
        return ProtectionGapRadarResult(
            income_replacement_score=inc_score,
            liabilities_score=liab_score,
            future_goals_score=goals_score,
            emergency_buffer_score=buffer_score,
            overall_health_score=overall
        )
