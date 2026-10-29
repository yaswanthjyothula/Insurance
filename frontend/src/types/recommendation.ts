import { InsuranceProduct } from "./index";

export interface ScoreFactor {
  key: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export interface RankedRecommendation {
  rank: number;
  product: InsuranceProduct;
  suitability_score: number;
  match_percent: number;
  score_breakdown: ScoreFactor[];
  suggested_sum_assured: number;
  suggested_term_years: number;
  premium_is_estimate: boolean;
  eligibility_status: string;
  estimated_annual_premium: number;
  estimated_monthly_premium: number;
  rule_percent: number;
  model_percent?: number | null;
  grounded_explanation: string;
  pros: string[];
  cons: string[];
}

export interface RecommendationResponse {
  recommendation_id: string;
  model_version: string;
  ranking_method?: string;
  recommendations: RankedRecommendation[];
  total_evaluated: number;
  eligible_count: number;
  methodology_note: string;
}

export interface PolicyCustomization {
  selected_product_id: string;
  sum_assured: number;
  tenure_years: number;
  payment_frequency: "annual" | "half_yearly" | "monthly";
  selected_riders: string[];
  estimated_annual_premium: number;
  estimated_monthly_premium: number;
  remaining_gap: number;
}

export interface ComparedProductItem {
  product: InsuranceProduct;
  estimated_annual_premium: number;
  estimated_monthly_premium: number;
  fit_summary: string;
  key_tradeoffs: string[];
}

export interface ProductCompareResponse {
  compared_products: ComparedProductItem[];
  target_sum_assured: number;
  tenure_years: number;
  comparison_summary: string;
}
