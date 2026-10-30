from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.admin import analytics
from app.core.security import SessionUser, optional_user
from app.ml.ranker import model_info
from app.pack.loader import get_pack
from app.schemas.quote import BasketCheck, BasketCheckRequest, Quote, QuoteRequest
from app.schemas.recommendation import RecommendRequest, RecommendResponse
from app.schemas.ulip import UlipProjection, UlipProjectionRequest
from app.services import eligibility, premium, ulip
from app.services.quick_quote import QuickQuoteIn, quick_quote
from app.services.recommendation import recommend

router = APIRouter(tags=["recommendations"])


@router.post("/recommendations", response_model=RecommendResponse)
def recommendations(req: RecommendRequest, user: Optional[SessionUser] = Depends(optional_user)) -> RecommendResponse:
    response = recommend(req)
    analytics.track("recommendations_viewed", user.email if user else None, basket=[i.product_id for i in response.basket.items])
    return response


@router.get("/recommendations/model-info")
def recommendation_model_info():
    """The trained ranker: how it was trained, how well it does, and its limits."""
    return model_info()


@router.post("/quick-quote")
def quick_quote_route(req: QuickQuoteIn) -> Dict[str, Any]:
    """Age, income, dependents and loans in; sum assured and monthly premium out, priced with the live admin configuration."""
    return quick_quote(req)


@router.post("/quotes", response_model=Quote)
def quote(req: QuoteRequest) -> Quote:
    try:
        return premium.quote(req)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc


@router.post("/quotes/basket", response_model=BasketCheck)
def check_basket(req: BasketCheckRequest) -> BasketCheck:
    """Whether the chosen policies are allowed together (the pack's cover caps apply to the whole basket)."""
    products = get_pack().products
    if any(item.product_id not in products for item in req.items):
        raise HTTPException(status_code=404, detail="Product not found")
    issues, total, cap = eligibility.basket_issues([(products[i.product_id], i.sum_assured) for i in req.items], req.applicant)
    return BasketCheck(valid=not issues, issues=issues, total_new_cover=total, cover_cap=cap)


@router.post("/ulip/projection", response_model=UlipProjection)
def ulip_projection(req: UlipProjectionRequest) -> UlipProjection:
    try:
        return ulip.project(req)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown ULIP product or fund") from exc


@router.get("/premium/indicative")
def indicative(age: int, gender: str, sum_assured: int, smoker: bool = False, term: int = 30):
    """Yearly cost of plain term cover from the pack's rates, for the calculators."""
    if not 18 <= age <= 75 or gender not in ("male", "female") or not 0 < sum_assured <= 10_000_000_000:
        raise HTTPException(status_code=422, detail="Check age, gender and cover.")
    value = premium.indicative_term_premium(sum_assured, age, gender, smoker, term)
    return {"annual_premium": value, "available": value is not None}
