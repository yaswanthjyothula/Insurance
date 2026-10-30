"""Built-in reading of a scenario sentence, used when the language model is unavailable. Simple keyword rules, clearly labelled as such."""

import re
from typing import Any, Dict, List

from app.schemas.financial import AssessmentInput

MODEL_LABEL = "built-in-rules"
MONEY = re.compile(r"(\d+(?:\.\d+)?)\s*(crore|cr|lakhs?|lacs?|l)\b")


def _amount(text: str) -> float:
    """First rupee amount in the text, or 0."""
    m = MONEY.search(text)
    if not m:
        return 0.0
    unit = m.group(2)
    return float(m.group(1)) * (10_000_000 if unit in ("crore", "cr") else 100_000)


def read_scenario(text: str, base: AssessmentInput) -> Dict[str, Any]:
    t = text.lower()
    overrides: Dict[str, float] = {}
    goals: List[Dict[str, Any]] = []
    notes: List[str] = []
    if "twin" in t:
        overrides.update(dependents_count=base.dependents_count + 2, annual_expenses=round(base.annual_expenses * 1.3, 2))
        goals.append({"name": "Twins' higher education", "cost_today": 4_000_000, "years_away": 18, "category": "education"})
        notes.append("Twins add two dependents and about 30% to living costs.")
    elif any(w in t for w in ("child", "baby", "kid", "pregnan")):
        overrides.update(dependents_count=base.dependents_count + 1, annual_expenses=round(base.annual_expenses * 1.15, 2))
        goals.append({"name": "Child's higher education", "cost_today": 2_500_000, "years_away": 18, "category": "education"})
        notes.append("A child adds a dependent and about 15% to living costs.")
    if any(w in t for w in ("loan", "mortgage", "flat", "house", "borrow", "debt")):
        added = _amount(t) or 5_000_000.0
        overrides["outstanding_liabilities"] = base.outstanding_liabilities + added
        notes.append(f"New borrowing adds about Rs {added:,.0f} of loans.")
    if any(w in t for w in ("startup", "business", "quit", "sabbatical", "career break", "part-time", "part time")):
        overrides["annual_income"] = round(base.annual_income * 0.5, 2)
        notes.append("A career change is modelled as a 50% fall in income.")
    retire = re.search(r"retire\D{0,20}(\d{2})", t)
    if retire and 45 <= int(retire.group(1)) <= 75:
        overrides["retirement_age"] = int(retire.group(1))
        notes.append(f"Retirement moves to age {retire.group(1)}.")
    return {
        "scenario_title": "Custom life change",
        "ai_analysis": " ".join(notes) or "No change to your numbers could be read from the text.",
        "overrides": overrides,
        "added_goals": goals,
        "actionable_recommendations": [
            "Re-check your cover after the change.",
            "Keep 6 to 12 months of expenses in an emergency fund.",
        ],
        "model_used": MODEL_LABEL,
    }
