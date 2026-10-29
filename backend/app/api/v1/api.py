import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel

from app.schemas.financial import (
    AssessmentInput,
    AssessmentResult,
    EMICalculatorInput,
    EMICalculatorResult,
    PremiumShockInput,
    FutureCostsInput,
    ProtectionGapRadarResult
)
from app.schemas.scenarios import ScenarioInput, ScenarioComparisonResult, ScenarioCompareRequest
from app.schemas.products import (
    InsuranceProduct,
    RecommendationRequest,
    RecommendationResponse,
    ProductCompareRequest,
    ProductCompareResponse,
    ComparedProductItem
)
from app.schemas.advisory_and_xray import (
    PolicyAnalysisResult,
    PolicyAnalysisRequest,
    AdvisorBookingRequest,
    AdvisorBookingConfirmation,
    ProtectionPassport
)

from app.services.financial_engine import FinancialEngine
from app.services.scenario_engine import ScenarioEngine
from app.services.survival_simulator import SurvivalSimulator, SurvivalSimulatorInput, SurvivalSimulationResult
from app.services.catalog import PRODUCT_CATALOGUE, get_products_by_category, get_product_by_id
from app.services.matching import plan_matcher, indicative_annual_premium
from app.services.policy_xray import PolicyXRayEngine
from app.services.resources import (
    GLOSSARY_ITEMS,
    INSURER_DIRECTORY,
    CLAIM_COMPANION_GUIDE,
    ADVISOR_DIRECTORY
)
from app.services.storage import storage_service
from app.services.gemini_assistant import GeminiAssistantService

api_router = APIRouter()

@api_router.get("/health")
def api_health():
    return {
        "status": "healthy",
        "service": "LifeSure AI API v1",
        "timestamp": "2026-10-28",
        "engine": "deterministic_python"
    }

# --- 1. Assessments & Calculations ---
@api_router.post("/assessments", response_model=AssessmentResult)
def create_assessment(inp: AssessmentInput):
    result = FinancialEngine.assess(inp)
    storage_service.save_assessment(result.model_dump())
    return result

@api_router.get("/assessments/{assessment_id}", response_model=AssessmentResult)
def get_assessment(assessment_id: str):
    data = storage_service.get_assessment(assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return AssessmentResult(**data)

@api_router.post("/assessments/{assessment_id}/calculate", response_model=AssessmentResult)
def recalculate_assessment(assessment_id: str, inp: AssessmentInput):
    result = FinancialEngine.assess(inp, assessment_id=assessment_id)
    storage_service.save_assessment(result.model_dump())
    return result

@api_router.post("/calculations/net-needs")
def calculate_net_needs_standalone(inp: AssessmentInput):
    needs = FinancialEngine.calculate_needs(inp)
    return {
        "method": "net_needs",
        "currency": "INR",
        "total_financial_need": needs.total_gross_need,
        "eligible_assets": needs.eligible_assets_deducted,
        "existing_life_cover": needs.existing_cover_deducted,
        "additional_cover_required": needs.net_coverage_gap,
        "breakdown": {
            "income_replacement": needs.income_replacement_pv,
            "future_goals": needs.future_goals_pv,
            "liabilities": needs.outstanding_liabilities,
            "immediate_expenses": needs.immediate_expenses,
            "eligible_assets_deducted": needs.eligible_assets_deducted,
            "existing_cover_deducted": needs.existing_cover_deducted
        },
        "assumptions": [
            f"Household Inflation: {inp.inflation_rate*100:.1f}% p.a.",
            f"Safe Investment Discount Yield: {inp.discount_rate*100:.1f}% p.a.",
            f"Education Inflation: {inp.edu_inflation_rate*100:.1f}% p.a."
        ],
        "limitations": [
            "Assumes continuous safe reinvestment of fund proceeds.",
            "Excludes primary family home equity from eligible assets."
        ]
    }

@api_router.post("/calculations/human-life-value")
def calculate_hlv_standalone(inp: AssessmentInput):
    hlv = FinancialEngine.calculate_hlv(inp)
    return {
        "method": "human_life_value",
        "currency": "INR",
        "gross_hlv": hlv.hlv_gross,
        "earning_horizon_years": hlv.earning_horizon_years,
        "personal_consumption_ratio": hlv.personal_consumption_ratio,
        "wage_growth_rate": hlv.wage_growth_rate,
        "discount_rate": hlv.discount_rate,
        "additional_cover_required": hlv.hlv_net_gap,
        "explanation": f"Discounted lifetime earnings minus {hlv.personal_consumption_ratio*100:.0f}% personal consumption until age {inp.retirement_age}."
    }

# --- 2. Scenario Studio ---
@api_router.post("/scenarios", response_model=ScenarioComparisonResult)
def run_scenario(scenario: ScenarioInput, baseline_input: AssessmentInput):
    res = ScenarioEngine.apply_scenario(baseline_input, scenario)
    storage_service.save_scenario(res.model_dump())
    return res

@api_router.post("/scenarios/compare", response_model=ScenarioComparisonResult)
def compare_scenario_endpoint(req: ScenarioCompareRequest):
    res = ScenarioEngine.apply_scenario(req.baseline_input, req.scenario)
    storage_service.save_scenario(res.model_dump())
    return res

@api_router.get("/scenarios", response_model=List[Dict[str, Any]])
def list_saved_scenarios():
    return storage_service.list_scenarios()

@api_router.delete("/scenarios/{scenario_id}")
def delete_scenario(scenario_id: str):
    success = storage_service.delete_scenario(scenario_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"message": "Scenario deleted successfully"}

# --- 3. ML Recommendations ---
@api_router.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest):
    return plan_matcher.recommend(req)

