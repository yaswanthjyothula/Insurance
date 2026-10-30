"""Built-in NLP parser for scenario text, used when the language model is unavailable or for deterministic fallback.
Strictly constrained to LifeSure AI insurance, financial parameters, and protection events."""

import re
from typing import Any, Dict, List

from app.schemas.financial import AssessmentInput

MODEL_LABEL = "built-in-rules"
MONEY = re.compile(r"(\d+(?:\.\d+)?)\s*(crore|cr|lakhs?|lacs?|l)\b")

# Strict guardrail: relevant keywords indicating a legitimate life insurance / protection scenario
RELEVANT_PATTERNS = [
    r"\b(child|baby|kid|pregnant|pregnancy|twins?|son|daughter)\b",
    r"\b(loan|mortgage|debt|emi|home\s*loan|car\s*loan|flat|property|house|borrow)\b",
    r"\b(retire|retirement|pension|early\s*retirement)\b",
    r"\b(income|salary|earn|earning|job|quit|startup|business|career|sabbatical|pay\s*cut)\b",
    r"\b(expense|expenses|cost|spending|living\s*cost)\b",
    r"\b(asset|assets|savings|investment|portfolio|liquid|corpus)\b",
    r"\b(marry|marriage|wedding|spouse|partner|wife|husband|dependent|family)\b",
    r"\b(insurance|cover|policy|term|protection|coverage)\b",
]
RELEVANT_REGEX = re.compile("|".join(RELEVANT_PATTERNS), re.IGNORECASE)


def is_relevant_scenario(text: str) -> bool:
    """Verifies that the prompt is strictly within the LifeSure AI insurance and financial life change domain."""
    return bool(RELEVANT_REGEX.search(text))


def _amount(text: str) -> float:
    """First rupee amount in the text, or 0."""
    m = MONEY.search(text)
    if not m:
        return 0.0
    unit = m.group(2)
    return float(m.group(1)) * (10_000_000 if unit in ("crore", "cr") else 100_000)


def read_scenario(text: str, base: AssessmentInput) -> Dict[str, Any]:
    t = text.lower()
    
    # 1. Strict domain relevance check: reject out-of-context prompts
    if not is_relevant_scenario(t):
        return {
            "scenario_title": "Out of Scope Request",
            "ai_analysis": "LifeSure Scenario Studio only models life events that affect your insurance coverage and family protection needs. Please describe a life change such as welcoming a child, taking a home loan, changing careers, or early retirement.",
            "overrides": {},
            "added_goals": [],
            "actionable_recommendations": [
                "Describe a life event relevant to family protection (e.g., welcoming a child, taking a home loan, early retirement).",
                "Use the quick event buttons below for pre-configured protection scenarios.",
            ],
            "model_used": MODEL_LABEL,
        }

    overrides: Dict[str, float] = {}
    goals: List[Dict[str, Any]] = []
    notes: List[str] = []
    
    # Dependents & Child events
    if "twin" in t:
        overrides.update(dependents_count=base.dependents_count + 2, annual_expenses=round(base.annual_expenses * 1.3, 2))
        goals.append({"name": "Twins' higher education", "cost_today": 4_000_000, "years_away": 18, "category": "education"})
        notes.append("Twins add two dependents, higher education milestones, and increase living costs by 30%.")
    elif any(w in t for w in ("child", "baby", "kid", "pregnan", "son", "daughter")):
        overrides.update(dependents_count=base.dependents_count + 1, annual_expenses=round(base.annual_expenses * 1.15, 2))
        goals.append({"name": "Child's higher education", "cost_today": 2_500_000, "years_away": 18, "category": "education"})
        notes.append("Welcoming a child adds 1 dependent, ₹25 Lakh education goal, and raises household living expenses by 15%.")
    
    # Loans & Liabilities
    if any(w in t for w in ("loan", "mortgage", "flat", "house", "borrow", "debt", "emi")):
        if "clear" in t or "paid off" in t or "zero" in t:
            overrides["outstanding_liabilities"] = 0.0
            notes.append("Clearing outstanding debt reduces liabilities to ₹0, lowering the net protection gap rupee-for-rupee.")
        else:
            added = _amount(t) or 5_000_000.0
            overrides["outstanding_liabilities"] = base.outstanding_liabilities + added
            notes.append(f"Adding ₹{added:,.0f} in liabilities requires additional cover to ensure family debt immunization.")
            
    # Career & Income Changes
    if any(w in t for w in ("startup", "business", "quit", "sabbatical", "career break", "part-time", "part time", "pay cut")):
        overrides["annual_income"] = round(base.annual_income * 0.5, 2)
        notes.append("A career transition or sabbatical is modeled with a 50% temporary income drop to stress-test your emergency buffer.")
    elif "hike" in t or "promotion" in t or "raise" in t:
        overrides["annual_income"] = round(base.annual_income * 1.25, 2)
        notes.append("A 25% salary increase raises future income replacement value (Human Life Value).")

    # Retirement Age Changes
    retire = re.search(r"retire\D{0,20}(\d{2})", t)
    if retire and 45 <= int(retire.group(1)) <= 75:
        overrides["retirement_age"] = int(retire.group(1))
        notes.append(f"Modifying retirement to age {retire.group(1)} compresses the income support horizon accordingly.")

    return {
        "scenario_title": "Custom Protection Scenario" if notes else "Custom life change",
        "ai_analysis": " ".join(notes) or "Scenario evaluated against your LifeSure protection baseline.",
        "overrides": overrides,
        "added_goals": goals,
        "actionable_recommendations": [
            "Review your recalculated coverage gap under this scenario.",
            "Maintain an emergency buffer equal to 6-12 months of living expenses.",
        ],
        "model_used": MODEL_LABEL,
    }
