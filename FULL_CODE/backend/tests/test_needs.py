"""Needs engine: Net Needs and Human Life Value, checked against hand calculations."""

import pytest

from app.pack.loader import get_pack
from app.schemas.financial import AssessmentInput, FutureGoal
from app.services.financial_engine import FinancialEngine
from app.services.profiles import to_assessment_input


def base(**kw):
    values = dict(
        age=32,
        annual_income=1_800_000,
        annual_expenses=720_000,
        dependents_count=2,
        support_horizon_years=20,
        outstanding_liabilities=4_000_000,
        existing_cover=5_000_000,
        eligible_assets=2_000_000,
    )
    values.update(kw)
    return AssessmentInput(**values)


def test_net_needs_matches_a_hand_calculation():
    a = get_pack().assumptions
    n = FinancialEngine.calculate_needs(base())
    infl, disc = a.general_inflation_pct_pa / 100, a.post_tax_return_on_payout_pct_pa / 100
    real = (1 + disc) / (1 + infl) - 1
    expenses = 720_000 * (1 - a.household_expense_share_of_deceased_pct / 100)
    pv = expenses * (1 - (1 + real) ** -20) / real
    immediate = 720_000 / 12 * a.emergency_fund_months + a.final_expenses_inr
    expected_gap = pv + 4_000_000 + immediate - 2_000_000 - 5_000_000
    assert n.income_replacement_pv == pytest.approx(pv, abs=1)
    assert n.net_coverage_gap == pytest.approx(expected_gap, abs=1)


def test_recommended_cover_rounds_up_to_the_pack_step():
    n = FinancialEngine.calculate_needs(base())
    assert n.recommended_cover % get_pack().assumptions.cover_rounding_inr == 0
    assert n.recommended_cover - n.net_coverage_gap < get_pack().assumptions.cover_rounding_inr


def test_already_covered_customer_needs_nothing():
    n = FinancialEngine.calculate_needs(base(existing_cover=500_000_000))
    assert n.net_coverage_gap == 0 and n.recommended_cover == 0


def test_goals_are_inflated_then_discounted():
    with_goal = FinancialEngine.calculate_needs(
        base(future_goals=[FutureGoal(name="College", cost_today=2_000_000, years_away=14, category="education")])
    )
    assert with_goal.future_goals_pv > 0
    assert with_goal.net_coverage_gap > FinancialEngine.calculate_needs(base()).net_coverage_gap


def test_children_set_the_support_horizon():
    young = FinancialEngine.support_horizon(base(support_horizon_years=None, children_ages=[2]))
    older = FinancialEngine.support_horizon(base(support_horizon_years=None, children_ages=[15]))
    assert young > older and young == get_pack().assumptions.child_dependency_end_age - 2


def test_human_life_value_is_positive_and_uses_working_years():
    hlv = FinancialEngine.calculate_hlv(base())
    assert hlv.hlv_gross > 0 and hlv.earning_horizon_years == 28


def test_every_pack_customer_can_be_assessed():
    for profile in get_pack().profiles.values():
        result = FinancialEngine.assess(to_assessment_input(profile))
        assert result.net_needs.net_coverage_gap >= 0 and result.hlv.hlv_gross >= 0


def test_emi_formula():
    from app.schemas.financial import EMICalculatorInput

    r = FinancialEngine.calculate_emi(EMICalculatorInput(principal=5_000_000, annual_interest_rate=8.5, tenure_months=240))
    assert r.monthly_emi == pytest.approx(43_391, abs=1)
