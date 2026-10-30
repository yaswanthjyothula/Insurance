import type { Applicant, Gender, RecommendRequest, Risk } from "./api";
import type { AssessmentInput } from "./assessment";

/** The parts of a synthetic pack profile the Needs Finder form can be filled from (GET /pack/customers/{id}). */
export interface SampleProfile {
  profile_id: string;
  full_name: string;
  gender: Gender;
  residency_status: string;
  employment_type: string;
  smoker_status: string;
  risk_appetite: Risk;
  annual_income_inr: number;
  monthly_household_expenses_inr: number;
  spouse: { age: number; working: boolean; annual_income_inr: number } | null;
  children_ages: number[];
  parent_ages: number[];
  liabilities: { loan_type: string; outstanding_principal_inr: number }[];
  individual_cover_inr: number;
  employer_group_cover_inr: number;
  liquid_savings_inr: number;
  market_investments_inr: number;
  monthly_premium_budget_inr: number | null;
  preferred_policy_term_years: number | null;
}

export interface SampleCustomerDetail {
  profile: SampleProfile;
  assessment: AssessmentInput;
  applicant: Applicant;
  recommend_request: RecommendRequest;
}
