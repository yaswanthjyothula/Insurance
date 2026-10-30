import { fetchFromAPI } from "@/lib/api";
import type { SelectedPlan } from "@/types/api";
import type { AssessmentResult } from "@/types/assessment";

export interface SavedAssessment {
  assessment_id: string;
  net_coverage_gap: number;
  recommended_cover: number;
  total_gross_need: number;
  age?: number;
  dependents?: number;
  saved_at: string;
}

export interface SavedPlanItem {
  product_id: string;
  product_name: string;
  product_type: string;
  sum_assured: number;
  policy_term_years: number;
  payment_option: string;
  mode: string;
  total_instalment: number;
  total_annual_premium: number;
  rider_names: string[];
}

export interface SavedPlan {
  items: SavedPlanItem[];
  total_monthly: number;
  total_cover: number;
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
    recommended_cover: r.net_needs.recommended_cover ?? r.net_needs.net_coverage_gap,
    total_gross_need: r.net_needs.total_gross_need,
    age: inp?.age,
    dependents: inp?.dependents_count,
    saved_at: new Date().toISOString(),
  };
}

export function summariseSelection(selection: SelectedPlan[]): SavedPlan {
  const items = selection.map(({ quote }) => ({
    product_id: quote.product_id,
    product_name: quote.product_name,
    product_type: quote.product_type,
    sum_assured: quote.sum_assured,
    policy_term_years: quote.policy_term_years,
    payment_option: quote.payment_option,
    mode: quote.mode,
    total_instalment: quote.total_instalment,
    total_annual_premium: quote.total_annual_premium,
    rider_names: quote.riders.map((r) => r.rider_name),
  }));
  return {
    items,
    total_monthly: items.filter((i) => i.payment_option !== "single").reduce((sum, i) => sum + i.total_instalment, 0),
    total_cover: items.reduce((sum, i) => sum + i.sum_assured, 0),
    saved_at: new Date().toISOString(),
  };
}

/** Saves to the signed-in user's account (the server reads who they are from the session). Never blocks the journey. */
export async function saveMyPlan(data: { assessment?: SavedAssessment; plan?: SavedPlan }): Promise<boolean> {
  try {
    await fetchFromAPI("/my-plan", { method: "PUT", body: JSON.stringify(data) });
    return true;
  } catch {
    return false;
  }
}
