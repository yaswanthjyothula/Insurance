import type { NeedsConfig, ProductConfig, UnderwritingConfig } from "@/types/admin";

export type Errors<T extends string> = Partial<Record<T, string>>;

/** Limits that mirror the server's (backend/app/admin/schemas.py), so mistakes show while typing. The server still has the final say. */
export const NEEDS_LIMITS = {
  income_replacement_multiple_min: { min: 1, max: 50, step: 0.5 },
  income_replacement_multiple_max: { min: 1, max: 50, step: 0.5 },
  inflation_rate: { min: 1, max: 15, step: 0.1 },
  discount_rate: { min: 2, max: 18, step: 0.1 },
  deceased_expense_reduction_factor: { min: 0, max: 80, step: 1 },
  emergency_fund_months: { min: 0, max: 36, step: 1 },
} as const;

export function validateNeeds(n: NeedsConfig): Errors<keyof NeedsConfig> {
  const errors: Errors<keyof NeedsConfig> = {};
  (Object.keys(NEEDS_LIMITS) as (keyof typeof NEEDS_LIMITS)[]).forEach((key) => {
    const { min, max } = NEEDS_LIMITS[key];
    const value = n[key];
    if (!Number.isFinite(value) || value < min || value > max) errors[key] = `Use a value from ${min} to ${max}.`;
  });
  if (
    !errors.income_replacement_multiple_min &&
    !errors.income_replacement_multiple_max &&
    n.income_replacement_multiple_min > n.income_replacement_multiple_max
  ) {
    errors.income_replacement_multiple_min = "The minimum cannot be above the maximum.";
  }
  return errors;
}

export function changedNeeds(draft: NeedsConfig, saved: NeedsConfig): Partial<NeedsConfig> {
  const out: Partial<NeedsConfig> = {};
  (Object.keys(draft) as (keyof NeedsConfig)[]).forEach((key) => {
    if (draft[key] !== saved[key]) (out as Record<string, number>)[key] = draft[key];
  });
  return out;
}

export function validateUnderwriting(u: UnderwritingConfig): Errors<keyof UnderwritingConfig> {
  const errors: Errors<keyof UnderwritingConfig> = {};
  const positive = [
    "non_medical_sum_assured_limit",
    "tele_medical_threshold",
    "physical_medical_threshold",
    "stp_maximum_sum_assured",
  ] as const;
  positive.forEach((key) => {
    if (!(u[key] > 0)) errors[key] = "Enter an amount above zero.";
  });
  if (!errors.tele_medical_threshold && u.tele_medical_threshold < u.non_medical_sum_assured_limit)
    errors.tele_medical_threshold = "Must be at least the non-medical limit.";
  if (!errors.physical_medical_threshold && u.physical_medical_threshold < u.tele_medical_threshold)
    errors.physical_medical_threshold = "Must be at least the tele-medical threshold.";
  if (!errors.stp_maximum_sum_assured && u.stp_maximum_sum_assured > u.non_medical_sum_assured_limit)
    errors.stp_maximum_sum_assured = "Straight-through cases are non-medical, so this cannot exceed the non-medical limit.";
  if (u.non_medical_maximum_age < 18 || u.non_medical_maximum_age > 80) errors.non_medical_maximum_age = "Use an age from 18 to 80.";
  if (u.stp_maximum_age < 18 || u.stp_maximum_age > 80) errors.stp_maximum_age = "Use an age from 18 to 80.";
  else if (!errors.non_medical_maximum_age && u.stp_maximum_age > u.non_medical_maximum_age)
    errors.stp_maximum_age = "Cannot exceed the maximum non-medical age.";
  return errors;
}

export function changedUnderwriting(draft: UnderwritingConfig, saved: UnderwritingConfig): Partial<UnderwritingConfig> {
  const out: Record<string, unknown> = {};
  (Object.keys(draft) as (keyof UnderwritingConfig)[]).forEach((key) => {
    if (draft[key] !== saved[key]) out[key] = draft[key];
  });
  return out as Partial<UnderwritingConfig>;
}

export type ProductField =
  | "product_id"
  | "product_name"
  | "minimum_entry_age"
  | "maximum_entry_age"
  | "minimum_maturity_age"
  | "maximum_maturity_age"
  | "minimum_tenure"
  | "maximum_tenure"
  | "minimum_sum_assured"
  | "maximum_sum_assured"
  | "maximum_income_multiple"
  | "base_rate_per_1000"
  | "smoker_loading_percentage"
  | "age_loading_percentage_per_year"
  | "male"
  | "female";

export const PRODUCT_ID_PATTERN = /^PRD-[A-Z0-9]{4,12}$/;

