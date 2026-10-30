"""Turns a pack customer profile into the engine's inputs. Used for the 'try a sample customer' flow and for training."""

from typing import Optional

from app.pack.models import Profile
from app.schemas.financial import AssessmentInput, FutureGoal
from app.schemas.quote import Applicant
from app.schemas.recommendation import RecommendRequest

GOAL_CATEGORY = {
    "child_education": "education",
    "child_marriage": "marriage",
    "house_purchase": "property",
    "parents_care": "family_support",
}


def goals_for(profile: Profile):
    """Own retirement is left out of a life-cover need (the customer funds it themselves)."""
    reference_year = int(profile.profile_date[:4]) if profile.profile_date else 2026
    goals = []
    for g in profile.goals:
        category = GOAL_CATEGORY.get(g.goal_type)
        if category is None:
            continue
        goals.append(
            FutureGoal(
                name=g.goal_type.replace("_", " ").capitalize(),
                cost_today=float(g.target_amount_today_inr),
                years_away=max(0, min(40, g.target_year - reference_year)),
                category=category,
            )
        )
    return goals


def to_assessment_input(profile: Profile, count_group_cover: bool = True, count_retirement_savings: bool = False) -> AssessmentInput:
    spouse = profile.spouse
    existing = profile.individual_cover_inr + (profile.employer_group_cover_inr if count_group_cover else 0)
    assets = (
        profile.liquid_savings_inr + profile.market_investments_inr + (profile.retirement_savings_inr if count_retirement_savings else 0)
    )
    return AssessmentInput(
        age=profile.age,
        annual_income=float(profile.annual_income_inr),
        annual_expenses=float(profile.monthly_household_expenses_inr * 12),
        dependents_count=min(10, (1 if spouse else 0) + len(profile.children_ages) + len(profile.parent_ages)),
        outstanding_liabilities=float(sum(li.outstanding_principal_inr for li in profile.liabilities)),
        existing_cover=float(existing),
        eligible_assets=float(assets),
        future_goals=goals_for(profile),
        spouse_age=spouse.age if spouse else None,
        children_ages=profile.children_ages,
        parent_ages=profile.parent_ages,
        income_growth_pct=profile.expected_income_growth_pct,
        smoker_status=profile.smoker_status == "smoker",
    )


def to_applicant(profile: Profile) -> Applicant:
    spouse = profile.spouse
    return Applicant(
        age=profile.age,
        gender=profile.gender,
        smoker=profile.smoker_status == "smoker",
        annual_income=profile.annual_income_inr,
        residency=profile.residency_status if profile.residency_status in ("resident", "nri") else "resident",
        spouse_working=bool(spouse and spouse.working),
        spouse_annual_income=spouse.annual_income_inr if spouse else 0,
        existing_individual_cover=profile.individual_cover_inr,
        youngest_child_age=min(profile.children_ages) if profile.children_ages else None,
    )


def to_recommend_request(profile: Profile, priority: str = "balanced") -> RecommendRequest:
    budget: Optional[int] = profile.monthly_premium_budget_inr or None
    risk = {"low": "low", "medium": "medium", "high": "high"}.get(profile.risk_appetite, "medium")
    return RecommendRequest(
        assessment=to_assessment_input(profile),
        applicant=to_applicant(profile),
        monthly_budget=budget,
        preferred_term_years=profile.preferred_policy_term_years,
        risk_appetite=risk,
        priority=priority,
        liquid_investable=profile.liquid_savings_inr + profile.market_investments_inr,
        goal_types=sorted({g.goal_type for g in profile.goals}),
    )
