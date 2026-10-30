from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.schemas.financial import AssessmentInput, AssessmentResult
from app.services.financial_engine import FinancialEngine
from app.services.storage import storage_service

router = APIRouter(tags=["assessments"])


@router.post("/assessments", response_model=AssessmentResult)
def create_assessment(inp: AssessmentInput) -> AssessmentResult:
    result = FinancialEngine.assess(inp)
    storage_service.save_assessment(result.model_dump())
    return result


@router.get("/assessments/{assessment_id}", response_model=AssessmentResult)
def get_assessment(assessment_id: str) -> AssessmentResult:
    data = storage_service.get_assessment(assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return AssessmentResult(**data)


@router.post("/calculations/net-needs")
def net_needs(inp: AssessmentInput) -> Dict[str, Any]:
    needs = FinancialEngine.calculate_needs(inp)
    return {"method": "net_needs", "currency": "INR", "breakdown": needs.model_dump()}


@router.post("/calculations/human-life-value")
def human_life_value(inp: AssessmentInput) -> Dict[str, Any]:
    return {"method": "human_life_value", "currency": "INR", **FinancialEngine.calculate_hlv(inp).model_dump()}
