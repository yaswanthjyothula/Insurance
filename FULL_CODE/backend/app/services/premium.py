"""Premium maths for the Saffron Life catalogue, following the pack's published price rules.

Money is handled with Decimal so rounding is exact: floating point would turn 10,440 x 0.0875 = 913.5 into 913.4999...
and round it down.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, List, Optional, Tuple

from app.pack.loader import get_pack
from app.pack.models import Product, Rider
from app.schemas.quote import Applicant, Quote, QuoteRequest, RiderChoice, RiderLine
from app.services import eligibility

ONE = Decimal(1)
MODAL_FIELDS = {
    "annual": "modal_factor_annual",
    "half_yearly": "modal_factor_half_yearly",
    "quarterly": "modal_factor_quarterly",
    "monthly": "modal_factor_monthly",
}
ULIP_MODAL = {
    "annual": Decimal(1),
    "half_yearly": Decimal("0.5"),
    "quarterly": Decimal("0.25"),
    "monthly": Decimal("0.083333"),
}
BANDS = (("18_30", 18, 30), ("31_40", 31, 40), ("41_50", 41, 50), ("51_60", 51, 60), ("61_65", 61, 65))


def round_rupee(value: Decimal) -> int:
    """Nearest rupee, halves round up."""
    return int(value.quantize(ONE, rounding=ROUND_HALF_UP))


def premium_paying_term(option: str, policy_term: int) -> int:
    if option == "regular":
        return policy_term
    if option == "single":
        return 1
    return int(option.split("_")[1])


def band_factor(product: Product, sum_assured: int) -> Optional[Decimal]:
    for band in product.sa_band_factors:
        if band.min_sa_inr <= sum_assured and (band.max_sa_inr is None or sum_assured <= band.max_sa_inr):
            return Decimal(str(band.factor))
    return None


def find_rate(product_id: str, option: str, age: int, term: int, gender: str, smoker: bool) -> Optional[Decimal]:
    """The pack lists only allowed combinations, so a missing row means the combination is not allowed."""
    return get_pack().rates.get((product_id, option, age, term, gender, "smoker" if smoker else "non_smoker"))


def allowed_terms(product_id: str, option: str, age: int, gender: str, smoker: bool) -> List[int]:
    return get_pack().terms_by_product.get((product_id, option, age, gender, "smoker" if smoker else "non_smoker"), [])


def _modal(product: Product, mode: str) -> Optional[Decimal]:
    value = getattr(product, MODAL_FIELDS[mode])
    return Decimal(str(value)) if value is not None else None


def _rider_band_rate(rider: Rider, age: int) -> Optional[Decimal]:
    for key, low, high in BANDS:
        if low <= age <= high:
            rate = rider.band_rates.get(key)
            return Decimal(str(rate)) if rate is not None else None
    return None


def _price_rider(
    rider: Rider, choice: RiderChoice, base_annual: Decimal, base_sa: int, app: Applicant, ppt: int, issues: List[str]
) -> Optional[Decimal]:
    """Annual premium of one rider, or None (with a reason in issues) if it cannot be added."""
    if not rider.min_entry_age <= app.age <= rider.max_entry_age:
        issues.append(f"{rider.rider_name}: entry age must be {rider.min_entry_age} to {rider.max_entry_age}.")
        return None
    if rider.rate_basis == "included_free":
        return Decimal(0)
    rate = _rider_band_rate(rider, app.age)
    if rate is None:
        issues.append(f"{rider.rider_name} is not available at age {app.age}.")
        return None
    multiplier = Decimal(str(rider.smoker_multiplier)) if app.smoker else ONE
    if rider.rate_basis == "pct_of_base_annual_premium":
        if app.age + ppt > 70:
            issues.append(f"{rider.rider_name} needs entry age plus premium-paying term of 70 or less.")
            return None
        return base_annual * rate / 100 * multiplier
    sa = choice.sum_assured or 0
    limit = min(x for x in (rider.max_rider_sa_inr, base_sa * (rider.max_rider_sa_pct_of_base_sa or 100) // 100) if x is not None)
    if sa < (rider.min_rider_sa_inr or 0) or sa > limit:
        issues.append(f"{rider.rider_name}: cover must be between {rider.min_rider_sa_inr or 0:,} and {limit:,}.")
        return None
    return rate * Decimal(sa) / 1000 * multiplier


def price_riders(
    product: Product,
    choices: List[RiderChoice],
    base_annual: Decimal,
    base_sa: int,
    app: Applicant,
    ppt: int,
    option: str,
    mode_factor: Decimal,
    issues: List[str],
) -> Tuple[List[RiderLine], Decimal]:
    pack = get_pack()
    lines: List[RiderLine] = []
    by_category: Dict[str, Decimal] = {}
    total = Decimal(0)
    if choices and option == "single":
        issues.append("Riders cannot be added to a single-premium policy.")
        return lines, total
    for choice in choices:
        rider = pack.riders.get(choice.rider_id)
        if rider is None or choice.rider_id not in product.riders_allowed:
            issues.append(f"Rider {choice.rider_id} is not available on this product.")
            continue
        annual = _price_rider(rider, choice, base_annual, base_sa, app, ppt, issues)
        if annual is None:
            continue
        by_category[rider.rider_category] = by_category.get(rider.rider_category, Decimal(0)) + annual
        inst = round_rupee(annual * mode_factor)
        lines.append(
            RiderLine(
                rider_id=rider.rider_id,
                rider_name=rider.rider_name,
                sum_assured=choice.sum_assured,
                annual_premium=float(annual.quantize(Decimal("0.01"))),
                instalment=inst,
            )
        )
        total += annual
    for category, amount in by_category.items():
        pct = next(
            (
                pack.riders[c.rider_id].max_premium_pct_of_base_premium
                for c in choices
                if c.rider_id in pack.riders and pack.riders[c.rider_id].rider_category == category
            ),
            None,
        )
        if pct is not None and amount > base_annual * pct / 100:
            issues.append(f"Rider premiums in the '{category}' group may not exceed {pct}% of the base premium.")
    return lines, total


def _finish(q: Quote, issues: List[str]) -> Quote:
    q.issues = issues
    q.valid = not issues
    return q


def quote_nonlinked(product: Product, req: QuoteRequest) -> Quote:
    """Term, Whole Life and Endowment: rate table x cover x band factor, plus riders, then the modal instalment."""
    app, issues = req.applicant, eligibility.applicant_issues(product, req.applicant)
    q = Quote(
        product_id=product.product_id,
        product_name=product.product_name,
        product_type=product.product_type,
        valid=False,
        payment_option=req.payment_option,
        mode=req.mode,
    )
    if req.payment_option not in product.premium_payment_options:
        issues.append(f"Payment option '{req.payment_option}' is not offered on this product.")
    if req.mode not in product.premium_modes and req.payment_option != "single":
        issues.append(f"Payment mode '{req.mode}' is not offered on this product.")
    term = req.policy_term_years or 0
    if product.allowed_policy_terms.startswith("to_age_"):
        term = int(product.allowed_policy_terms.split("_")[-1]) - app.age
    q.policy_term_years = term
    q.premium_paying_term_years = premium_paying_term(req.payment_option, term) if term else 0
    q.allowed_terms = allowed_terms(product.product_id, req.payment_option, app.age, app.gender, app.smoker)
    sa = req.sum_assured or 0
    q.sum_assured = sa
    issues += eligibility.sum_assured_issues(product, sa)
    rate = find_rate(product.product_id, req.payment_option, app.age, term, app.gender, app.smoker)
    if rate is None:
        issues.append("This combination of age, term and payment option is not offered.")
        return _finish(q, issues)
    factor = band_factor(product, sa)
    if factor is None:
        issues.append("No price band covers this sum assured.")
        return _finish(q, issues)
    base_annual = rate * Decimal(sa) / 1000 * factor
    q.rate_per_1000, q.band_factor, q.base_annual_premium = (
        float(rate),
        float(factor),
        float(base_annual.quantize(Decimal("0.01"))),
    )
    if req.payment_option == "single":
        if req.riders:
            issues.append("Riders cannot be added to a single-premium policy.")
        q.base_instalment = round_rupee(base_annual)
        q.total_instalment = q.base_instalment
        q.total_annual_premium = float(q.base_instalment)
        return _finish(q, issues)
    modal = _modal(product, req.mode)
    if modal is None:
        issues.append("Payment mode not available.")
        return _finish(q, issues)
    q.base_instalment = round_rupee(base_annual * modal)
    lines, rider_annual = price_riders(
        product, req.riders, base_annual, sa, app, q.premium_paying_term_years, req.payment_option, modal, issues
    )
    q.riders = lines
    q.total_instalment = q.base_instalment + sum(line.instalment for line in lines)
    q.total_annual_premium = float((base_annual + rider_annual).quantize(Decimal("0.01")))
    return _finish(q, issues)


def ulip_sa_multiples(product: Product, age: int) -> List[float]:
    table = product.sa_multiple_of_annual_premium or {}
    return list(table.get("entry_age_upto_44" if age <= 44 else "entry_age_45_plus", []))


def quote_ulip(product: Product, req: QuoteRequest) -> Quote:
    """ULIP: the customer picks the premium and a multiple of it becomes the sum assured. No rate table."""
    app, issues = req.applicant, eligibility.applicant_issues(product, req.applicant)
    premium = req.annual_premium or 0
    multiple = req.sa_multiple or 0
    term = req.policy_term_years or 0
    q = Quote(
        product_id=product.product_id,
        product_name=product.product_name,
        product_type=product.product_type,
        valid=False,
        payment_option=req.payment_option,
        mode=req.mode,
        policy_term_years=term,
    )
    q.premium_paying_term_years = premium_paying_term(req.payment_option, term) if term else 0
    if req.payment_option not in product.premium_payment_options:
        issues.append(f"Payment option '{req.payment_option}' is not offered on this product.")
    if not (product.min_annual_premium_inr or 0) <= premium <= (product.max_annual_premium_inr or 0):
        issues.append(f"Annual premium must be between {product.min_annual_premium_inr:,} and {product.max_annual_premium_inr:,}.")
    if multiple not in ulip_sa_multiples(product, app.age):
        issues.append(f"Sum assured multiple must be one of {ulip_sa_multiples(product, app.age)} for age {app.age}.")
    if (
        not (product.min_policy_term_years or 0) <= term <= (product.max_policy_term_years or 0)
        or app.age + term > product.max_maturity_age
    ):
        issues.append("Policy term is outside what this product allows for your age.")
    if req.fund_id is not None and req.fund_id not in product.ulip_fund_ids:
        issues.append("That fund is not available on this product.")
    sa = int(Decimal(premium) * Decimal(str(multiple)))
    q.sum_assured = sa
    q.base_annual_premium = float(premium)
    modal = ONE if req.payment_option == "single" else ULIP_MODAL[req.mode]
    q.base_instalment = round_rupee(Decimal(premium) * modal)
    lines, rider_annual = price_riders(
        product, req.riders, Decimal(premium), sa, app, q.premium_paying_term_years, req.payment_option, modal, issues
    )
    q.riders = lines
    q.total_instalment = q.base_instalment + sum(line.instalment for line in lines)
    q.total_annual_premium = float((Decimal(premium) + rider_annual).quantize(Decimal("0.01")))
    return _finish(q, issues)


def quote(req: QuoteRequest) -> Quote:
    product = get_pack().products.get(req.product_id)
    if product is None:
        raise KeyError(req.product_id)
    result = quote_ulip(product, req) if product.is_ulip else quote_nonlinked(product, req)
    result.max_sum_assured_for_applicant = eligibility.max_cover_allowed(product, req.applicant)
    return result


def indicative_term_premium(sum_assured: int, age: int, gender: str, smoker: bool, term: int = 30) -> Optional[float]:
    """Yearly cost of plain level term cover, from the pack's rate table. Used by the calculators for a quick, honest estimate."""
    product = get_pack().products["PRD-X4CBUF"]
    step = product.sum_assured_step_inr or 100_000
    sa = max(product.min_sum_assured_inr or step, min(product.max_sum_assured_inr or sum_assured, sum_assured // step * step))
    terms = allowed_terms(product.product_id, "regular", age, gender, smoker)
    if not terms:
        return None
    chosen = min(terms, key=lambda t: abs(t - term))
    rate, factor = find_rate(product.product_id, "regular", age, chosen, gender, smoker), band_factor(product, sa)
    if rate is None or factor is None:
        return None
    return float((rate * Decimal(sa) / 1000 * factor).quantize(Decimal("0.01")))
