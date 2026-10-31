"""Recommendation engine: eligibility is respected, budgets are honoured, and every pack customer gets a sensible answer."""

import pytest

from app.ml import ranker
from app.pack.loader import get_pack
from app.services import eligibility, premium
from app.services.profiles import to_recommend_request
from app.services.recommendation import recommend

PROFILES = list(get_pack().profiles.values())


@pytest.mark.parametrize("profile", PROFILES, ids=lambda p: p.profile_id)
def test_every_customer_gets_a_valid_answer(profile):
    r = recommend(to_recommend_request(profile))
    assert len(r.products) == 14
    assert [p.rank for p in r.products] == list(range(1, 15))
    eligible = [p for p in r.products if p.eligible]
    assert all(p.quote and p.quote.valid for p in eligible)
    # eligible products always come before ineligible ones
    assert all(not p.eligible for p in r.products[len(eligible) :])


def test_priced_products_respect_the_income_multiple_cap():
    for profile in PROFILES:
        req = to_recommend_request(profile)
        for fit in recommend(req).products:
            if fit.eligible and fit.product_type == "Term Life":
                cap = eligibility.max_cover_allowed(get_pack().products[fit.product_id], req.applicant)
                assert cap is None or fit.quote.sum_assured <= cap


def test_budget_shrinks_cover_instead_of_breaking_the_budget():
    tight = next(p for p in PROFILES if 0 < p.monthly_premium_budget_inr <= 1000 and p.annual_income_inr > 600_000)
    r = recommend(to_recommend_request(tight))
    core = next(i for i in r.basket.items if i.product_type == "Term Life")
    assert core.quote.total_instalment <= tight.monthly_premium_budget_inr
    assert r.basket.cover_shortfall > 0 and any("short" in n for n in r.basket.notes)


def test_nri_only_sees_nri_products():
    nri = next(p for p in PROFILES if p.residency_status == "nri")
    for fit in recommend(to_recommend_request(nri)).products:
        if fit.eligible:
            assert get_pack().products[fit.product_id].nri_eligible


def test_non_earning_customer_is_handled():
    zero = [p for p in PROFILES if p.annual_income_inr == 0]
    assert zero
    for p in zero:
        r = recommend(to_recommend_request(p))
        for fit in r.products:
            if fit.eligible:
                assert p.spouse and p.spouse.working


def test_priority_changes_the_ranking():
    p = next(x for x in PROFILES if x.risk_appetite == "high" and x.annual_income_inr > 1_500_000)
    growth = [f.product_id for f in recommend(to_recommend_request(p, "growth")).products]
    cost = [f.product_id for f in recommend(to_recommend_request(p, "lowest_cost")).products]
    assert growth != cost


def test_model_is_used_disclosed_and_blended_half_and_half():
    r = recommend(to_recommend_request(PROFILES[0]))
    assert r.ranking_method == "rules+trained-model"
    top = next(f for f in r.products if f.eligible)
    assert abs(top.match_percent - round(0.5 * top.model_percent + 0.5 * top.rule_percent)) <= 1


def test_model_beats_random_and_reports_its_limits():
    info = ranker.model_info()
    ev = info["evaluation"]["overall"]
    assert info["available"] and ev["model"]["top1"] > 2 * ev["random"]["top1"]
    assert any("SYNTHETIC" in line for line in info["disclosure"])
    assert info["training_customers"] + info["test_customers"] == 200


def test_persona_weights_sum_to_one():
    for p in ranker.PRIORITIES:
        assert sum(ranker.persona_weights(p, 3, True).values()) == pytest.approx(1.0)


def test_basket_cover_never_exceeds_the_cap_for_the_whole_basket():
    for profile in PROFILES[:60]:
        req = to_recommend_request(profile)
        r = recommend(req)
        product = get_pack().products["PRD-X4CBUF"]
        cap = eligibility.max_cover_allowed(product, req.applicant)
        if cap is not None:
            assert r.basket.total_cover <= cap + 1


def test_quote_matches_the_plan_chosen_by_the_engine():
    p = PROFILES[1]
    req = to_recommend_request(p)
    fit = next(f for f in recommend(req).products if f.eligible and not f.product_id.startswith("PRD-2W"))
    again = premium.quote(
        __import__("app.schemas.quote", fromlist=["QuoteRequest"]).QuoteRequest(
            product_id=fit.product_id,
            applicant=req.applicant,
            sum_assured=fit.quote.sum_assured,
            policy_term_years=fit.quote.policy_term_years,
            payment_option=fit.quote.payment_option,
            mode="monthly",
            annual_premium=int(fit.quote.base_annual_premium) if fit.sa_multiple else None,
            sa_multiple=fit.sa_multiple,
            fund_id=fit.fund_id,
        )
    )
    assert again.total_instalment == fit.quote.total_instalment


def test_shortfall_note_names_the_real_limit():
    """The cover cap and the budget are different reasons; the note must not blame the wrong one."""
    capped = tight = None
    for p in PROFILES:
        req = to_recommend_request(p)
        r = recommend(req)
        core = next((i for i in r.basket.items if i.product_type == "Term Life"), None)
        if core is None or core.quote.sum_assured >= r.recommended_cover:
            continue
        cap = eligibility.max_cover_allowed(get_pack().products[core.product_id], req.applicant)
        if cap is not None and core.quote.sum_assured >= cap - 100_000:
            capped = capped or r
        elif r.basket.budget_monthly:
            tight = tight or r
    assert capped and any("allows you at most" in n for n in capped.basket.notes)
    assert tight and any("Your budget covers" in n for n in tight.basket.notes)


def test_customers_preferred_term_reaches_the_engine():
    with_pref = next(p for p in PROFILES if p.preferred_policy_term_years)
    req = to_recommend_request(with_pref)
    assert req.preferred_term_years == with_pref.preferred_policy_term_years
    r = recommend(req)
    assert r.term_years == with_pref.preferred_policy_term_years


def test_one_time_plans_are_not_judged_against_the_monthly_budget():
    for profile in PROFILES:
        r = recommend(to_recommend_request(profile))
        for note in r.basket.notes:
            assert "Single Premium costs at least" not in note


def test_single_premiums_are_never_counted_as_a_monthly_cost():
    # Abhishek Saxena's basket adds a single-premium ULIP; it once showed as "Rs 3,30,595 / month"
    abhishek = recommend(to_recommend_request(get_pack().profiles["CUS-06ISGGSQ"])).basket
    singles = [i for i in abhishek.items if i.quote.payment_option == "single"]
    assert singles, "this customer's basket should include a single-premium plan"
    assert abhishek.total_one_time == sum(i.quote.total_instalment for i in singles)
    assert abhishek.total_monthly == sum(i.quote.total_instalment for i in abhishek.items if i.quote.payment_option != "single")
    for profile in PROFILES:
        basket = recommend(to_recommend_request(profile)).basket
        regular = sum(i.quote.total_instalment for i in basket.items if i.quote.payment_option != "single")
        assert basket.total_monthly == int(regular)
        assert basket.within_budget == (basket.budget_monthly is None or regular <= basket.budget_monthly)
