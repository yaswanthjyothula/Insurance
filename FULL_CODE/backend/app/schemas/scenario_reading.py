"""What we accept back from the language model. Anything outside these shapes and ranges is rejected."""

from typing import Dict, List

from pydantic import BaseModel, Field, field_validator

ALLOWED = {
    "annual_income": (0, 1_000_000_000),
    "annual_expenses": (0, 1_000_000_000),
    "outstanding_liabilities": (0, 5_000_000_000),
    "dependents_count": (0, 10),
    "retirement_age": (45, 75),
    "eligible_assets": (0, 5_000_000_000),
}
INT_FIELDS = {"dependents_count", "retirement_age"}


class AddedGoal(BaseModel):
    name: str = Field(..., max_length=80)
    cost_today: float = Field(..., ge=0, le=1_000_000_000)
    years_away: int = Field(..., ge=0, le=40)
    category: str = "other"

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        return v if v in {"education", "marriage", "property", "family_support", "other"} else "other"


class ScenarioReading(BaseModel):
    scenario_title: str = Field("Custom life change", max_length=80)
    ai_analysis: str = Field("", max_length=700)
    overrides: Dict[str, float] = Field(default_factory=dict)
    added_goals: List[AddedGoal] = Field(default_factory=list, max_length=4)
    actionable_recommendations: List[str] = Field(default_factory=list, max_length=5)

    @field_validator("overrides")
    @classmethod
    def _overrides(cls, v: Dict[str, float]) -> Dict[str, float]:
        clean = {}
        for key, value in v.items():
            if key in ALLOWED:
                low, high = ALLOWED[key]
                clean[key] = int(min(max(value, low), high)) if key in INT_FIELDS else float(min(max(value, low), high))
        return clean

    @field_validator("actionable_recommendations")
    @classmethod
    def _recs(cls, v: List[str]) -> List[str]:
        return [r[:200] for r in v]
