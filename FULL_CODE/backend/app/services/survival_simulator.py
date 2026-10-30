from typing import List, Optional

from pydantic import BaseModel, Field


class SurvivalSimulatorInput(BaseModel):
    initial_liquid_assets: float = Field(..., ge=0, description="Available savings, fixed deposits, mutual funds")
    existing_insurance_payout: float = Field(0.0, ge=0, description="Lump sum from existing life insurance policies")
    additional_coverage_considered: float = Field(0.0, ge=0, description="Additional term insurance cover evaluated")
    annual_living_expenses: float = Field(..., gt=0, description="Current annual family living costs")
    annual_debt_obligation: float = Field(0.0, ge=0, description="Annual EMI outflow")
    debt_tenure_years_remaining: int = Field(0, ge=0, le=30)
    inflation_rate: float = Field(0.06, ge=0.01, le=0.15)
    investment_yield_rate: float = Field(0.075, ge=0.01, le=0.15)
    projection_years: int = Field(25, ge=5, le=40)


class YearlyCashflowRecord(BaseModel):
    year: int
    opening_corpus: float
    living_expenses_withdrawn: float
    debt_paid: float
    investment_growth: float
    closing_corpus: float
    is_depleted: bool


class SurvivalSimulationResult(BaseModel):
    depletion_year_without_new_cover: Optional[int]
    depletion_year_with_new_cover: Optional[int]
    financial_runway_years_without_new_cover: int
    financial_runway_years_with_new_cover: int
    yearly_timeline_with_cover: List[YearlyCashflowRecord]
    yearly_timeline_without_cover: List[YearlyCashflowRecord]
    summary_verdict: str
    disclaimer: str


class SurvivalSimulator:
    @classmethod
    def simulate_corpus(
        cls,
        starting_corpus: float,
        annual_expenses: float,
        annual_debt: float,
        debt_years: int,
        inflation: float,
        yield_rate: float,
        total_years: int,
    ) -> (List[YearlyCashflowRecord], Optional[int]):
        timeline: List[YearlyCashflowRecord] = []
        corpus = starting_corpus
        depletion_yr: Optional[int] = None

        current_exp = annual_expenses

        for yr in range(1, total_years + 1):
            opening = max(0.0, corpus)
            if opening <= 0.0:
                if depletion_yr is None:
                    depletion_yr = yr
                timeline.append(
                    YearlyCashflowRecord(
                        year=yr,
                        opening_corpus=0.0,
                        living_expenses_withdrawn=0.0,
                        debt_paid=0.0,
                        investment_growth=0.0,
                        closing_corpus=0.0,
                        is_depleted=True,
                    )
                )
                current_exp *= 1.0 + inflation
                continue

            # Living costs
            exp_withdrawn = min(opening, current_exp)
            remaining_after_exp = opening - exp_withdrawn

            # Debt obligation
            debt_this_yr = annual_debt if yr <= debt_years else 0.0
            debt_paid = min(remaining_after_exp, debt_this_yr)
            remaining_after_debt = remaining_after_exp - debt_paid

            # Growth on remaining corpus
            growth = remaining_after_debt * yield_rate
            closing = round(remaining_after_debt + growth, 2)

            is_depleted = closing <= 0.0
            if is_depleted and depletion_yr is None:
                depletion_yr = yr

            timeline.append(
                YearlyCashflowRecord(
                    year=yr,
                    opening_corpus=round(opening, 2),
                    living_expenses_withdrawn=round(exp_withdrawn, 2),
                    debt_paid=round(debt_paid, 2),
                    investment_growth=round(growth, 2),
                    closing_corpus=round(closing, 2),
                    is_depleted=is_depleted,
                )
            )

            corpus = closing
            current_exp *= 1.0 + inflation

        return timeline, depletion_yr

    @classmethod
    def run(cls, inp: SurvivalSimulatorInput) -> SurvivalSimulationResult:
        # Baseline corpus without additional insurance
        corpus_without = inp.initial_liquid_assets + inp.existing_insurance_payout
        timeline_without, dep_without = cls.simulate_corpus(
            corpus_without,
            inp.annual_living_expenses,
            inp.annual_debt_obligation,
            inp.debt_tenure_years_remaining,
            inp.inflation_rate,
            inp.investment_yield_rate,
            inp.projection_years,
        )

        # Corpus with additional insurance considered
        corpus_with = corpus_without + inp.additional_coverage_considered
        timeline_with, dep_with = cls.simulate_corpus(
            corpus_with,
            inp.annual_living_expenses,
            inp.annual_debt_obligation,
            inp.debt_tenure_years_remaining,
            inp.inflation_rate,
            inp.investment_yield_rate,
            inp.projection_years,
        )

        runway_without = dep_without if dep_without else inp.projection_years
        runway_with = dep_with if dep_with else inp.projection_years

        if dep_without and not dep_with:
            verdict = (
                f"Without additional cover, the family corpus is projected to run out in Year {dep_without}. "
                f"With ₹{inp.additional_coverage_considered:,.0f} additional coverage, the financial runway extends "
                f"across the full {inp.projection_years}-year horizon safely."
            )
        elif dep_without and dep_with:
            verdict = (
                f"Without additional cover, the fund depletes in Year {dep_without}. "
                f"Additional cover extends security to Year {dep_with} (+{dep_with - dep_without} years of protection)."
            )
        else:
            verdict = (
                f"Under the stated assumptions, your existing liquid resources and insurance maintain family solvency "
                f"for the complete {inp.projection_years}-year projection."
            )

        return SurvivalSimulationResult(
            depletion_year_without_new_cover=dep_without,
            depletion_year_with_new_cover=dep_with,
            financial_runway_years_without_new_cover=runway_without,
            financial_runway_years_with_new_cover=runway_with,
            yearly_timeline_with_cover=timeline_with,
            yearly_timeline_without_cover=timeline_without,
            summary_verdict=verdict,
            disclaimer="Hypothetical simulation using fixed inflation and yield assumptions; not a guaranteed projection.",
        )
