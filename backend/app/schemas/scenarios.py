from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.schemas.financial import AssessmentInput, AssessmentResult

class ScenarioInput(BaseModel):
    scenario_type: str = Field(..., description="another_child, retire_55, income_drop_20, loan_cleared, add_home_loan, custom, ai_custom")
    title: str = Field(..., description="Human-readable scenario title")
    description: str = Field("", description="Context or user notes")
    overrides: Dict[str, Any] = Field(default_factory=dict, description="Fields modified in the baseline AssessmentInput")

class ScenarioDiff(BaseModel):
    field: str
    label: str
    baseline_value: Any
    scenario_value: Any
    difference_str: str

class ScenarioComparisonResult(BaseModel):
    scenario_id: str
    scenario_type: str
    title: str
    description: str
    baseline_result: AssessmentResult
    scenario_result: AssessmentResult
    diffs: list[ScenarioDiff]
    cover_difference: float
    estimated_premium_difference: float
    explanation: str

class ScenarioCompareRequest(BaseModel):
    baseline_input: AssessmentInput
    scenario: ScenarioInput

class AICustomScenarioRequest(BaseModel):
    user_scenario_prompt: str = Field(..., min_length=3, description="Free text description of real-life scenario")
    baseline_input: AssessmentInput

class AICustomScenarioResponse(BaseModel):
    scenario_comparison: ScenarioComparisonResult
    ai_title: str
    ai_analysis: str
    actionable_recommendations: List[str]
    detected_adjustments: Dict[str, Any]
    model_used: str
