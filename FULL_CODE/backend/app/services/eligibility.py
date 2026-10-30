"""Who can buy what: product age/income/residency rules and the pack's cover caps (section 6.3 of the pack)."""

from typing import List, Optional, Tuple

from app.pack.models import Product
from app.schemas.quote import Applicant


def income_multiple(product: Product, age: int) -> Optional[int]:
    for limit in product.income_multiple_limits:
        if limit.min_age <= age <= limit.max_age:
            return limit.max_multiple_of_annual_income
    return None


def applicant_issues(product: Product, app: Applicant) -> List[str]:
    issues: List[str] = []
    if not product.active:
        return ["This product is not currently offered."]
    if not product.min_entry_age <= app.age <= product.max_entry_age:
        issues.append(f"Entry age must be {product.min_entry_age} to {product.max_entry_age} (you are {app.age}).")
    if app.residency == "nri" and not product.nri_eligible:
        issues.append("This product is not open to NRIs.")
    if app.annual_income <= 0:
        if not (product.non_earning_applicant_allowed and app.spouse_working and app.spouse_annual_income > 0):
            issues.append("Needs an income of your own, or a working spouse where the product allows it.")
    elif app.annual_income < product.min_annual_income_inr:
        issues.append(f"Minimum annual income is {product.min_annual_income_inr:,}.")
    if product.product_id == "PRD-7HLWPZ" and product.extra_rules and app.youngest_child_age is not None:
        low, high = product.extra_rules.get("child_age_min", 0), product.extra_rules.get("child_age_max", 15)
        if not low <= app.youngest_child_age <= high:
            issues.append(f"The child must be {low} to {high} years old.")
    return issues


def sum_assured_issues(product: Product, sa: int) -> List[str]:
    if product.min_sum_assured_inr is None or product.max_sum_assured_inr is None:
        return []
    issues: List[str] = []
    if not product.min_sum_assured_inr <= sa <= product.max_sum_assured_inr:
        issues.append(f"Sum assured must be between {product.min_sum_assured_inr:,} and {product.max_sum_assured_inr:,}.")
    step = product.sum_assured_step_inr or 1
    if sa % step:
        issues.append(f"Sum assured must be in steps of {step:,}.")
    return issues


def max_cover_allowed(product: Product, app: Applicant, already_bought: int = 0) -> Optional[int]:
    """Largest new sum assured the income-multiple cap allows after existing cover and anything already in the basket."""
    if app.annual_income > 0:
        multiple = income_multiple(product, app.age)
        if multiple is None:
            return None
        cap = multiple * app.annual_income
    else:
        caps = [product.non_earning_max_cover_inr] if product.non_earning_max_cover_inr else []
        if product.non_earning_max_multiple_of_spouse_income:
            caps.append(product.non_earning_max_multiple_of_spouse_income * app.spouse_annual_income)
        if not caps:
            return 0
        cap = min(caps)
    return max(0, cap - app.existing_individual_cover - already_bought)


def max_non_term_cover(product: Product, app: Applicant, already_bought_non_term: int = 0) -> Optional[int]:
    """Cap on the combined new Whole Life, Endowment and ULIP sum assured (10x income in the pack)."""
    if product.max_new_non_term_sa_multiple_of_income is None:
        return None
    base = app.annual_income if app.annual_income > 0 else app.spouse_annual_income
    return max(0, product.max_new_non_term_sa_multiple_of_income * base - already_bought_non_term)


def basket_issues(items: List[Tuple[Product, int]], app: Applicant) -> Tuple[List[str], int, Optional[int]]:
    """Checks the whole basket against the pack's cover caps: total cover (all products) and new non-term cover."""
    issues: List[str] = []
    total = sum(sa for _, sa in items)
    caps = [c for c in (max_cover_allowed(p, app) for p, _ in items) if c is not None]
    cover_cap = min(caps) if caps else None
    if cover_cap is not None and total > cover_cap:
        issues.append(f"Together these add Rs {total:,} of cover, above the Rs {cover_cap:,} your income and existing cover allow.")
    non_term = sum(sa for p, sa in items if not p.is_term)
    limits = [m for m in (max_non_term_cover(p, app) for p, _ in items if not p.is_term) if m is not None]
    if limits and non_term > min(limits):
        issues.append(f"Whole Life, Endowment and ULIP cover together may not exceed Rs {min(limits):,}.")
    return issues, total, cover_cap
