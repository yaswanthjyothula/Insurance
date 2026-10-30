"""Per-product planning: pick a sensible policy configuration for a customer, price it exactly, and score how well it fits.

Everything here is a rule the customer can read. The trained ranker (app.ml) only re-weights these scores.
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from app.pack.loader import get_pack
from app.pack.models import Product
from app.schemas.financial import NeedsBreakdown
from app.schemas.quote import Quote, QuoteRequest
from app.schemas.recommendation import Factor, ProductFit, RecommendRequest
from app.services import eligibility, premium
from app.services.financial_engine import FinancialEngine

FACTORS = ["protection", "affordability", "goal_fit", "risk_fit", "term_fit"]
LABELS = {
    "protection": "Covers the gap",
    "affordability": "Fits the budget",
    "goal_fit": "Matches your goals",
    "risk_fit": "Matches your risk comfort",
    "term_fit": "Matches your preferred term",
}
BASE_WEIGHTS = {"protection": 0.35, "affordability": 0.25, "goal_fit": 0.15, "risk_fit": 0.15, "term_fit": 0.10}
ROLE = {
    "Term Life": "core protection",
    "Endowment": "goal funding",
    "ULIP": "long-term growth",
    "Whole Life": "lifelong cover",
}
FUND_BY_RISK = {"high": "equity", "medium": "hybrid", "low": "debt"}
LONG_TERM_GOALS = {"retirement", "house_purchase", "parents_care"}


@dataclass
class Context:
    req: RecommendRequest
    needs: NeedsBreakdown
    gap: int
    desired_term: int
    budget: Optional[float]
    goal_types: List[str]
    home_loan: float

    @property
    def income(self) -> int:
        return self.req.applicant.annual_income


def build_context(req: RecommendRequest) -> Context:
    needs = FinancialEngine.calculate_needs(req.assessment)
    a = get_pack().assumptions
    app = req.applicant
    retire = req.assessment.retirement_age or a.retirement_age
    desired = req.preferred_term_years or max(10, min(40, retire - app.age))
    categories = {g.category for g in req.assessment.future_goals}
    goal_types = list(req.goal_types) or [
        {
            "education": "child_education",
            "marriage": "child_marriage",
            "property": "house_purchase",
            "family_support": "parents_care",
        }.get(c, c)
        for c in categories
    ]
    return Context(
        req=req,
        needs=needs,
        gap=int(needs.recommended_cover),
        desired_term=desired,
        budget=float(req.monthly_budget) if req.monthly_budget else None,
        goal_types=goal_types,
        home_loan=needs.outstanding_liabilities,
    )


def _quote(product: Product, ctx: Context, sa: int, option: str, term: int, mode: str = "monthly") -> Quote:
    return premium.quote(
        QuoteRequest(
            product_id=product.product_id,
            applicant=ctx.req.applicant,
            sum_assured=sa,
            policy_term_years=term,
            payment_option=option,
            mode=mode,
        )
    )


def _options(product: Product) -> List[str]:
    """Pay-as-you-go options first: single premium is only chosen when nothing else exists."""
    regular = [o for o in product.premium_payment_options if o != "single"]
    return regular or list(product.premium_payment_options)


def choose_term_and_option(product: Product, ctx: Context, desired: int) -> Optional[Tuple[str, int]]:
    """The allowed (payment option, term) closest to the term the customer wants. Missing rate rows mean not allowed."""
    app = ctx.req.applicant
    best: Optional[Tuple[Tuple[int, int], str, int]] = None
    for rank, option in enumerate(_options(product)):
        for term in premium.allowed_terms(product.product_id, option, app.age, app.gender, app.smoker):
            key = (abs(term - desired), rank)
            if best is None or key < best[0]:
                best = (key, option, term)
    return (best[1], best[2]) if best else None


def desired_term_for(product: Product, ctx: Context) -> int:
    app = ctx.req.applicant
    if product.product_id == "PRD-7HLWPZ" and app.youngest_child_age is not None:
        return max(10, 21 - app.youngest_child_age)
    if product.product_type == "Endowment":
        return ctx.req.preferred_term_years or 15
    if product.is_ulip:
        return max(10, ctx.req.preferred_term_years or 15)
    return ctx.desired_term


def sa_bounds(product: Product, ctx: Context, already_bought: int = 0) -> Tuple[int, int, int]:
    """(lowest, highest, step) sum assured this customer may buy of the product."""
    step = product.sum_assured_step_inr or 100_000
    hi = product.max_sum_assured_inr or 0
    cap = eligibility.max_cover_allowed(product, ctx.req.applicant, already_bought)
    if cap is not None:
        hi = min(hi, cap)
    non_term = eligibility.max_non_term_cover(product, ctx.req.applicant)
    if non_term is not None:
        hi = min(hi, non_term)
    return product.min_sum_assured_inr or step, hi // step * step, step


def _target_sa(product: Product, ctx: Context, low: int, high: int, step: int) -> int:
    gap = max(ctx.gap, low)
    if product.variant == "decreasing_cover_term":
        gap = max(int(ctx.home_loan), low)
    if product.product_type in ("Whole Life", "Endowment"):
        gap = min(gap, max(low, int(ctx.income * 5)))  # savings products are sized to income, not to the whole gap
    return max(low, min(high, int(math.ceil(gap / step) * step)))


def _fit_to_budget(product: Product, ctx: Context, option: str, term: int, target: int, low: int, step: int) -> Tuple[int, Quote]:
    """Largest sum assured up to the target whose monthly instalment is within budget (binary search on steps)."""
    q = _quote(product, ctx, target, option, term)
    if ctx.budget is None or not q.valid or q.total_instalment <= ctx.budget:
        return target, q
    lo_i, hi_i = low // step, target // step
    best = None
    while lo_i <= hi_i:
        mid = (lo_i + hi_i) // 2
        cand = _quote(product, ctx, mid * step, option, term)
        if cand.valid and cand.total_instalment <= ctx.budget:
            best, lo_i = (mid * step, cand), mid + 1
        else:
            hi_i = mid - 1
    return best if best else (low, _quote(product, ctx, low, option, term))


def plan_nonlinked(
    product: Product, ctx: Context, budget_override: Optional[float] = None, already_bought: int = 0
) -> Tuple[Optional[Quote], List[str]]:
    low, high, step = sa_bounds(product, ctx, already_bought)
    if high < low:
        return None, ["Your cover limit (a multiple of income) leaves no room for this product."]
    picked = choose_term_and_option(product, ctx, desired_term_for(product, ctx))
    if picked is None:
        return None, ["No allowed term and payment option for your age."]
    option, term = picked
    target = _target_sa(product, ctx, low, high, step)
    saved_budget = ctx.budget
    ctx.budget = budget_override if budget_override is not None else ctx.budget
    try:
        _, q = _fit_to_budget(product, ctx, option, term, target, low, step)
    finally:
        ctx.budget = saved_budget
    return q, q.issues if not q.valid else []


def plan_ulip(
    product: Product, ctx: Context, budget_override: Optional[float] = None, already_bought: int = 0
) -> Tuple[Optional[Quote], List[str], Optional[str], Optional[float]]:
    app = ctx.req.applicant
    multiples = premium.ulip_sa_multiples(product, app.age)
    option = product.premium_payment_options[0] if product.premium_payment_options else "regular"
    lo_t, hi_t = product.min_policy_term_years or 10, product.max_policy_term_years or 20
    term = max(lo_t, min(hi_t, desired_term_for(product, ctx), product.max_maturity_age - app.age))
    if option == "single":
        surplus = int(ctx.req.liquid_investable * 0.25)
        annual = min(product.max_annual_premium_inr or 0, surplus // 10_000 * 10_000)
        if annual < (product.min_annual_premium_inr or 0):
            return (
                None,
                [f"A one-time investment of at least {product.min_annual_premium_inr:,} is needed and your savings allow less."],
                None,
                None,
            )
    else:
        budget = budget_override if budget_override is not None else ctx.budget
        monthly = budget if budget is not None else max(2_000.0, ctx.income * 0.06 / 12)
        annual = int(
            min(
                product.max_annual_premium_inr or 0,
                max(product.min_annual_premium_inr or 0, monthly * 12 // 1_000 * 1_000),
            )
        )
        if budget is not None and monthly * 12 < (product.min_annual_premium_inr or 0):
            return None, [f"Needs at least {product.min_annual_premium_inr:,} a year, above your budget."], None, None
    cap = eligibility.max_cover_allowed(product, app, already_bought)
    non_term = eligibility.max_non_term_cover(product, app)
    limit = min(x for x in (cap, non_term) if x is not None) if (cap is not None or non_term is not None) else 10**12
    usable = [m for m in sorted(multiples, reverse=True) if annual * m <= limit] or [min(multiples)] if multiples else []
    if not usable or annual * usable[0] > limit:
        return None, ["Your cover limit (a multiple of income) leaves no room for this product."], None, None
    fund = next(
        (
            f.fund_id
            for f in get_pack().funds.values()
            if f.fund_id in product.ulip_fund_ids and f.asset_class == FUND_BY_RISK[ctx.req.risk_appetite]
        ),
        (product.ulip_fund_ids or [None])[0],
    )
    q = premium.quote(
        QuoteRequest(
            product_id=product.product_id,
            applicant=app,
            policy_term_years=term,
            payment_option=option,
            mode="monthly",
            annual_premium=int(annual),
            sa_multiple=float(usable[0]),
            fund_id=fund,
        )
    )
    return q, q.issues if not q.valid else [], fund, float(usable[0])


# ---- scoring ------------------------------------------------------------------------------------------------------


def _protection(q: Quote, ctx: Context) -> Tuple[float, str]:
    if ctx.gap <= 0:
        return 0.5, "Your existing cover already meets your need, so extra protection is optional."
    share = min(1.0, q.sum_assured / ctx.gap)
    return share, f"Gives Rs {q.sum_assured:,} of cover against a recommended Rs {ctx.gap:,}."


def _affordability(q: Quote, ctx: Context) -> Tuple[float, str]:
    monthly = q.total_instalment if q.payment_option != "single" else q.total_instalment / max(1, q.policy_term_years * 12)
    if ctx.budget is None:
        pct = q.total_annual_premium / ctx.income * 100 if ctx.income else 100
        score = 1.0 if pct <= 3 else 0.7 if pct <= 8 else 0.3
        return score, f"Costs about {pct:.1f}% of your yearly income. No budget was given."
    ratio = monthly / ctx.budget
    return (1.0 if ratio <= 1 else max(0.0, 1 - (ratio - 1))), f"Rs {monthly:,.0f} a month against a budget of Rs {ctx.budget:,.0f}."


def _goal_fit(product: Product, ctx: Context) -> Tuple[float, str]:
    goals = set(ctx.goal_types)
    kid = {"child_education", "child_marriage"} & goals
    if product.product_id == "PRD-7HLWPZ":
        ok = ctx.req.applicant.youngest_child_age is not None and kid
        return (
            (1.0, "Built for a child's education, with premiums waived if you die.")
            if ok
            else (0.2, "Needs a child aged 0 to 15 and a child goal.")
        )
    if product.product_type == "Endowment":
        if goals:
            return (0.85 if "money_back" in product.variant else 0.75), "Pays out at set dates, which suits dated goals."
        return 0.3, "You have no dated goals to fund."
    if product.is_ulip:
        long_term = bool(LONG_TERM_GOALS & goals) or ctx.desired_term >= 15
        return (
            (0.8, "Long-term goals can use market-linked growth.")
            if long_term
            else (0.4, "Your horizon is short for a market-linked plan.")
        )
    if product.product_type == "Whole Life":
        rich = ctx.income >= 1_500_000 and ctx.req.applicant.age >= 30
        return (
            (0.55, "Lifelong cover can leave a legacy.")
            if rich
            else (0.3, "Lifelong cover is a bigger commitment than your income suggests.")
        )
    return 0.5, "Pure protection is the base of any plan."


def _risk_fit(product: Product, ctx: Context) -> Tuple[float, str]:
    risk = ctx.req.risk_appetite
    if product.is_ulip:
        return {"high": 1.0, "medium": 0.6, "low": 0.1}[
            risk
        ], f"Market-linked, which suits a {risk} risk appetite {'well' if risk == 'high' else 'only partly'}."
    if product.participation == "par":
        return {"high": 0.5, "medium": 0.8, "low": 0.7}[risk], "Bonuses are not guaranteed."
    if product.is_term:
        return 0.8, "No investment risk."
    return {"low": 1.0, "medium": 0.8, "high": 0.5}[risk], "Guaranteed benefits, so low risk."


def _term_fit(q: Quote, ctx: Context, product: Product) -> Tuple[float, str]:
    wanted = desired_term_for(product, ctx)
    return max(
        0.0, 1 - min(1.0, abs(q.policy_term_years - wanted) / 15)
    ), f"{q.policy_term_years}-year term against the {wanted} years you asked for."


def score_factors(product: Product, q: Quote, ctx: Context) -> List[Factor]:
    parts = {
        "protection": _protection(q, ctx),
        "affordability": _affordability(q, ctx),
        "goal_fit": _goal_fit(product, ctx),
        "risk_fit": _risk_fit(product, ctx),
        "term_fit": _term_fit(q, ctx, product),
    }
    return [Factor(key=k, label=LABELS[k], weight=BASE_WEIGHTS[k], score=round(parts[k][0], 3), detail=parts[k][1]) for k in FACTORS]


def evaluate(product: Product, ctx: Context, budget_override: Optional[float] = None, already_bought: int = 0) -> ProductFit:
    """One product for one customer: eligible or not, the configuration chosen, its exact price and its factor scores."""
    fit = ProductFit(
        product_id=product.product_id,
        product_name=product.product_name,
        product_type=product.product_type,
        variant=product.variant,
        summary=product.plain_language_summary,
        eligible=False,
        role=ROLE[product.product_type],
    )
    issues = eligibility.applicant_issues(product, ctx.req.applicant)
    if issues:
        fit.issues = issues
        return fit
    if product.is_ulip:
        q, problems, fund, multiple = plan_ulip(product, ctx, budget_override, already_bought)
        fit.fund_id, fit.sa_multiple = fund, multiple
    else:
        q, problems = plan_nonlinked(product, ctx, budget_override, already_bought)
    if q is None or problems:
        fit.issues = problems or ["Could not be priced for you."]
        return fit
    fit.eligible, fit.quote = True, q
    fit.factors = score_factors(product, q, ctx)
    fit.rule_percent = int(round(sum(f.weight * f.score for f in fit.factors) * 100))
    fit.match_percent = fit.rule_percent
    return fit


def evaluate_all(ctx: Context) -> List[ProductFit]:
    return [evaluate(p, ctx) for p in get_pack().products.values() if p.active]


def type_counts(fits: List[ProductFit]) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for f in fits:
        if f.eligible:
            out[f.product_type] = out.get(f.product_type, 0) + 1
    return out
