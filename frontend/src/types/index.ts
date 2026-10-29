export interface InsuranceProduct {
  id: string;
  name: string;
  insurer: string;
  category: string;
  tagline: string;
  min_entry_age: number | null;
  max_entry_age: number | null;
  min_annual_income: number;
  min_sum_assured: number;
  max_sum_assured: number;
  claim_settlement_ratio: number | null;
  solvency_ratio: number | null;
  base_rate_per_lakh: number;
  key_features: string[];
  riders_available: string[];
  exclusions: string[];
  source_provenance: string;
  is_synthetic_demonstration: boolean;

  // Sourced facts (term-plan catalogue)
  data_status?: "sourced" | "partially_sourced" | "unverified_sample";
  uin?: string | null;
  as_of?: string | null;
  min_term_years?: number | null;
  max_term_years?: number | null;
  max_maturity_age?: number | null;
  death_benefit_options?: string[];
  premium_payment_options?: string[];
  has_smoker_rates?: boolean | null;
  brochure_url?: string | null;
  product_page_url?: string | null;
  quote_url?: string | null;
  claim_ratio_basis?: string | null;
  claim_ratio_source_url?: string | null;
  solvency_basis?: string | null;
  solvency_source_url?: string | null;
  sum_assured_note?: string | null;
  notes?: string[];
  sample_premium?: { age: number; cover: number; term_years: number; annual_premium: number; note: string } | null;
  unconfirmed_fields?: string[];
}
