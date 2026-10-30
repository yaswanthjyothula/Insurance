/** Shapes returned by the backend (see backend/app/schemas). Kept in one file so pages share one contract. */

export type Gender = "male" | "female";
export type PayMode = "annual" | "half_yearly" | "quarterly" | "monthly";
export type Priority = "balanced" | "lowest_cost" | "goal_savings" | "growth";
export type Risk = "low" | "medium" | "high";
export type ProductType = "Term Life" | "Whole Life" | "Endowment" | "ULIP";

export interface Applicant {
  age: number;
  gender: Gender;
  smoker: boolean;
  annual_income: number;
  residency: "resident" | "nri";
  spouse_working: boolean;
  spouse_annual_income: number;
  existing_individual_cover: number;
  youngest_child_age?: number | null;
}

export interface RiderChoice {
  rider_id: string;
  sum_assured?: number | null;
}

export interface QuoteRequest {
  product_id: string;
  applicant: Applicant;
  sum_assured?: number;
  policy_term_years?: number;
  payment_option: string;
  mode: PayMode;
  riders: RiderChoice[];
  annual_premium?: number;
  sa_multiple?: number;
  fund_id?: string | null;
}

export interface RiderLine {
  rider_id: string;
  rider_name: string;
  sum_assured?: number | null;
  annual_premium: number;
  instalment: number;
}

export interface Quote {
  product_id: string;
  product_name: string;
  product_type: ProductType;
  valid: boolean;
  issues: string[];
  sum_assured: number;
  policy_term_years: number;
  premium_paying_term_years: number;
  payment_option: string;
  mode: PayMode;
  rate_per_1000?: number | null;
  band_factor?: number | null;
  base_annual_premium: number;
  base_instalment: number;
  riders: RiderLine[];
  total_annual_premium: number;
  total_instalment: number;
  allowed_terms: number[];
  max_sum_assured_for_applicant?: number | null;
}

export interface Factor {
  key: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export interface ProductFit {
  product_id: string;
  product_name: string;
  product_type: ProductType;
  variant: string;
  summary: string;
  eligible: boolean;
  issues: string[];
  role: string;
  rank: number;
  match_percent: number;
  rule_percent: number;
  model_percent?: number | null;
  factors: Factor[];
  reason: string;
  quote?: Quote | null;
  in_basket: boolean;
  fund_id?: string | null;
  sa_multiple?: number | null;
}

export interface Basket {
  items: ProductFit[];
  total_monthly: number;
  total_cover: number;
  budget_monthly?: number | null;
  within_budget: boolean;
  cover_shortfall: number;
  notes: string[];
}

export interface RecommendRequest {
  assessment: import("./assessment").AssessmentInput;
  applicant: Applicant;
  monthly_budget?: number | null;
  preferred_term_years?: number | null;
  risk_appetite: Risk;
  priority: Priority;
  liquid_investable: number;
  goal_types: string[];
}

export interface RecommendResponse {
  recommended_cover: number;
  coverage_gap: number;
  term_years: number;
  budget_monthly?: number | null;
  products: ProductFit[];
  basket: Basket;
  ranking_method: string;
  methodology_note: string;
  type_counts: Record<string, number>;
}

/** Catalogue records from /pack/products, /pack/riders and /pack/funds (only the fields the UI shows). */
export interface PackProduct {
  product_id: string;
  product_name: string;
  product_type: ProductType;
  variant: string;
  participation: string;
  plain_language_summary: string;
  min_entry_age: number;
  max_entry_age: number;
  max_maturity_age: number;
  min_sum_assured_inr?: number | null;
  max_sum_assured_inr?: number | null;
  sum_assured_step_inr?: number | null;
  premium_payment_options: string[];
  premium_modes: string[];
  min_annual_premium_inr?: number | null;
  max_annual_premium_inr?: number | null;
  sa_multiple_of_annual_premium?: Record<string, number[]> | null;
  min_policy_term_years?: number | null;
  max_policy_term_years?: number | null;
  riders_allowed: string[];
  ulip_fund_ids: string[];
  death_benefit: string;
  maturity_benefit: string;
  survival_benefits: string;
  key_features: string;
  key_exclusions: string;
  surrender_and_lock_in: string;
  medical_underwriting: string;
}

export interface PackRider {
  rider_id: string;
  rider_name: string;
  rider_category: string;
  benefit: string;
  min_rider_sa_inr?: number | null;
  max_rider_sa_inr?: number | null;
  max_rider_sa_pct_of_base_sa?: number | null;
  rate_basis: "per_1000_rider_sa" | "pct_of_base_annual_premium" | "included_free";
  rider_sa_rule: string;
}

export interface PackFund {
  fund_id: string;
  fund_name: string;
  asset_class: string;
  risk_level: string;
  fmc_pct_pa: number;
  objective: string;
}

export interface SampleCustomer {
  profile_id: string;
  full_name: string;
  age: number;
  city: string;
  occupation: string;
  annual_income: number;
  risk_appetite: Risk;
}

export interface UlipYear {
  year: number;
  premiums_paid: number;
  fund_value: number;
  death_benefit: number;
}

export interface UlipScenario {
  gross_return_pct: number;
  net_return_pct: number;
  maturity_value: number;
  total_premiums: number;
  total_charges: number;
  years: UlipYear[];
}

export interface UlipProjection {
  product_name: string;
  fund_name: string;
  sum_assured: number;
  scenarios: UlipScenario[];
  note: string;
}

export interface Slot {
  slot_id: string;
  start: string;
  end: string;
  label: string;
}

export interface AdvisorOut {
  advisor_id: string;
  advisor_name: string;
  languages: string[];
  specialisations: string[];
  consultation_modes: string[];
  years_experience: number;
  rating: number;
  review_count: number;
  slots: Slot[];
  has_availability: boolean;
}

export interface Availability {
  advisors: AdvisorOut[];
  calendar_note?: string | null;
}

export interface Booking {
  booking_id: string;
  advisor_id: string;
  advisor_name: string;
  slot_id: string;
  slot_start: string;
  slot_label: string;
  status: string;
  consultation_mode: "video" | "phone" | "chat";
  meeting_link: string;
  created_at: string;
}

export interface SessionOut {
  token: string;
  email: string;
  name: string;
  demo: boolean;
}

/** One plan the customer has configured and put in their selection. Everything needed to re-price it is kept. */
export interface SelectedPlan {
  request: QuoteRequest;
  quote: Quote;
  fit_summary: string;
}
