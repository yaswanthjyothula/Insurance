"""Quick quote: age, income, dependents and loans in; sum assured and monthly premium out (public API and admin test calculator)."""

import time
from typing import Any, Dict, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.admin.config_store import config_store
from app.pack.loader import get_pack
from app.schemas.financial import AssessmentInput
from app.schemas.quote import Applicant
from app.schemas.recommendation import RecommendRequest
from app.services import underwriting_engine
from app.services.financial_engine import FinancialEngine
from app.services.recommendation import recommend


class QuickQuoteIn(BaseModel):
    """The four facts a quick quote needs, plus optional refinements. Common alternative field names are accepted too."""

    model_config = ConfigDict(populate_by_name=True)

    age: int = Field(..., ge=18, le=75)
    annual_income: int = Field(..., ge=0, le=1_000_000_000, validation_alias=AliasChoices("annual_income", "income"))
    dependents: int = Field(..., ge=0, le=10, validation_alias=AliasChoices("dependents", "dependents_count"))
    gender: str = Field("male", pattern="^(male|female)$")
    smoker: bool = False
    annual_expenses: Optional[int] = Field(None, ge=0, le=1_000_000_000)
    outstanding_liabilities: int = Field(
        0, ge=0, le=10_000_000_000, validation_alias=AliasChoices("outstanding_liabilities", "loans", "liabilities")
    )
    existing_cover: int = Field(0, ge=0, le=10_000_000_000)
    eligible_assets: int = Field(0, ge=0, le=10_000_000_000)
    monthly_budget: Optional[int] = Field(None, ge=0, le=10_000_000)


def quick_quote(req: QuickQuoteIn) -> Dict[str, Any]:
    """Sum assured (Net Needs) and the best eligible product's monthly premium, from the live configuration.

    Expenses default to 40% of income when not given. Runs the same engines as the customer journey, so admin changes apply at once.
    """
    started = time.perf_counter()
    with config_store.pinned() as active:
        assessment = AssessmentInput(
            age=req.age,
            annual_income=req.annual_income,
            annual_expenses=req.annual_expenses if req.annual_expenses is not None else round(req.annual_income * 0.4),
            dependents_count=req.dependents,
            outstanding_liabilities=req.outstanding_liabilities,
            existing_cover=req.existing_cover,
            eligible_assets=req.eligible_assets,
            gender=req.gender,  # type: ignore[arg-type]
            smoker_status=req.smoker,
        )
        applicant = Applicant(
            age=req.age, gender=req.gender, smoker=req.smoker, annual_income=req.annual_income, existing_individual_cover=req.existing_cover
        )  # type: ignore[arg-type]
        needs = FinancialEngine.assess(assessment)
        recs = recommend(RecommendRequest(assessment=assessment, applicant=applicant, monthly_budget=req.monthly_budget))
        pack = get_pack()
        rows = []
        for fit in recs.products:
            q = fit.quote
            rows.append(
                {
                    "product_id": fit.product_id,
                    "product_name": fit.product_name,
                    "category": fit.product_type,
                    "eligible": fit.eligible,
                    "sum_assured": q.sum_assured if q else None,
                    "term_years": q.policy_term_years if q else None,
                    "monthly_premium": q.total_instalment if q and q.payment_option != "single" else None,
                    "annual_premium": q.total_annual_premium if q else None,
                    "rate_per_1000": q.rate_per_1000 if q else None,
                    "underwriting_route": q.underwriting.route if q and q.underwriting else None,
                    "stp_eligible": q.underwriting.stp_eligible if q and q.underwriting else None,
                    "issues": fit.issues[:2],
                    "rank": fit.rank,
                }
            )
        headline_row = next((r for r in rows if r["eligible"]), None)
        route = (
            underwriting_engine.assess(req.age, needs.net_needs.recommended_cover or 1, req.smoker)
            if needs.net_needs.recommended_cover
            else None
        )
        return {
            "sum_assured": needs.net_needs.recommended_cover,
            "monthly_premium": headline_row["monthly_premium"] if headline_row else None,
            "product_id": headline_row["product_id"] if headline_row else None,
            "product_name": headline_row["product_name"] if headline_row else None,
            "config_version": active.config.version,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
            "needs": {
                "total_need": needs.net_needs.total_gross_need,
                "net_coverage_gap": needs.net_needs.net_coverage_gap,
                "recommended_cover": needs.net_needs.recommended_cover,
                "hlv_net_gap": needs.hlv.hlv_net_gap,
                "income_multiple_check": needs.income_multiple_check.model_dump() if needs.income_multiple_check else None,
                "inflation_rate": pack.needs.inflation_rate,
                "discount_rate": pack.needs.discount_rate,
            },
            "headline": headline_row,
            "underwriting_for_recommended_cover": route.model_dump() if route else None,
            "products": rows,
        }
