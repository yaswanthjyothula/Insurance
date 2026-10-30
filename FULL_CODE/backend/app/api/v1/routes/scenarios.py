import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import rate_limit
from app.schemas.financial import AssessmentInput
from app.schemas.scenarios import (
    AICustomScenarioRequest,
    AICustomScenarioResponse,
    ScenarioCompareRequest,
    ScenarioComparisonResult,
    ScenarioInput,
)
from app.services import scenario_llm
from app.services.scenario_engine import ScenarioEngine
from app.services.storage import storage_service

log = logging.getLogger("lifesure.scenarios")
router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.post("", response_model=ScenarioComparisonResult)
def run_scenario(scenario: ScenarioInput, baseline_input: AssessmentInput) -> ScenarioComparisonResult:
    result = ScenarioEngine.apply_scenario(baseline_input, scenario)
    storage_service.save_scenario(result.model_dump())
    return result


@router.post("/compare", response_model=ScenarioComparisonResult)
def compare(req: ScenarioCompareRequest) -> ScenarioComparisonResult:
    return run_scenario(req.scenario, req.baseline_input)


@router.post("/ai-custom", response_model=AICustomScenarioResponse, dependencies=[Depends(rate_limit("llm", limit=10))])
async def ai_custom(req: AICustomScenarioRequest) -> AICustomScenarioResponse:
    reading = await scenario_llm.interpret(req.user_scenario_prompt, req.baseline_input)
    overrides = dict(reading["overrides"])
    if reading["added_goals"]:
        overrides["added_goals"] = reading["added_goals"]
    scenario = ScenarioInput(
        scenario_type="ai_custom",
        title=reading["scenario_title"],
        description=reading["ai_analysis"],
        overrides=overrides,
    )
    comparison = ScenarioEngine.apply_scenario(req.baseline_input, scenario)
    storage_service.save_scenario(comparison.model_dump())
    return AICustomScenarioResponse(
        scenario_comparison=comparison,
        ai_title=reading["scenario_title"],
        ai_analysis=reading["ai_analysis"],
        actionable_recommendations=reading["actionable_recommendations"],
        detected_adjustments=reading["overrides"],
        model_used=reading["model_used"],
    )


@router.get("", response_model=List[Dict[str, Any]])
def list_saved() -> List[Dict[str, Any]]:
    return storage_service.list_scenarios()


@router.delete("/{scenario_id}")
def delete(scenario_id: str) -> Dict[str, str]:
    if not storage_service.delete_scenario(scenario_id):
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"message": "Scenario deleted"}
