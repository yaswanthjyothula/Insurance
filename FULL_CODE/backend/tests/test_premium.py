"""Premium engine against the pack's worked example and its published rules."""

import pytest

from app.pack.loader import get_pack
from app.schemas.quote import Applicant, QuoteRequest, RiderChoice
from app.services import premium

TERM = "PRD-X4CBUF"
ADB = "RDR-LUR23D"


def male30(**kw):
    base = dict(age=30, gender="male", smoker=False, annual_income=2_000_000)
    base.update(kw)
    return Applicant(**base)


def test_rate_matches_pack_quick_start():
    assert float(premium.find_rate(TERM, "regular", 30, 30, "male", False)) == 1.044


def test_pack_worked_example_monthly_total_is_1045():
    q = premium.quote(
        QuoteRequest(
            product_id=TERM,
            applicant=male30(),
            sum_assured=10_000_000,
            policy_term_years=30,
            payment_option="regular",
            mode="monthly",
            riders=[RiderChoice(rider_id=ADB, sum_assured=5_000_000)],
        )
    )
    assert q.valid, q.issues
    assert q.base_annual_premium == 10440.0
    assert q.base_instalment == 914  # 913.5 rounds up, which float arithmetic would get wrong
    assert q.riders[0].annual_premium == 1500.0 and q.riders[0].instalment == 131
    assert q.total_instalment == 1045


def test_missing_rate_row_means_not_allowed():
    q = premium.quote(
        QuoteRequest(product_id=TERM, applicant=male30(), sum_assured=10_000_000, policy_term_years=9, payment_option="regular")
    )
    assert not q.valid and any("not offered" in i for i in q.issues)


def test_sum_assured_step_and_range_are_enforced():
    q = premium.quote(QuoteRequest(product_id=TERM, applicant=male30(), sum_assured=10_050_000, policy_term_years=30))
    assert any("steps of" in i for i in q.issues)
    q = premium.quote(QuoteRequest(product_id=TERM, applicant=male30(), sum_assured=1_000_000, policy_term_years=30))
    assert any("between" in i for i in q.issues)


def test_single_pay_has_no_modal_factor_and_rejects_riders():
    q = premium.quote(
        QuoteRequest(product_id=TERM, applicant=male30(), sum_assured=10_000_000, policy_term_years=20, payment_option="single")
    )
    assert q.valid and q.total_instalment == round(q.base_annual_premium)
    q = premium.quote(
        QuoteRequest(
            product_id=TERM,
            applicant=male30(),
            sum_assured=10_000_000,
            policy_term_years=20,
            payment_option="single",
            riders=[RiderChoice(rider_id=ADB, sum_assured=1_000_000)],
        )
    )
    assert any("single" in i.lower() for i in q.issues)


def test_rider_cannot_exceed_base_cover_and_group_cap():
    q = premium.quote(
        QuoteRequest(
            product_id=TERM,
            applicant=male30(),
            sum_assured=2_500_000,
            policy_term_years=30,
            riders=[RiderChoice(rider_id=ADB, sum_assured=5_000_000)],
        )
    )
    assert not q.valid


def test_smoker_pays_more_and_woman_pays_less():
    base = dict(product_id=TERM, sum_assured=10_000_000, policy_term_years=30)
    non = premium.quote(QuoteRequest(applicant=male30(), **base)).total_annual_premium
    smoke = premium.quote(QuoteRequest(applicant=male30(smoker=True), **base)).total_annual_premium
    woman = premium.quote(QuoteRequest(applicant=male30(gender="female"), **base)).total_annual_premium
    assert smoke > non > woman


def test_ulip_quote_uses_chosen_premium_and_multiple():
    q = premium.quote(
        QuoteRequest(
            product_id="PRD-UPERQ6",
            applicant=male30(),
            annual_premium=120_000,
            sa_multiple=10,
            policy_term_years=20,
            payment_option="regular",
            mode="monthly",
            fund_id="FND-VNJ5TV",
        )
    )
    assert q.valid, q.issues
    assert q.sum_assured == 1_200_000 and q.base_instalment == 10_000
    bad = premium.quote(
        QuoteRequest(product_id="PRD-UPERQ6", applicant=male30(), annual_premium=120_000, sa_multiple=12, policy_term_years=20)
    )
    assert any("multiple" in i for i in bad.issues)


def test_non_earning_applicant_needs_working_spouse():
    no_spouse = premium.quote(QuoteRequest(product_id=TERM, applicant=male30(annual_income=0), sum_assured=2_500_000, policy_term_years=20))
    assert any("income" in i.lower() for i in no_spouse.issues)
    ok = premium.quote(
        QuoteRequest(
            product_id=TERM,
            applicant=male30(annual_income=0, spouse_working=True, spouse_annual_income=1_000_000),
            sum_assured=2_500_000,
            policy_term_years=20,
        )
    )
    assert ok.valid and ok.max_sum_assured_for_applicant == 10_000_000


def test_income_multiple_cap_reduces_allowed_cover():
    q = premium.quote(
        QuoteRequest(
            product_id=TERM,
            applicant=male30(annual_income=1_000_000, existing_individual_cover=5_000_000),
            sum_assured=2_500_000,
            policy_term_years=30,
        )
    )
    assert q.max_sum_assured_for_applicant == 20_000_000  # 25x income at age 30, less 5 lakh... 25M - 5M


def test_pack_has_the_expected_catalogue():
    pack = get_pack()
    assert len(pack.products) == 14 and len(pack.profiles) == 200
    assert {p.product_type for p in pack.products.values()} == {"Term Life", "Whole Life", "Endowment", "ULIP"}


@pytest.mark.parametrize("pid", ["PRD-BWKM04", "PRD-7HLWPZ", "PRD-SD9E19", "PRD-QZM4KL"])
def test_savings_products_price_without_error(pid):
    product = get_pack().products[pid]
    option = product.premium_payment_options[0]
    age = max(30, product.min_entry_age)
    terms = premium.allowed_terms(pid, option, age, "male", False)
    assert terms, f"no rates for {pid}"
    q = premium.quote(
        QuoteRequest(
            product_id=pid,
            applicant=male30(age=age, youngest_child_age=5),
            sum_assured=product.min_sum_assured_inr,
            policy_term_years=terms[0],
            payment_option=option,
        )
    )
    assert q.total_instalment > 0
