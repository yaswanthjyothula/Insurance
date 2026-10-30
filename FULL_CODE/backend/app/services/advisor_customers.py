"""The advisor's customer book: a searchable list and a full profile with the needs analysis.

Only the advisor's own customers are reachable.
"""

import math
from typing import Callable, List, Optional, Tuple

from app.core.security import AdvisorUser
from app.pack.loader import get_pack
from app.pack.models import Profile
from app.schemas.advisor import (
    CustomerDetail,
    CustomerOverview,
    CustomerPage,
    CustomerSummary,
    FinancialProfile,
    GoalOut,
    LiabilityOut,
    TimelineEvent,
)
from app.services import advisor_followups, assignments
from app.services.advisor_dashboard import gap_band
from app.services.financial_engine import FinancialEngine
from app.services.profiles import to_assessment_input

SORTS = {"name", "age", "income", "gap"}


def _dependents(p: Profile) -> int:
    return (1 if p.spouse else 0) + len(p.children_ages) + len(p.parent_ages)


def _summary(p: Profile) -> CustomerSummary:
    needs = FinancialEngine.calculate_needs(to_assessment_input(p))
    return CustomerSummary(
        profile_id=p.profile_id,
        full_name=p.full_name,
        age=p.age,
        city=p.city,
        occupation=p.occupation,
        annual_income_inr=p.annual_income_inr,
        risk_appetite=p.risk_appetite,
        dependents=_dependents(p),
        gap_band=gap_band(needs.net_coverage_gap, needs.total_gross_need),
        net_coverage_gap_inr=int(round(needs.net_coverage_gap)),
    )


def _sort_key(sort: str) -> Callable[[CustomerSummary], Tuple]:
    return {
        "name": lambda c: (c.full_name.lower(), c.profile_id),
        "age": lambda c: (c.age, c.profile_id),
        "income": lambda c: (c.annual_income_inr, c.profile_id),
        "gap": lambda c: (c.net_coverage_gap_inr, c.profile_id),
    }[sort]


def list_customers(
    advisor: AdvisorUser,
    q: Optional[str],
    band: Optional[str],
    risk: Optional[str],
    sort: str,
    descending: bool,
    page: int,
    page_size: int,
) -> CustomerPage:
    rows = [_summary(p) for p in assignments.customers_for(advisor.advisor_id)]
    needle = (q or "").strip().lower()
    if needle:
        rows = [c for c in rows if needle in f"{c.full_name} {c.city} {c.occupation} {c.profile_id}".lower()]
    if band:
        rows = [c for c in rows if c.gap_band == band]
    if risk:
        rows = [c for c in rows if c.risk_appetite == risk]
    rows.sort(key=_sort_key(sort if sort in SORTS else "name"), reverse=descending)
    pages = max(1, math.ceil(len(rows) / page_size))
    page = min(page, pages)
    start = (page - 1) * page_size
    return CustomerPage(items=rows[start : start + page_size], total=len(rows), page=page, page_size=page_size, pages=pages)


def _liabilities(p: Profile) -> List[LiabilityOut]:
    return [
        LiabilityOut(
            loan_type=li.loan_type.replace("_", " "),
            outstanding_inr=li.outstanding_principal_inr,
            emi_inr=li.emi_inr,
            remaining_months=li.remaining_tenure_months,
        )
        for li in p.liabilities
        if li.outstanding_principal_inr > 0
    ]


def detail(advisor: AdvisorUser, profile: Profile) -> CustomerDetail:
    """Everything shown comes from the pack record and the needs engine.

    Health details are left out: the needs analysis does not use them.
    """
    adv = get_pack().advisors[advisor.advisor_id]
    inp = to_assessment_input(profile)
    spouse = profile.spouse
    overview = CustomerOverview(
        profile_id=profile.profile_id,
        full_name=profile.full_name,
        age=profile.age,
        gender=profile.gender,
        city=profile.city,
        occupation=profile.occupation,
        employment_type=profile.employment_type.replace("_", " "),
        marital_status=profile.marital_status,
        annual_income_inr=profile.annual_income_inr,
        dependents=_dependents(profile),
        children=len(profile.children_ages),
        parents=len(profile.parent_ages),
        spouse_working=spouse.working if spouse else None,
        risk_appetite=profile.risk_appetite,
        smoker=profile.smoker_status == "smoker",
        assigned_advisor_id=adv.advisor_id,
        assigned_advisor_name=adv.advisor_name,
    )
    financial = FinancialProfile(
        monthly_income_inr=round(profile.annual_income_inr / 12),
        monthly_expenses_inr=profile.monthly_household_expenses_inr,
        individual_cover_inr=profile.individual_cover_inr,
        employer_group_cover_inr=profile.employer_group_cover_inr,
        liabilities=_liabilities(profile),
        liquid_savings_inr=profile.liquid_savings_inr,
        market_investments_inr=profile.market_investments_inr,
        retirement_savings_inr=profile.retirement_savings_inr,
        eligible_assets_inr=int(inp.eligible_assets),
        goals=[
            GoalOut(
                goal_type=g.goal_type.replace("_", " "),
                beneficiary=g.beneficiary,
                amount_today_inr=g.target_amount_today_inr,
                target_year=g.target_year,
                priority=g.priority,
            )
            for g in profile.goals
        ],
        monthly_premium_budget_inr=profile.monthly_premium_budget_inr,
    )
    # Not saved: viewing a customer must not create assessment records
    analysis = FinancialEngine.assess(inp, assessment_id=f"view-{profile.profile_id}")
    # The pack holds one dated snapshot per customer. Assessments, quotes and notes are not recorded per customer yet.
    timeline = [
        TimelineEvent(
            kind="profile",
            title="Profile on file",
            detail="Sample customer record from the problem pack",
            at=profile.profile_date,
        )
    ]
    for item in advisor_followups.list_for(advisor, "all", profile.profile_id):
        timeline.append(
            TimelineEvent(
                kind="follow_up",
                title=f"Follow-up: {item.title}",
                detail=f"{'Done' if item.status == 'done' else 'Due ' + item.due_date} · {item.priority} priority",
                at=item.completed_at or item.created_at,
            )
        )
    timeline.sort(key=lambda e: e.at, reverse=True)
    return CustomerDetail(overview=overview, financial=financial, analysis=analysis, timeline=timeline)
