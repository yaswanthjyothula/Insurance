from typing import List, Optional
from pydantic import BaseModel, Field


class CKYCLookupRequest(BaseModel):
    pan_number: str = Field(..., description="10-character Indian Permanent Account Number (PAN)")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD or DD/MM/YYYY format")
    full_name: Optional[str] = Field(None, description="Full name matching PAN card")


class CKYCLookupResponse(BaseModel):
    ckyc_number: str = Field(..., description="14-digit Central KYC Registry identifier")
    pan: str = Field(..., description="Masked or full PAN")
    full_name: str = Field(..., description="Full legal name from CERSAI / Income Tax database")
    dob: str = Field(..., description="Verified Date of Birth")
    gender: str = Field(..., description="Gender recorded in CKYC")
    father_or_spouse_name: str = Field(..., description="Father or Spouse Name")
    address: str = Field(..., description="Verified communication address")
    pincode: str = Field(..., description="6-digit postal code")
    kyc_status: str = Field("VERIFIED", description="VERIFIED | PENDING | REJECTED")
    kyc_source: str = Field(
        "Central KYC Registry (CERSAI) & Income Tax Department (NSDL/UTIITSL)",
        description="Official verifying authority",
    )
    aml_screening: str = Field("CLEARED", description="Anti-Money Laundering & Sanctions status")
    timestamp: str = Field(..., description="Verification timestamp")


class MedicalTriageInput(BaseModel):
    tobacco_use: str = Field("never", description="'never' | 'occasional' | 'regular'")
    pre_existing_conditions: List[str] = Field(
        default_factory=lambda: ["none"],
        description="List of conditions: 'none', 'hypertension', 'diabetes', 'cardiac_history'"
    )
    family_longevity: str = Field(
        "no_major_family_illness",
        description="'both_parents_above_70' | 'no_major_family_illness' | 'one_parent_cardiac_cancer_before_60'"
    )
    base_annual_premium: float = Field(..., description="Base annual premium before medical triage")
    base_monthly_premium: float = Field(..., description="Base monthly premium before medical triage")
    sum_assured: float = Field(..., description="Chosen cover sum assured in INR")
    age: int = Field(32, description="Age of applicant")
    gender: str = Field("male", description="Applicant gender")


class UnderwritingDecision(BaseModel):
    underwriting_decision: str = Field(
        ...,
        description="'INSTANT_ISSUANCE' | 'STANDARD_RATES' | 'PREMIUM_LOADING' | 'TELE_MEDICAL_REQUIRED' | 'PHYSICAL_EXAM_REQUIRED'"
    )
    decision_badge: str = Field(..., description="Human-readable status badge")
    decision_summary: str = Field(..., description="Detailed underwriter decision explanation")
    premium_multiplier: float = Field(..., description="Total rate multiplier applied (1.0 = standard)")
    original_annual_premium: float = Field(...)
    original_monthly_premium: float = Field(...)
    adjusted_annual_premium: float = Field(...)
    adjusted_monthly_premium: float = Field(...)
    loading_percentage: float = Field(..., description="Net % adjustment (+20% loading, -5% discount, etc.)")
    underwriting_factors: List[str] = Field(default_factory=list, description="List of triage factor breakdowns")
    medical_requirements: List[str] = Field(default_factory=list, description="Required medical examinations")
    stp_eligible: bool = Field(..., description="True if policy qualifies for zero-touch Straight Through Processing")
    regulatory_disclosures: List[str] = Field(default_factory=list, description="IRDAI statutory underwriting notices")


class PolicyIssuanceRequest(BaseModel):
    ckyc_number: str = Field(..., description="14-digit CKYC registry identifier")
    pan_number: str = Field(...)
    proposer_name: str = Field(...)
    proposer_email: Optional[str] = None
    proposer_phone: Optional[str] = None
    product_id: str = Field(...)
    product_name: str = Field(...)
    insurer_name: str = Field(...)
    sum_assured: float = Field(...)
    tenure_years: int = Field(...)
    annual_premium: float = Field(...)
    monthly_premium: float = Field(...)
    underwriting_decision: str = Field(...)
    payment_mode: str = Field("Instant NetBanking / UPI AutoPay", description="Simulated premium payment route")


class PolicyIssuanceResponse(BaseModel):
    policy_number: str = Field(..., description="IRDAI-formatted Unique Policy Number")
    proposal_number: str = Field(...)
    issuance_status: str = Field("ISSUED_ACTIVE", description="ISSUED_ACTIVE | CONDITIONAL_ACCEPTANCE")
    issued_date: str = Field(...)
    commencement_date: str = Field(...)
    proposer_name: str = Field(...)
    ckyc_number: str = Field(...)
    product_name: str = Field(...)
    insurer: str = Field(...)
    sum_assured: float = Field(...)
    annual_premium: float = Field(...)
    monthly_premium: float = Field(...)
    tenure_years: int = Field(...)
    free_look_period_days: int = Field(30, description="Statutory 30-day free-look guarantee period")
    digital_signature_hash: str = Field(...)
    message: str = Field(...)
