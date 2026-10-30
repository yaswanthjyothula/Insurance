from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import SessionUser, optional_user
from app.schemas.financial import AssessmentInput, AssessmentResult
from app.services.financial_engine import FinancialEngine
from app.services.storage import storage_service

router = APIRouter(tags=["assessments"])


@router.post("/assessments", response_model=AssessmentResult)
def create_assessment(inp: AssessmentInput, user: Optional[SessionUser] = Depends(optional_user)) -> AssessmentResult:
    result = FinancialEngine.assess(inp)
    # A signed-in customer's assessment is kept with who it belongs to, which is what makes it a lead the admin can follow up
    record = result.model_dump()
    if user is not None:
        record.update(user_email=user.email, user_name=user.name)
    storage_service.save_assessment(record)
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
