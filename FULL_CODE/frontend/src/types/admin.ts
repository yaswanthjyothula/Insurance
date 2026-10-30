/** The admin API contract (backend/app/admin/schemas.py). Percentages are plain numbers: 7 means 7%. */
export type Category = "Term Life" | "Whole Life" | "Endowment" | "ULIP";

export interface NeedsConfig {
  income_replacement_multiple_min: number;
  income_replacement_multiple_max: number;
  inflation_rate: number;
  discount_rate: number;
  deceased_expense_reduction_factor: number;
  emergency_fund_months: number;
}

export interface UnderwritingConfig {
  non_medical_sum_assured_limit: number;
  non_medical_maximum_age: number;
  tele_medical_threshold: number;
  physical_medical_threshold: number;
  stp_enabled: boolean;
  stp_maximum_sum_assured: number;
  stp_maximum_age: number;
  stp_allow_smokers: boolean;
}

export interface GenderFactors {
  male: number;
  female: number;
}

export interface ProductConfig {
  product_id: string;
  product_name: string;
  category: Category;
  active: boolean;
  minimum_entry_age: number;
  maximum_entry_age: number;
  minimum_maturity_age: number;
  maximum_maturity_age: number;
  minimum_tenure: number;
  maximum_tenure: number;
  minimum_sum_assured: number;
  maximum_sum_assured: number;
  maximum_income_multiple: number | null;
  base_rate_per_1000: number | null;
  reference_rate_per_1000: number | null;
  age_loading_percentage_per_year: number;
  smoker_loading_percentage: number;
  gender_discount_factors: GenderFactors;
  allowed_riders: string[];
  custom: boolean;
  rate_matrix_entry_ages?: number[] | null;
}

export interface RiderOption {
  rider_id: string;
  rider_name: string;
  category: string;
}

export interface AdminConfigView {
  version: number;
  updated_at: string;
  updated_by: string;
  needs: NeedsConfig;
  underwriting: UnderwritingConfig;
  products: ProductConfig[];
  available_riders: RiderOption[];
  categories: Category[];
}

export interface ChangeResult {
  version: number;
  updated_at: string;
  changed_fields: string[];
  activation_ms: number;
  persisted_ms: number;
  config: AdminConfigView;
}

export interface HistoryEntry {
  version: number;
  at: string;
  actor: string;
  summary: string;
  changed_fields: string[];
}

export interface TestCalcInput {
  age: number;
  annual_income: number;
  dependents: number;
  gender: "male" | "female";
  smoker: boolean;
  outstanding_liabilities: number;
  existing_cover: number;
  eligible_assets: number;
}

export interface TestCalcProduct {
  product_id: string;
  product_name: string;
  category: string;
  eligible: boolean;
  sum_assured: number | null;
  term_years: number | null;
  monthly_premium: number | null;
  annual_premium: number | null;
  rate_per_1000: number | null;
  underwriting_route: string | null;
  stp_eligible: boolean | null;
  issues: string[];
  rank: number;
}

export interface TestCalcResult {
  config_version: number;
  elapsed_ms: number;
  needs: {
    total_need: number;
    net_coverage_gap: number;
    recommended_cover: number;
    hlv_net_gap: number;
    income_multiple_check: { minimum_multiple: number; maximum_multiple: number; minimum_cover: number; maximum_cover: number } | null;
    inflation_rate: number;
    discount_rate: number;
  };
  headline: TestCalcProduct | null;
  underwriting_for_recommended_cover: { route: string; label: string; stp_eligible: boolean; reasons: string[] } | null;
  products: TestCalcProduct[];
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  note?: string;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  category: string;
  count: number;
}

export interface Analytics {
  has_data: boolean;
  funnel: FunnelStep[];
  drop_off_percent: number | null;
  tracking_note: string | null;
  top_recommended: TopProduct[];
  top_selected: TopProduct[];
  category_share: { recommended: Record<string, number>; selected: Record<string, number> };
  average_coverage_gap: number | null;
  average_coverage_purchased: number | null;
  assessments_with_gap: number;
  plans_with_cover: number;
  advisor_booking_conversion_percent: number | null;
  customers_assessed: number;
  customers_booked_after_assessment: number;
}

export interface Lead {
  assessment_id: string;
  saved_at: string;
  customer: string;
  customer_id: string;
  contact: string;
  age: number | null;
  annual_income: number | null;
  dependents: number | null;
  outstanding_liabilities: number | null;
  existing_cover: number | null;
  total_need: number | null;
  coverage_gap: number | null;
  recommended_cover: number | null;
  config_version: number;
}

export type Stage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export interface LeadCard {
  lead_id: string;
  name: string;
  customer_id: string;
  contact: string;
  source: "assessment" | "booking" | "manual";
  stage: Stage;
  owner_advisor_id: string | null;
  owner_name: string | null;
  cover_needed: number | null;
  annual_premium: number | null;
  created_at: string;
  updated_at: string;
  days_in_stage: number;
  note_count: number;
}

export interface CrmNote {
  at: string;
  by: string;
  text: string;
}

export interface StageChange {
  at: string;
  by: string;
  from_stage: string | null;
  to_stage: string;
  note: string;
}

export interface CrmLead extends LeadCard {
  version: number;
  assessment_id: string | null;
  booked_advisor_id: string | null;
  lost_reason: string | null;
  inputs: Record<string, number | null>;
  notes: CrmNote[];
  history: StageChange[];
}

export interface StageColumn {
  key: Stage;
  label: string;
  count: number;
  cover_total: number;
  leads: LeadCard[];
}

export interface Pipeline {
  stages: StageColumn[];
  total_leads: number;
  open_leads: number;
  open_cover: number;
  advisors: { advisor_id: string; advisor_name: string }[];
  synced_at: string;
}

export interface CrmReports {
  total_leads: number;
  open_leads: number;
  won: number;
  lost: number;
  win_rate_percent: number | null;
  overall_conversion_percent: number | null;
  average_days_to_win: number | null;
  open_cover: number;
  won_annual_premium: number;
  funnel: { key: string; label: string; count: number }[];
  by_advisor: {
    advisor_id: string;
    advisor_name: string;
    open: number;
    won: number;
    lost: number;
    open_cover: number;
    won_premium: number;
  }[];
  by_source: Record<string, number>;
  lost_reasons: { reason: string; count: number }[];
  created_per_day: { date: string; count: number }[];
  average_days_in_stage: Record<string, number | null>;
}
