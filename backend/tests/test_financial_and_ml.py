import pytest
from app.schemas.financial import AssessmentInput, FutureGoal, EMICalculatorInput
from app.schemas.scenarios import ScenarioInput
from app.schemas.products import RecommendationRequest
from app.services.financial_engine import FinancialEngine
from app.services.scenario_engine import ScenarioEngine
from app.services.survival_simulator import SurvivalSimulator, SurvivalSimulatorInput
from app.services.matching import plan_matcher, indicative_annual_premium, WEIGHTS
from app.services.catalog import TERM_PLANS

def test_financial_engine_income_replacement():
    # E0 = 600,000, 20 yrs, i = 6%, r = 7.5%
    pv = FinancialEngine.calculate_income_replacement(
        annual_expenses=600000.0,
        horizon_years=20,
        inflation_rate=0.06,
        discount_rate=0.075
    )
    assert pv > 600000.0
    # Real rate = (1.075 / 1.06) - 1 = 0.01415 (approx 1.4%)
    # For positive real discount rate, PV < 600000 * 20 = 12,000,000
    assert pv < 12000000.0

def test_financial_engine_needs_and_net_gap():
    inp = AssessmentInput(
        age=32,
        annual_income=1800000.0,
        annual_expenses=720000.0,
        dependents_count=2,
        outstanding_liabilities=4000000.0, # ₹40 Lakhs
        existing_cover=5000000.0,         # ₹50 Lakhs
        eligible_assets=2000000.0,        # ₹20 Lakhs
        future_goals=[
            FutureGoal(name="Child College", cost_today=2000000.0, years_away=15, category="education")
        ]
    )
    result = FinancialEngine.assess(inp)
    
    assert result.net_needs.total_gross_need > 0
    assert result.net_needs.outstanding_liabilities == 4000000.0
    assert result.net_needs.eligible_assets_deducted == 2000000.0
    assert result.net_needs.existing_cover_deducted == 5000000.0
    
    # Gap = max(0, gross_need - assets - cover)
    expected_gap = max(0.0, result.net_needs.total_gross_need - 2000000.0 - 5000000.0)
    assert abs(result.net_needs.net_coverage_gap - expected_gap) < 0.01

def test_financial_engine_surplus_existing_cover():
    # When existing cover exceeds total need, gap must be exactly 0
    inp = AssessmentInput(
        age=30,
        annual_income=1000000.0,
        annual_expenses=300000.0,
        dependents_count=1,
        outstanding_liabilities=0.0,
        existing_cover=50000000.0, # ₹5 Crore (huge)
        eligible_assets=10000000.0
    )
    result = FinancialEngine.assess(inp)
    assert result.net_needs.net_coverage_gap == 0.0

def test_hlv_calculation():
    inp = AssessmentInput(
        age=30,
        annual_income=1200000.0,
        annual_expenses=400000.0,
        dependents_count=2,
        retirement_age=60
    )
    hlv = FinancialEngine.calculate_hlv(inp)
    assert hlv.earning_horizon_years == 30
    assert hlv.personal_consumption_ratio == 0.25 # 2+ dependents
    assert hlv.hlv_gross > 10000000.0 # ~₹1 Cr+

def test_emi_calculator():
    # ₹10,00,000 at 8.5% for 120 months (10 years)
    inp = EMICalculatorInput(principal=1000000.0, annual_interest_rate=8.5, tenure_months=120)
    res = FinancialEngine.calculate_emi(inp)
    assert 12000.0 < res.monthly_emi < 13000.0
    assert res.total_payment > 1000000.0

def test_scenario_loan_cleared_correctness():
    """
    MANDATORY RULE TEST:
    Clearing a loan must reduce liabilities to 0 WITHOUT altering income, dependents, or existing cover!
    """
    baseline = AssessmentInput(
        age=35,
        annual_income=2000000.0,
        annual_expenses=800000.0,
        dependents_count=2,
        outstanding_liabilities=5000000.0, # ₹50 Lakhs
        existing_cover=10000000.0,
        eligible_assets=3000000.0
    )
    
    scenario = ScenarioInput(
        scenario_type="loan_cleared",
        title="Cleared Home Loan Early",
        description="Prepaid existing mortgage"
    )
    
    comp = ScenarioEngine.apply_scenario(baseline, scenario)
    
    # Check baseline was not mutated
    assert baseline.outstanding_liabilities == 5000000.0
    assert baseline.annual_income == 2000000.0
    assert baseline.dependents_count == 2
    assert baseline.existing_cover == 10000000.0
    
    # Check scenario result
    sc_res = comp.scenario_result
    assert sc_res.net_needs.outstanding_liabilities == 0.0
    assert sc_res.inputs.annual_income == 2000000.0
    assert sc_res.inputs.dependents_count == 2
    assert sc_res.inputs.existing_cover == 10000000.0
    
    # Cover difference should reflect reduction
    assert comp.cover_difference < 0

