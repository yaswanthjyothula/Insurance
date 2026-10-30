from typing import Any, Dict

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.financial import (
    AssessmentInput,
    EMICalculatorInput,
    EMICalculatorResult,
    FutureCostsInput,
    ProtectionGapRadarResult,
)
from app.schemas.policy_xray import PolicyAnalysisResult
from app.services.financial_engine import FinancialEngine
from app.services.policy_xray import PolicyXRayEngine
from app.services.survival_simulator import SurvivalSimulationResult, SurvivalSimulator, SurvivalSimulatorInput

router = APIRouter(tags=["tools"])
MAX_UPLOAD_BYTES = 200_000
MAX_TEXT_CHARS = 60_000


@router.post("/tools/survival-simulation", response_model=SurvivalSimulationResult)
def survival(inp: SurvivalSimulatorInput) -> SurvivalSimulationResult:
    return SurvivalSimulator.run(inp)


@router.post("/tools/emi-calculator", response_model=EMICalculatorResult)
def emi(inp: EMICalculatorInput) -> EMICalculatorResult:
    return FinancialEngine.calculate_emi(inp)


@router.post("/tools/future-costs")
def future_costs(inp: FutureCostsInput) -> Dict[str, Any]:
    return FinancialEngine.calculate_future_cost(inp)


@router.post("/tools/protection-gap-radar", response_model=ProtectionGapRadarResult)
def radar(inp: AssessmentInput) -> ProtectionGapRadarResult:
    return FinancialEngine.calculate_protection_radar(FinancialEngine.calculate_needs(inp))


@router.post("/policies/analyse", response_model=PolicyAnalysisResult)
async def analyse_policy(file: UploadFile = File(None), raw_text: str = Form(None)) -> PolicyAnalysisResult:
    """Reads policy text. Only plain text is accepted: the content is data to read, never executed."""
    text, filename = "", "pasted_text.txt"
    if file is not None:
        content = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="That file is too large. Paste the relevant part instead.")
        filename, text = (file.filename or filename)[:120], content.decode("utf-8", errors="ignore")
    if raw_text and len(raw_text) > 5:
        text = f"{text}\n{raw_text}".strip()
    if not text.strip():
        raise HTTPException(status_code=422, detail="Paste your policy text or upload a text file first.")
    return PolicyXRayEngine.analyze_document_text(filename, text[:MAX_TEXT_CHARS])
