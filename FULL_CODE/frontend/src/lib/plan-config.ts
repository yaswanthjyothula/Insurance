import type { Applicant, PackProduct, PayMode, ProductFit, QuoteRequest, RiderChoice, SelectedPlan } from "@/types/api";

export const PAYMENT_LABELS: Record<string, string> = {
  regular: "Pay every year for the whole term",
  single: "Pay once",
};

export const MODE_LABELS: Record<PayMode, string> = {
  annual: "Yearly",
  half_yearly: "Every 6 months",
  quarterly: "Every 3 months",
  monthly: "Monthly",
};

/** "limited_10" becomes "Pay for 10 years only". */
export function paymentLabel(option: string): string {
  if (PAYMENT_LABELS[option]) return PAYMENT_LABELS[option];
  const years = option.startsWith("limited_") ? option.split("_")[1] : null;
  return years ? `Pay for ${years} years only` : option;
}

/** The request that reproduces the configuration the engine suggested, so the customer starts from a sensible point. */
export function requestFromFit(fit: ProductFit, applicant: Applicant, mode: PayMode = "monthly"): QuoteRequest {
  const q = fit.quote;
  if (!q) throw new Error("Only a priced product can be configured");
  return {
    product_id: fit.product_id,
    applicant,
    sum_assured: fit.sa_multiple ? undefined : q.sum_assured,
    policy_term_years: q.policy_term_years,
    payment_option: q.payment_option,
    mode,
    riders: [],
    annual_premium: fit.sa_multiple ? Math.round(q.base_annual_premium) : undefined,
    sa_multiple: fit.sa_multiple ?? undefined,
    fund_id: fit.fund_id ?? undefined,
  };
}

/** Largest rider cover allowed: the rider's own maximum or a share of the base cover, whichever is lower. */
export function riderCoverLimit(maxRiderSa: number | null | undefined, maxPctOfBase: number | null | undefined, baseSa: number): number {
  const byBase = Math.floor((baseSa * (maxPctOfBase ?? 100)) / 100);
  return maxRiderSa != null ? Math.min(maxRiderSa, byBase) : byBase;
}

/** Sum assured multiples a ULIP offers at this age (the pack lists one set up to 44 and another from 45). */
export function ulipMultiples(product: PackProduct, age: number): number[] {
  const table = product.sa_multiple_of_annual_premium ?? {};
  return table[age <= 44 ? "entry_age_upto_44" : "entry_age_45_plus"] ?? [];
}

export function toggleRider(riders: RiderChoice[], riderId: string, saForRider: number | null): RiderChoice[] {
  const without = riders.filter((r) => r.rider_id !== riderId);
  return without.length === riders.length ? [...riders, { rider_id: riderId, sum_assured: saForRider }] : without;
}

/** One plan per product: configuring a product again replaces its earlier configuration. */
export function upsertPlan(selection: SelectedPlan[], plan: SelectedPlan): SelectedPlan[] {
  return [...selection.filter((p) => p.request.product_id !== plan.request.product_id), plan];
}

export function monthlyTotal(selection: SelectedPlan[]): number {
  return selection.filter((p) => p.quote.payment_option !== "single").reduce((sum, p) => sum + p.quote.total_instalment, 0);
}
