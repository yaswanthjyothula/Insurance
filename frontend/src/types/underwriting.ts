export interface CKYCLookupRequest {
  pan_number: string;
  date_of_birth?: string;
  full_name?: string;
}

export interface CKYCLookupResponse {
  ckyc_number: string;
  pan: string;
  full_name: string;
  dob: string;
  gender: string;
  father_or_spouse_name: string;
  address: string;
  pincode: string;
  kyc_status: string;
  kyc_source: string;
  aml_screening: string;
  timestamp: string;
}

export interface MedicalTriageInput {
  tobacco_use: string;
  pre_existing_conditions: string[];
  family_longevity: string;
  base_annual_premium: number;
  base_monthly_premium: number;
  sum_assured: number;
  age: number;
  gender?: string;
}

export interface UnderwritingDecision {
  underwriting_decision: "INSTANT_ISSUANCE" | "STANDARD_RATES" | "PREMIUM_LOADING" | "TELE_MEDICAL_REQUIRED" | "PHYSICAL_EXAM_REQUIRED";
  decision_badge: string;
  decision_summary: string;
  premium_multiplier: number;
  original_annual_premium: number;
  original_monthly_premium: number;
  adjusted_annual_premium: number;
  adjusted_monthly_premium: number;
  loading_percentage: number;
  underwriting_factors: string[];
  medical_requirements: string[];
  stp_eligible: boolean;
  regulatory_disclosures: string[];
}

export interface PolicyIssuanceRequest {
  ckyc_number: string;
  pan_number: string;
  proposer_name: string;
  proposer_email?: string;
  proposer_phone?: string;
  product_id: string;
  product_name: string;
  insurer_name: string;
  sum_assured: number;
  tenure_years: number;
  annual_premium: number;
  monthly_premium: number;
  underwriting_decision: string;
  payment_mode?: string;
}

export interface PolicyIssuanceResponse {
  policy_number: string;
  proposal_number: string;
  issuance_status: string;
  issued_date: string;
  commencement_date: string;
  proposer_name: string;
  ckyc_number: string;
  product_name: string;
  insurer: string;
  sum_assured: number;
  annual_premium: number;
  monthly_premium: number;
  tenure_years: number;
  free_look_period_days: number;
  digital_signature_hash: string;
  message: string;
}
