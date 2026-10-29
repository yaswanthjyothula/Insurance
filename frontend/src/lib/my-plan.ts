import { fetchFromAPI } from "@/lib/api";
import type { AssessmentResult } from "@/types/assessment";
import type { InsuranceProduct } from "@/types";
import type { PolicyCustomization } from "@/types/recommendation";

export interface SavedAssessment {
  assessment_id: string;
  net_coverage_gap: number;
  total_gross_need: number;
  recommended_sum_assured?: number;
  age?: number;
  dependents?: number;
  saved_at: string;
}

export interface SavedPlan {
  product_id: string;
  product_name: string;
  insurer: string;
  sum_assured: number;
  tenure_years: number;
  monthly_premium: number;
  annual_premium: number;
  riders: string[];
  quote_url?: string | null;
  product_page_url?: string | null;
  saved_at: string;
}

export interface MyPlanData {
  email?: string;
  assessment?: SavedAssessment;
  plan?: SavedPlan;
}

export function summariseAssessment(r: AssessmentResult): SavedAssessment {
  const inp = r.inputs ?? r.input;
  return {
    assessment_id: r.assessment_id,
    net_coverage_gap: r.net_needs.net_coverage_gap,
    total_gross_need: r.net_needs.total_gross_need,
    recommended_sum_assured: r.recommended_sum_assured,
    age: inp?.age,
    dependents: inp?.dependents_count,
    saved_at: new Date().toISOString(),
  };
}

export function summarisePlan(p: InsuranceProduct, c: PolicyCustomization): SavedPlan {
  return {
    product_id: p.id,
    product_name: p.name,
    insurer: p.insurer,
    sum_assured: c.sum_assured,
    tenure_years: c.tenure_years,
    monthly_premium: c.estimated_monthly_premium,
    annual_premium: c.estimated_annual_premium,
    riders: c.selected_riders,
    quote_url: p.quote_url ?? null,
    product_page_url: p.product_page_url ?? null,
    saved_at: new Date().toISOString(),
  };
}

/** Saves to the signed-in user's account. Never blocks or breaks the journey if the backend is down. */
export function saveMyPlan(email: string | undefined | null, data: { assessment?: SavedAssessment; plan?: SavedPlan }): void {
  if (!email) return;
  fetchFromAPI("/my-plan", { method: "PUT", body: JSON.stringify({ email, ...data }) }).catch(() => { /* saved locally anyway */ });
}
