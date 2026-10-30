import math
import uuid
from typing import Any, Dict, List, Optional

from app.admin.config_store import config_store
from app.pack.loader import get_pack
from app.schemas.financial import (
    AssessmentInput,
    AssessmentResult,
    EMICalculatorInput,
    EMICalculatorResult,
    FutureCostsInput,
    HLVBreakdown,
    IncomeMultipleCheck,
    MethodologyExplanation,
    NeedsBreakdown,
    ProtectionGapRadarResult,
)


class FinancialEngine:
    """Net Needs (capital needs) and Human Life Value. Pure functions of the input and the pack's reference assumptions."""

    @staticmethod
    def resolve(inp: AssessmentInput) -> AssessmentInput:
        """Fill every assumption the caller left empty with the pack's reference value, so results are explicit."""
        a = get_pack().assumptions
        return inp.model_copy(
            update={
                "inflation_rate": inp.inflation_rate if inp.inflation_rate is not None else a.general_inflation_pct_pa / 100,
                "discount_rate": inp.discount_rate if inp.discount_rate is not None else a.post_tax_return_on_payout_pct_pa / 100,
                "edu_inflation_rate": inp.edu_inflation_rate if inp.edu_inflation_rate is not None else a.education_inflation_pct_pa / 100,
                "retirement_age": inp.retirement_age if inp.retirement_age is not None else a.retirement_age,
                "income_growth_pct": inp.income_growth_pct if inp.income_growth_pct is not None else a.default_income_growth_pct_pa,
            }
        )

    @staticmethod
    def support_horizon(inp: AssessmentInput) -> int:
        """Years the family needs support: the longest of each dependent's own horizon, else the flat horizon given."""
        a = get_pack().assumptions
        ends: List[int] = []
        if inp.spouse_age is not None:
            ends.append(a.life_expectancy_age - inp.spouse_age)
        ends += [a.child_dependency_end_age - c for c in inp.children_ages]
        ends += [a.life_expectancy_age - p for p in inp.parent_ages]
        if ends:
            return max(5, min(40, max(ends)))
        if inp.support_horizon_years:
            return inp.support_horizon_years
        return max(5, (inp.retirement_age or a.retirement_age) - inp.age)

    @staticmethod
    def calculate_income_replacement(annual_expenses: float, horizon_years: int, inflation_rate: float, discount_rate: float) -> float:
        """Present value of yearly household spending that keeps rising with inflation, discounted at the real rate."""
        if horizon_years <= 0 or annual_expenses <= 0:
            return 0.0
        r_real = (1.0 + discount_rate) / (1.0 + inflation_rate) - 1.0
        if abs(r_real) < 1e-6:
            return round(annual_expenses * horizon_years, 2)
        pv = annual_expenses * (1.0 - math.pow(1.0 + r_real, -horizon_years)) / r_real
        return max(0.0, round(pv, 2))

    @staticmethod
    def calculate_future_goals_pv(goals: List[Any], general_inflation: float, edu_inflation: float, discount_rate: float) -> float:
        """Each goal is inflated to its year, then discounted back to today."""
        total_pv = 0.0
        for g in goals:
            inflation = edu_inflation if "edu" in g.category.lower() else general_inflation
            future_cost = g.cost_today * math.pow(1.0 + inflation, g.years_away)
            total_pv += future_cost / math.pow(1.0 + discount_rate, g.years_away)
        return max(0.0, round(total_pv, 2))

    @classmethod
    def calculate_needs(cls, raw: AssessmentInput) -> NeedsBreakdown:
        a = get_pack().assumptions
        inp = cls.resolve(raw)
        horizon = cls.support_horizon(inp)
        # Part of the household's spending stops when the insured person is gone (pack assumption: 25%)
        family_expenses = inp.annual_expenses * (1.0 - a.household_expense_share_of_deceased_pct / 100.0)
        income_pv = cls.calculate_income_replacement(family_expenses, horizon, inp.inflation_rate, inp.discount_rate)
        goals_pv = cls.calculate_future_goals_pv(inp.future_goals, inp.inflation_rate, inp.edu_inflation_rate, inp.discount_rate)
        immediate = inp.immediate_expenses
        if immediate is None:
            immediate = round(inp.annual_expenses / 12.0 * a.emergency_fund_months + a.final_expenses_inr, 2)
        liabilities = max(0.0, inp.outstanding_liabilities)
        gross_need = round(income_pv + goals_pv + liabilities + immediate, 2)
        assets, cover = max(0.0, inp.eligible_assets), max(0.0, inp.existing_cover)
        gap = max(0.0, round(gross_need - assets - cover, 2))
        step = float(a.cover_rounding_inr)
        return NeedsBreakdown(
            income_replacement_pv=income_pv,
            future_goals_pv=goals_pv,
            outstanding_liabilities=liabilities,
            immediate_expenses=immediate,
            total_gross_need=gross_need,
            eligible_assets_deducted=assets,
            existing_cover_deducted=cover,
            net_coverage_gap=gap,
            recommended_cover=math.ceil(gap / step) * step if gap else 0.0,
        )

    @classmethod
    def calculate_hlv(cls, raw: AssessmentInput) -> HLVBreakdown:
        """Human Life Value: present value of the part of future earnings the family would have received."""
        a = get_pack().assumptions
        inp = cls.resolve(raw)
        years = max(1, inp.retirement_age - inp.age)
        consumption = a.self_consumption_share_of_income_pct / 100.0
        growth = inp.income_growth_pct / 100.0
        surplus = inp.annual_income * (1.0 - consumption)
        gross = sum(surplus * math.pow(1.0 + growth, t - 1) / math.pow(1.0 + inp.discount_rate, t) for t in range(1, years + 1))
        gross = round(gross, 2)
        gap = max(0.0, round(gross + inp.outstanding_liabilities - inp.eligible_assets - inp.existing_cover, 2))
        return HLVBreakdown(
            hlv_gross=gross,
            earning_horizon_years=years,
            personal_consumption_ratio=consumption,
            wage_growth_rate=growth,
            discount_rate=inp.discount_rate,
            hlv_net_gap=gap,
        )

    @classmethod
    def assess(cls, raw: AssessmentInput, assessment_id: Optional[str] = None) -> AssessmentResult:
        with config_store.pinned() as active:  # inflation, discount rate and the rest all come from one configuration version
            result = cls._assess(raw, assessment_id)
            result.config_version = active.config.version
            n = active.pack.needs
            result.income_multiple_check = IncomeMultipleCheck(
                minimum_multiple=n.income_replacement_multiple_min,
                maximum_multiple=n.income_replacement_multiple_max,
                minimum_cover=int(raw.annual_income * n.income_replacement_multiple_min),
                maximum_cover=int(raw.annual_income * n.income_replacement_multiple_max),
            )
            return result

    @classmethod
    def _assess(cls, raw: AssessmentInput, assessment_id: Optional[str] = None) -> AssessmentResult:
        inp = cls.resolve(raw)
        needs, hlv = cls.calculate_needs(inp), cls.calculate_hlv(inp)
        a = get_pack().assumptions
        methodology = MethodologyExplanation(
            method="Net Needs approach, cross-checked with Human Life Value",
            description=(
                "Net Needs adds what the family would need to keep living as before (spending that continues, inflated, for as long as "
                "each dependent needs support), their future goals, all loans, and an emergency and final-expenses reserve, then subtracts "
                "savings and existing cover. Human Life Value instead values the future earnings the family would lose."
            ),
            assumptions_summary=(
                f"Inflation {inp.inflation_rate * 100:.1f}%, education inflation {inp.edu_inflation_rate * 100:.1f}%, "
                f"return on payout {inp.discount_rate * 100:.1f}%, retirement at {inp.retirement_age}. "
                f"{a.household_expense_share_of_deceased_pct:.0f}% of household spending is assumed to stop, children are "
                f"supported to {a.child_dependency_end_age}, and cover is rounded up to the nearest Rs {a.cover_rounding_inr:,}."
            ),
            limitations=[
                "Assumes the payout is invested at the stated return after tax.",
                "Your own retirement goal is left out: it is funded by you, not by a life cover payout.",
                "A working spouse's income is not counted, so the figure is on the careful side for dual-income families.",
                "Taxes and changes in rules are not modelled.",
            ],
        )
        if needs.net_coverage_gap > 0:
            summary = (
                f"Based on your profile, about Rs {needs.recommended_cover:,.0f} of extra life cover would protect your "
                f"{inp.dependents_count} dependents against your loans, goals and living costs."
            )
        else:
            summary = "Your existing cover and savings already meet the estimated need under these assumptions."
        return AssessmentResult(
            assessment_id=assessment_id or str(uuid.uuid4()),
            inputs=inp,
            net_needs=needs,
            hlv=hlv,
            methodology=methodology,
            recommendation_summary=summary,
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
            total_payment=round(total_payment, 2),
        )

    @staticmethod
    def calculate_future_cost(inp: FutureCostsInput) -> Dict[str, Any]:
        fv = inp.current_cost * math.pow(1.0 + inp.annual_inflation_rate, inp.years_away)
        return {
            "current_cost": round(inp.current_cost, 2),
            "years_away": inp.years_away,
            "annual_inflation_rate": inp.annual_inflation_rate,
            "projected_future_cost": round(fv, 2),
            "multiplier": round(fv / inp.current_cost, 2),
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
                overall_health_score=100.0,
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
            overall_health_score=overall,
        )
