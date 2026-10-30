"""Public recommendation entry point: score every product, blend in the trained ranker, and assemble an affordable basket."""

from typing import List, Optional

from app.admin.config_store import config_store
from app.ml import ranker
from app.pack.loader import get_pack
from app.schemas.recommendation import Basket, ProductFit, RecommendRequest, RecommendResponse
from app.services import eligibility, planning

METHOD_NOTE = (
    "Needs are worked out with the Net Needs method (cross-checked by Human Life Value). Every product is then checked for eligibility "
    "(age, income, residency and the income-multiple cover caps), configured to your preferred term and budget, and priced exactly from "
    "Saffron Life's rate tables. Five readable factors give each product a rule score. A scikit-learn model trained on synthetic choices "
    "adds a second score for your stated priority, and the two are averaged. All Saffron Life products and prices are fictional."
)


def _blend(fits: List[ProductFit], ctx: planning.Context) -> str:
    eligible = [f for f in fits if f.eligible]
    probs = ranker.predict([ranker.vector(f, ctx, ctx.req.priority) for f in eligible]) if eligible else None
    if not probs:
        return "rules"
    top = max(probs) or 1.0
    for fit, pr in zip(eligible, probs, strict=True):
        fit.model_percent = int(round(pr / top * 100))
        fit.match_percent = int(round(ranker.BLEND * fit.model_percent + (1 - ranker.BLEND) * fit.rule_percent))
    return "rules+trained-model"


def _reason(fit: ProductFit) -> str:
    if not fit.eligible:
        return "Not available for you: " + "; ".join(fit.issues)
    best = max(fit.factors, key=lambda f: f.weight * f.score)
    weak = min(fit.factors, key=lambda f: f.score)
    text = f"Strongest on '{best.label.lower()}': {best.detail}"
    if weak.score < 0.5 and weak.key != best.key:
        text += f" Weaker on '{weak.label.lower()}': {weak.detail}"
    return text


def _top(fits: List[ProductFit], product_type: str) -> Optional[ProductFit]:
    pool = [f for f in fits if f.eligible and f.product_type == product_type]
    return max(pool, key=lambda f: f.match_percent) if pool else None


ADD_ON_LABEL = {"Endowment": "goal-funding plan", "ULIP": "growth plan"}


def _shortfall_note(core: ProductFit, ctx: planning.Context) -> str:
    """Says what actually limits the cover: the income-multiple cap or the budget. Blaming the wrong one would mislead."""
    product = get_pack().products[core.product_id]
    cap = eligibility.max_cover_allowed(product, ctx.req.applicant)
    gap = ctx.gap - core.quote.sum_assured
    if cap is not None and core.quote.sum_assured >= cap - (product.sum_assured_step_inr or 0):
        return (
            f"Saffron Life allows you at most Rs {cap:,} of new cover, a multiple of your income less your existing cover, "
            f"so protection is still short by Rs {gap:,}. An advisor can look at other ways to close the rest."
        )
    return (
        f"Your budget covers Rs {core.quote.sum_assured:,} of the Rs {ctx.gap:,} recommended, so protection is still short by Rs {gap:,}."
    )


def _build_basket(fits: List[ProductFit], ctx: planning.Context) -> Basket:
    """Core protection first, sized to the budget. Goal and growth add-ons only if budget and rules leave room."""
    pack = get_pack()
    notes: List[str] = []
    items: List[ProductFit] = []
    spent, bought, bought_non_term = 0.0, 0, 0
    core = _top(fits, "Term Life")
    if core:
        items.append(core)
        spent += core.quote.total_instalment
        bought += core.quote.sum_assured
        if core.quote.sum_assured < ctx.gap:
            notes.append(_shortfall_note(core, ctx))
    else:
        notes.append("No term plan is open to you with these details, so protection needs an advisor's help.")
    goals = set(ctx.goal_types)
    wants_growth = ctx.req.risk_appetite == "high" or (ctx.req.risk_appetite == "medium" and "retirement" in goals)
    add_ons = []
    if {"child_education", "child_marriage"} & goals:
        add_ons.append("Endowment")
    if wants_growth:
        add_ons.append("ULIP")
    for product_type in add_ons:
        left = (ctx.budget - spent) if ctx.budget is not None else None
        label = ADD_ON_LABEL[product_type]
        if left is not None and left <= 0:
            notes.append(f"No budget is left for a {label}.")
            continue
        candidate = _top(fits, product_type)
        if candidate is None:
            continue
        product = pack.products[candidate.product_id]
        again = planning.evaluate(product, ctx, budget_override=left, already_bought=bought if product_type != "Term Life" else 0)
        if not again.eligible or again.quote is None:
            notes.append(f"{candidate.product_name} was left out: {again.issues[0] if again.issues else 'it could not be priced'}")
            continue
        one_time = again.quote.payment_option == "single"
        if left is not None and not one_time and again.quote.total_instalment > left:
            notes.append(
                f"{candidate.product_name} costs at least Rs {again.quote.total_instalment:,} a month, "
                f"more than the Rs {int(left):,} left in your budget."
            )
            continue
        again.match_percent, again.model_percent, again.rule_percent = (
            candidate.match_percent,
            candidate.model_percent,
            candidate.rule_percent,
        )
        again.reason = _reason(again)
        items.append(again)
        spent += again.quote.total_instalment
        bought += again.quote.sum_assured
        bought_non_term += again.quote.sum_assured
    for it in items:
        it.in_basket = True
    budget = int(ctx.budget) if ctx.budget is not None else None
    short = max(0, ctx.gap - bought)
    return Basket(
        items=items,
        total_monthly=int(spent),
        total_cover=int(bought),
        budget_monthly=budget,
        within_budget=budget is None or spent <= budget,
        cover_shortfall=short,
        notes=notes,
    )


def recommend(req: RecommendRequest) -> RecommendResponse:
    with config_store.pinned() as active:
        response = _recommend(req)
        response.config_version = active.config.version
        return response


def _recommend(req: RecommendRequest) -> RecommendResponse:
    ctx = planning.build_context(req)
    fits = planning.evaluate_all(ctx)
    method = _blend(fits, ctx)
    for fit in fits:
        fit.reason = _reason(fit)
    fits.sort(key=lambda f: (not f.eligible, -f.match_percent))
    for i, fit in enumerate(fits, start=1):
        fit.rank = i
    basket = _build_basket(fits, ctx)
    chosen = {i.product_id for i in basket.items}
    for fit in fits:
        fit.in_basket = fit.product_id in chosen
    return RecommendResponse(
        recommended_cover=ctx.gap,
        coverage_gap=int(ctx.needs.net_coverage_gap),
        term_years=ctx.desired_term,
        budget_monthly=basket.budget_monthly,
        products=fits,
        basket=basket,
        ranking_method=method,
        methodology_note=METHOD_NOTE,
        type_counts=planning.type_counts(fits),
    )