def test_survival_simulator_runway():
    sim_input = SurvivalSimulatorInput(
        initial_liquid_assets=1000000.0, # ₹10 Lakhs
        existing_insurance_payout=0.0,
        additional_coverage_considered=10000000.0, # ₹1 Crore
        annual_living_expenses=600000.0, # ₹6 Lakhs/year
        annual_debt_obligation=0.0,
        debt_tenure_years_remaining=0,
        inflation_rate=0.06,
        investment_yield_rate=0.075,
        projection_years=20
    )
    res = SurvivalSimulator.run(sim_input)
    # ₹10 Lakhs with ₹6 Lakhs/yr will deplete quickly (in year 2 or 3)
    assert res.depletion_year_without_new_cover is not None
    assert res.depletion_year_without_new_cover <= 3
    # With ₹1 Crore, runway should extend much longer
    assert res.financial_runway_years_with_new_cover >= 15

def _req(**kw):
    base = dict(age=30, annual_income=1500000.0, coverage_gap=15000000.0, dependents_count=2, desired_tenure_years=30, smoker_status=False)
    base.update(kw)
    return RecommendationRequest(**base)

def test_matching_pipeline_ranks_by_score():
    resp = plan_matcher.recommend(_req())
    assert resp.total_evaluated == len(TERM_PLANS)
    assert resp.eligible_count > 0
    assert resp.recommendations[0].rank == 1
    for status in ("eligible", "eligibility_unconfirmed"):
        scores = [r.suitability_score for r in resp.recommendations if r.eligibility_status == status]
        assert scores == sorted(scores, reverse=True)
    ranks = [r.rank for r in resp.recommendations]
    assert ranks == list(range(1, len(ranks) + 1))

def test_every_match_explains_itself():
    resp = plan_matcher.recommend(_req())
    for r in resp.recommendations:
        assert abs(sum(f.weight for f in r.score_breakdown) - 1.0) < 1e-9
        assert {f.key for f in r.score_breakdown} == set(WEIGHTS)
        assert all(0.0 <= f.score <= 1.0 and f.detail for f in r.score_breakdown)
        assert r.premium_is_estimate is True

def test_age_limits_are_enforced():
    # LIC Digi Term only sells up to age 45
    resp = plan_matcher.recommend(_req(age=52))
    lic = next(r for r in resp.recommendations if r.product.id == "term-lic-digi-term")
    assert lic.eligibility_status != "eligible"
    eligible_ranks = [r.rank for r in resp.recommendations if r.eligibility_status == "eligible"]
    assert lic.rank > max(eligible_ranks)

def test_term_catalogue_is_sourced():
    assert len(TERM_PLANS) >= 8
    for p in TERM_PLANS:
        assert p.data_status in ("sourced", "partially_sourced")
        assert p.product_page_url and p.as_of
        if p.data_status == "sourced":
            assert p.uin
        if p.claim_settlement_ratio is not None:
            assert p.claim_ratio_source_url and p.claim_ratio_basis
        if p.solvency_ratio is not None:
            assert p.solvency_source_url

def test_premium_estimate_matches_published_samples():
    # ICICI's published first-year samples for a non-smoking male, ₹1 Cr
    assert round(indicative_annual_premium(10_000_000, 30, False)) == 11342
    assert round(indicative_annual_premium(10_000_000, 40, False)) == 18225
    assert round(indicative_annual_premium(10_000_000, 50, False)) == 34532
    assert indicative_annual_premium(10_000_000, 35, True) > indicative_annual_premium(10_000_000, 35, False)

def test_matching_methodology_weights_sum_to_one():
    info = plan_matcher.methodology()
    assert abs(sum(info["weights"].values()) - 1.0) < 1e-9

def test_unconfirmed_eligibility_never_outranks_confirmed():
    resp = plan_matcher.recommend(_req(age=70))
    first_confirmed = [r for r in resp.recommendations if r.eligibility_status == "eligible"]
    unconfirmed = [r for r in resp.recommendations if r.eligibility_status == "eligibility_unconfirmed"]
    assert unconfirmed, "ICICI has no confirmed age limits, so it should be flagged"
    assert all(u.rank > c.rank for u in unconfirmed for c in first_confirmed)
    assert resp.eligible_count == len(first_confirmed)
