export interface FutureGoal {
  name: string;
  cost_today: number;
  years_away: number;
  category: "education" | "marriage" | "property" | "house" | "family_support" | "other";
}

export interface AssessmentInput {
  age: number;
  employment_type?: "salaried" | "self_employed" | "business" | "other";
  annual_income: number;
  annual_expenses: number;
  expected_income_growth?: number;
  dependents_count: number;
  years_support_needed?: number;
  support_horizon_years?: number;
  immediate_expenses?: number;
  outstanding_liabilities: number;
  home_loan?: number;
  personal_loan?: number;
  existing_cover: number;
  eligible_assets: number;
  emergency_fund_months?: number;
  retirement_age?: number;
  inflation_rate?: number;
  discount_rate?: number;
  edu_inflation_rate?: number;
  future_goals?: FutureGoal[];
  smoker_status?: boolean;
}

export interface NetNeedsBreakdown {
  income_replacement_pv: number;
  income_replacement_years?: number;
  future_goals_pv: number;
  outstanding_liabilities: number;
  immediate_expenses: number;
  total_gross_need: number;
  eligible_assets_deducted: number;
  existing_cover_deducted: number;
  net_coverage_gap: number;
}

export interface HLVResult {
  hlv_gross: number;
  earning_horizon_years: number;
  personal_consumption_ratio: number;
  wage_growth_rate: number;
  discount_rate: number;
  hlv_net_gap: number;
}

export interface MethodologyExplanation {
  method: string;
  description: string;
  assumptions_summary: string;
  limitations: string[];
}

export interface AssessmentResult {
  assessment_id: string;
  inputs?: AssessmentInput;
  input?: AssessmentInput;
  net_needs: NetNeedsBreakdown;
  hlv: HLVResult;
  methodology?: MethodologyExplanation;
  recommendation_summary?: string;
  recommended_sum_assured?: number;
  protection_health_score?: number;
}

export interface ScenarioDiff {
  field: string;
  label: string;
  baseline_value: any;
  scenario_value: any;
  difference_str: string;
}

export interface ScenarioComparisonResult {
  scenario_id: string;
  scenario_type: string;
  title: string;
  description: string;
  baseline_result: AssessmentResult;
  scenario_result: AssessmentResult;
  diffs: ScenarioDiff[];
  cover_difference: number;
  estimated_premium_difference: number;
  explanation: string;
}