export function validateProduct(p: ProductConfig, existingIds: string[] = [], creating = false): Errors<ProductField> {
  const e: Errors<ProductField> = {};
  if (creating) {
    if (!PRODUCT_ID_PATTERN.test(p.product_id)) e.product_id = "Use PRD- then 4 to 12 capital letters or digits, like PRD-GOLD01.";
    else if (existingIds.includes(p.product_id)) e.product_id = "That product ID is already used.";
  }
  if (p.product_name.trim().length < 3) e.product_name = "Give the product a name of at least 3 characters.";
  if (!(p.minimum_entry_age < p.maximum_entry_age)) e.minimum_entry_age = "The minimum entry age must be lower than the maximum.";
  if (p.minimum_maturity_age > p.maximum_maturity_age) e.minimum_maturity_age = "The minimum maturity age cannot be above the maximum.";
  if (p.minimum_tenure > p.maximum_tenure) e.minimum_tenure = "The minimum tenure cannot be above the maximum.";
  if (!(p.minimum_tenure >= 1)) e.minimum_tenure = "Use at least 1 year.";
  if (!(p.minimum_sum_assured > 0)) e.minimum_sum_assured = "Enter an amount above zero.";
  else if (p.minimum_sum_assured > p.maximum_sum_assured) e.minimum_sum_assured = "The minimum cannot be above the maximum.";
  if (p.category !== "ULIP" && !(p.base_rate_per_1000 !== null && p.base_rate_per_1000 > 0))
    e.base_rate_per_1000 = "The rate must be above zero.";
  if (p.maximum_income_multiple !== null && !(p.maximum_income_multiple > 0 && p.maximum_income_multiple <= 100))
    e.maximum_income_multiple = "Use a multiple from 1 to 100, or leave it empty.";
  if (p.smoker_loading_percentage < 0 || p.smoker_loading_percentage > 100) e.smoker_loading_percentage = "Use 0 to 100%.";
  if (p.age_loading_percentage_per_year < 0 || p.age_loading_percentage_per_year > 10)
    e.age_loading_percentage_per_year = "Use 0 to 10% a year.";
  (["male", "female"] as const).forEach((g) => {
    const f = p.gender_discount_factors[g];
    if (!(f >= 0.5 && f <= 1.5)) e[g] = "Use a factor from 0.5 to 1.5.";
  });
  return e;
}

/** What differs between a saved product and its draft, as the update body the API expects. */
export function productPatch(draft: ProductConfig, saved: ProductConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const simple = [
    "product_name",
    "active",
    "minimum_entry_age",
    "maximum_entry_age",
    "minimum_maturity_age",
    "maximum_maturity_age",
    "minimum_tenure",
    "maximum_tenure",
    "minimum_sum_assured",
    "maximum_sum_assured",
    "base_rate_per_1000",
    "age_loading_percentage_per_year",
    "smoker_loading_percentage",
  ] as const;
  simple.forEach((key) => {
    if (draft[key] !== saved[key]) out[key] = draft[key];
  });
  if (draft.maximum_income_multiple !== saved.maximum_income_multiple) {
    if (draft.maximum_income_multiple === null) out.clear_income_multiple = true;
    else out.maximum_income_multiple = draft.maximum_income_multiple;
  }
  const factors: Record<string, number> = {};
  (["male", "female"] as const).forEach((g) => {
    if (draft.gender_discount_factors[g] !== saved.gender_discount_factors[g]) factors[g] = draft.gender_discount_factors[g];
  });
  if (Object.keys(factors).length) out.gender_discount_factors = factors;
  if ([...draft.allowed_riders].sort().join() !== [...saved.allowed_riders].sort().join()) out.allowed_riders = draft.allowed_riders;
  return out;
}

export function blankProduct(category: ProductConfig["category"] = "Term Life"): ProductConfig {
  return {
    product_id: "",
    product_name: "",
    category,
    active: true,
    minimum_entry_age: 21,
    maximum_entry_age: 55,
    minimum_maturity_age: 31,
    maximum_maturity_age: 70,
    minimum_tenure: 10,
    maximum_tenure: 35,
    minimum_sum_assured: 2_500_000,
    maximum_sum_assured: 100_000_000,
    maximum_income_multiple: null,
    base_rate_per_1000: 1,
    reference_rate_per_1000: null,
    age_loading_percentage_per_year: 3,
    smoker_loading_percentage: 25,
    gender_discount_factors: { male: 1, female: 0.9 },
    allowed_riders: [],
    custom: true,
  };
}

/** 12500000 -> "1.25 Cr"; 4500000 -> "45 L". */
export function inrShort(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10_000_000) return `${sign}₹${+(abs / 10_000_000).toFixed(2)} Cr`;
  if (abs >= 100_000) return `${sign}₹${+(abs / 100_000).toFixed(2)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export const ROUTE_LABEL: Record<string, string> = {
  non_medical: "Non-medical",
  tele_medical: "Tele-medical",
  physical_medical: "Physical medical",
  full_underwriting: "Full underwriting",
};
