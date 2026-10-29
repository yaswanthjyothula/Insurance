from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ClauseCitation(BaseModel):
    clause_title: str
    extracted_text: str
    page_reference: int
    confidence_score: float # 0.0 to 1.0

class PolicyAnalysisResult(BaseModel):
    document_id: str
    filename: str
    insurer: Optional[str] = None
    product_name: Optional[str] = None
    policy_number_masked: Optional[str] = None
    sum_assured: Optional[float] = None
    annual_premium: Optional[float] = None
    policy_term_years: Optional[int] = None
    premium_paying_term_years: Optional[int] = None
    policy_type: str = "Life / Term Insurance"
    
    key_benefits: List[str]
    exclusions: List[str]
    waiting_periods: List[str]
    critical_deadlines: List[str]
    citations: List[ClauseCitation]
    uncertain_fields: List[str]
    potential_protection_gaps: List[str]
    suggested_questions_for_insurer: List[str]
    disclaimer: str

class PolicyAnalysisRequest(BaseModel):
    raw_text: Optional[str] = None
    policy_type_hint: Optional[str] = "term"

# Advisor schemas
class AdvisorProfile(BaseModel):
    id: str
    name: str
    title: str
    credentials: str
    experience_years: int
    specialties: List[str]
    available_slots: List[str]
    is_fiduciary_aligned: bool = True

class AdvisorBookingRequest(BaseModel):
    advisor_id: str
    user_name: str
    user_email: str
    user_phone: str
    preferred_slot: str
    notes: Optional[str] = None
    assessment_id: Optional[str] = None
    share_passport: bool = False

class AdvisorBookingConfirmation(BaseModel):
    booking_id: str
    advisor_name: str
    slot: str
    status: str # "confirmed", "rescheduled", "cancelled"
    meeting_link: str
    calendar_ics_url: str
    created_at: str

# Protection Passport Schemas
class ProtectionPassport(BaseModel):
    user_id: str
    full_name: str
    email: str
    latest_assessment_id: Optional[str] = None
    total_coverage_gap: float
    recommended_sum_assured: float
    active_policies_count: int
    emergency_readiness_score: float
    last_health_check_date: str
    dependents_mapped: int
    declared_policies: List[Dict[str, Any]]