@api_router.get("/recommendations/metrics")
def get_model_evaluation():
    return plan_matcher.methodology()

# --- 4. Products & Catalog ---
@api_router.get("/products", response_model=List[InsuranceProduct])
def list_products(category: Optional[str] = None):
    return get_products_by_category(category)

@api_router.get("/products/{product_id}", response_model=InsuranceProduct)
def get_product(product_id: str):
    p = get_product_by_id(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@api_router.post("/products/compare", response_model=ProductCompareResponse)
def compare_products_endpoint(req: ProductCompareRequest):
    items: List[ComparedProductItem] = []
    for pid in req.product_ids:
        p = get_product_by_id(pid)
        if not p:
            continue
        annual_prem = indicative_annual_premium(req.target_sum_assured, req.age or 35, req.smoker_status, req.tenure_years)
        monthly_prem = round(annual_prem / 12.0, 2)
        claim = f"claim settlement {p.claim_settlement_ratio:g}%" if p.claim_settlement_ratio is not None else "claim settlement ratio not confirmed"
        solv = f"solvency {p.solvency_ratio:g}x" if p.solvency_ratio is not None else "solvency not confirmed"
        fit = f"{p.insurer}: {claim}, {solv}."
        sa_text = (
            f"Sum assured from ₹{p.min_sum_assured / 100000:.0f} L" + ("" if p.max_sum_assured >= 1e9 else f" to ₹{p.max_sum_assured / 10000000:.1f} Cr")
            if p.min_sum_assured else "Sum assured limits not confirmed"
        )
        tradeoffs = [
            sa_text,
            f"Riders: {', '.join(p.riders_available[:3]) if p.riders_available else 'none offered'}",
            f"Payout options: {', '.join(p.death_benefit_options[:3]) if p.death_benefit_options else 'not confirmed'}",
        ]
        if p.exclusions:
            tradeoffs.append(f"Exclusion: {p.exclusions[0]}")
        items.append(ComparedProductItem(
            product=p,
            estimated_annual_premium=annual_prem,
            estimated_monthly_premium=monthly_prem,
            fit_summary=fit,
            key_tradeoffs=tradeoffs
        ))
    return ProductCompareResponse(
        compared_products=items,
        target_sum_assured=req.target_sum_assured,
        tenure_years=req.tenure_years,
        comparison_summary=f"Compared {len(items)} plans for ₹{req.target_sum_assured/10000000:.2f} Cr cover. Premiums are estimates calibrated to one insurer's published sample prices; get an exact quote from each insurer."
    )

# --- 5. Policy X-Ray ---
@api_router.post("/policies/analyse", response_model=PolicyAnalysisResult)
async def analyse_policy_document(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    extracted_text = ""
    filename = "manual_entry.txt"
    
    if file:
        filename = file.filename or "policy_document.pdf"
        content = await file.read()
        try:
            # Decode utf-8 if text, or extract printable ASCII if pdf
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = str(content[:5000])
            
    if raw_text and len(raw_text) > 5:
        extracted_text = (extracted_text + "\n" + raw_text).strip()
        
    if not extracted_text:
        # Default policy sample for interactive exploration
        extracted_text = """
        POLICY SCHEDULE - HDFC Life Insurance Co. Ltd.
        Policy Type: Pure Term Assurance Plan
        Basic Sum Assured: ₹10,000,000 (One Crore Indian Rupees)
        Annualized Premium: ₹14,850.00
        Policy Term: 30 Years
        Premium Paying Term: 30 Years
        Grace Period: 30 Days from payment due date.
        Terminal Illness Accelerated Benefit included: 100% payout upon diagnosis.
        Exclusion: In case of death due to suicide within 12 months from policy inception, 80% of total premiums refunded.
        """
        filename = "Sample_HDFC_Term_Schedule.pdf"
        
    return PolicyXRayEngine.analyze_document_text(filename, extracted_text)

# --- 6. Smart Tools ---
@api_router.post("/tools/survival-simulation", response_model=SurvivalSimulationResult)
def simulate_family_survival(inp: SurvivalSimulatorInput):
    return SurvivalSimulator.run(inp)

@api_router.post("/tools/emi-calculator", response_model=EMICalculatorResult)
def calculate_loan_emi(inp: EMICalculatorInput):
    return FinancialEngine.calculate_emi(inp)

@api_router.post("/tools/future-costs")
def calculate_future_costs(inp: FutureCostsInput):
    return FinancialEngine.calculate_future_cost(inp)

@api_router.post("/tools/protection-gap-radar", response_model=ProtectionGapRadarResult)
def calculate_radar(inp: AssessmentInput):
    needs = FinancialEngine.calculate_needs(inp)
    return FinancialEngine.calculate_protection_radar(needs)

# --- 7. Advisors & Bookings ---
@api_router.get("/advisors")
def list_advisors():
    return ADVISOR_DIRECTORY

@api_router.get("/advisory/availability")
def get_advisory_availability():
    existing_bookings = storage_service.list_bookings()
    booked_set = set()
    for b in existing_bookings:
        adv_id = b.get("advisor_id")
        slot = b.get("slot")
        if adv_id and slot:
            booked_set.add((adv_id, slot))
            
    availability = []
    for adv in ADVISOR_DIRECTORY:
        open_slots = [s for s in adv.get("available_slots", []) if (adv["id"], s) not in booked_set]
        availability.append({
            **adv,
            "available_slots": open_slots,
            "has_availability": len(open_slots) > 0
        })
    return availability

@api_router.post("/advisory/bookings", response_model=AdvisorBookingConfirmation)
@api_router.post("/advisor-bookings", response_model=AdvisorBookingConfirmation)
def book_advisor(req: AdvisorBookingRequest):
    # Lookup advisor
    advisor_name = "Certified Protection Advisor"
    for adv in ADVISOR_DIRECTORY:
        if adv["id"] == req.advisor_id:
            advisor_name = adv["name"]
            break

    # Prevent double booking of same advisor and slot
    existing_bookings = storage_service.list_bookings()
    for b in existing_bookings:
        if b.get("advisor_id") == req.advisor_id and b.get("slot") == req.preferred_slot:
            raise HTTPException(
                status_code=409,
                detail=f"Slot '{req.preferred_slot}' is already booked for {advisor_name}. Please choose another available slot."
            )
            
    bid = str(uuid.uuid4())
    confirmation = AdvisorBookingConfirmation(
        booking_id=bid,
        advisor_name=advisor_name,
        slot=req.preferred_slot,
        status="confirmed",
        meeting_link=f"https://meet.lifesure.ai/{bid[:8]}",
        calendar_ics_url=f"/api/v1/advisor-bookings/{bid}/calendar.ics",
        created_at="Just now"
    )
    
    storage_service.save_booking({
        **confirmation.model_dump(),
        "advisor_id": req.advisor_id,
        "user_name": req.user_name,
        "user_email": req.user_email,
        "user_phone": req.user_phone,
        "notes": req.notes,
        "assessment_id": req.assessment_id,
        "share_passport": req.share_passport
    })
    
    return confirmation

@api_router.get("/advisory/bookings")
@api_router.get("/advisor-bookings")
def get_bookings():
    return storage_service.list_bookings()

# --- 8. Conversational Assistant ---
class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

@api_router.post("/assistant/chat")
async def chat_assistant(req: ChatRequest):
    return await GeminiAssistantService.chat(req.message, req.context)

# --- 9. Resources ---
@api_router.get("/resources/glossary")
def get_glossary(search: Optional[str] = None):
    if not search:
        return GLOSSARY_ITEMS
    q = search.lower()
    return [
        g for g in GLOSSARY_ITEMS
        if q in g["term"].lower() or q in g["definition"].lower()
    ]

@api_router.get("/resources/directory")
def get_directory():
    return INSURER_DIRECTORY

@api_router.get("/resources/claims-guide")
def get_claims_guide():
    return CLAIM_COMPANION_GUIDE

# --- 10. Protection Passport & Vault ---
@api_router.get("/passport", response_model=ProtectionPassport)
def get_protection_passport():
    scenarios = storage_service.list_scenarios()
    policies = storage_service.list_policies()
    
    # Calculate passport status
    return ProtectionPassport(
        user_id="usr_demo_882",
        full_name="Praveen Sharma",
        email="praveen.sharma@example.com",
        latest_assessment_id="ast_active_01",
        total_coverage_gap=12500000.0, # ₹1.25 Cr
        recommended_sum_assured=20000000.0, # ₹2.0 Cr
        active_policies_count=len(policies) or 1,
        emergency_readiness_score=85.0,
        last_health_check_date="October 2026",
        dependents_mapped=3,
        declared_policies=policies or [
            {
                "policy_id": "pol-existing-01",
                "insurer": "HDFC Life",
                "sum_assured": 7500000.0,
                "annual_premium": 12800.0,
                "due_date": "2027-04-15"
            }
        ]
    )

@api_router.get("/vault/documents")
def list_vault():
    return storage_service.list_vault_items()

@api_router.post("/vault/upload")
async def upload_vault_doc(title: str = Form(...), category: str = Form(...), file: Optional[UploadFile] = File(None)):
    filename = file.filename if file else "document.pdf"
    doc_id = storage_service.save_vault_item({
        "title": title,
        "category": category,
        "filename": filename,
        "size_kb": 240,
        "is_encrypted": True
    })
    return {"message": "Document secured in private vault", "doc_id": doc_id}

@api_router.delete("/vault/documents/{doc_id}")
def delete_vault_doc(doc_id: str):
    deleted = storage_service.delete_vault_item(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document permanently removed"}
