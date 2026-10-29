import type { AssessmentInput, FutureGoal } from "@/types/assessment";

/** Everything the form holds is a string so a field can be truly empty (placeholder only). */
export interface GoalForm {
  type: "education" | "marriage" | "property" | "other" | "";
  name: string;
  cost: string;
  years: string;
}

export interface FormState {
  age: string;
  employment: "salaried" | "self_employed" | "business" | "other" | "";
  income: string;
  expenses: string;
  retire: string;
  smoker: "yes" | "no" | "";
  dependents: string;
  supportYears: string;
  bufferMonths: string;
  homeLoan: string;
  otherLoans: string;
  existingCover: string;
  liquidAssets: string;
  goals: GoalForm[];
}

export const BLANK_FORM: FormState = {
  age: "", employment: "", income: "", expenses: "", retire: "", smoker: "",
  dependents: "", supportYears: "", bufferMonths: "",
  homeLoan: "", otherLoans: "", existingCover: "", liquidAssets: "",
  goals: [],
};

export const BLANK_GOAL: GoalForm = { type: "", name: "", cost: "", years: "" };

export const GOAL_TYPES: { value: Exclude<GoalForm["type"], "">; label: string }[] = [
  { value: "education", label: "Education" },
  { value: "marriage", label: "Marriage" },
  { value: "property", label: "Home / property" },
  { value: "other", label: "Other" },
];

// Standard assumptions shown to the user in the review step
export const ASSUMPTIONS = { inflation: 0.07, discount: 0.08, eduInflation: 0.1, defaultRetire: 60 };

export type Errors = Record<string, string>;

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));


function range(errors: Errors, key: string, raw: string, label: string, min: number, max: number, opts: { required?: boolean; positive?: boolean } = {}) {
  const v = num(raw);
  if (v === undefined) {
    if (opts.required) errors[key] = `${label} is required`;
    return;
  }
  if (!Number.isFinite(v)) errors[key] = `${label} must be a number`;
  else if (opts.positive && v <= 0) errors[key] = `${label} must be greater than 0`;
  else if (v < min || v > max) errors[key] = `${label} must be between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}`;
}

export function validate(f: FormState, step: number): Errors {
  const e: Errors = {};
  if (step === 0) {
    range(e, "age", f.age, "Age", 18, 75, { required: true });
    if (!f.employment) e.employment = "Select your employment type";
    range(e, "income", f.income, "Annual income", 1, 1_000_000_000, { required: true, positive: true });
    range(e, "expenses", f.expenses, "Annual expenses", 1, 1_000_000_000, { required: true, positive: true });
    range(e, "retire", f.retire, "Retirement age", 45, 75);
    const age = num(f.age);
    const retire = num(f.retire) ?? ASSUMPTIONS.defaultRetire;
    if (!e.age && !e.retire && age !== undefined && retire <= age) {
      e.retire = num(f.retire) === undefined
        ? `Enter a retirement age above ${age} (we assume ${ASSUMPTIONS.defaultRetire} when blank)`
        : `Retirement age must be above your current age (${age})`;
    }
    if (!f.smoker) e.smoker = "Choose one";
  }
  if (step === 1) {
    range(e, "dependents", f.dependents, "Dependents", 0, 10, { required: true });
    range(e, "supportYears", f.supportYears, "Support years", 1, 50);
    range(e, "bufferMonths", f.bufferMonths, "Emergency buffer", 0, 36);
  }
  if (step === 2) {
    (["homeLoan", "otherLoans", "existingCover", "liquidAssets"] as const).forEach((k) => {
      const labels = { homeLoan: "Home loan", otherLoans: "Other loans", existingCover: "Existing cover", liquidAssets: "Liquid assets" };
      range(e, k, f[k], labels[k], 0, 1_000_000_000);
    });
  }
  if (step === 3) {
    f.goals.forEach((g, i) => {
      if (!g.type) e[`goal.${i}.type`] = "Choose a type";
      if (!g.name.trim()) e[`goal.${i}.name`] = "Give this goal a name";
      range(e, `goal.${i}.cost`, g.cost, "Cost", 1, 1_000_000_000, { required: true, positive: true });
      range(e, `goal.${i}.years`, g.years, "Years away", 1, 40, { required: true });
    });
  }
  return e;
}

export function validateAll(f: FormState): { errors: Errors; firstStep: number } {
  let errors: Errors = {};
  let firstStep = -1;
  for (let s = 0; s < 4; s++) {
    const e = validate(f, s);
    if (Object.keys(e).length && firstStep === -1) firstStep = s;
    errors = { ...errors, ...e };
  }
  return { errors, firstStep };
}

/** Build the API payload. Field names follow the backend schema. */
export function toInput(f: FormState): AssessmentInput {
  const income = Number(f.income), expenses = Number(f.expenses);
  const home = num(f.homeLoan) ?? 0, other = num(f.otherLoans) ?? 0;
  const buffer = num(f.bufferMonths);
  const support = num(f.supportYears);
  const goals: FutureGoal[] = f.goals.map((g) => ({
    name: g.name.trim(),
    cost_today: Number(g.cost),
    years_away: Number(g.years),
    category: (g.type || "other") as FutureGoal["category"],
  }));
  return {
    age: Number(f.age),
    employment_type: (f.employment || "other") as AssessmentInput["employment_type"],
    annual_income: income,
    annual_expenses: expenses,
    dependents_count: Number(f.dependents),
    support_horizon_years: support,
    years_support_needed: support,
    outstanding_liabilities: home + other,
    home_loan: home,
    personal_loan: other,
    existing_cover: num(f.existingCover) ?? 0,
    eligible_assets: num(f.liquidAssets) ?? 0,
    emergency_fund_months: buffer,
    immediate_expenses: buffer === undefined ? undefined : Math.round((expenses / 12) * buffer),
    retirement_age: num(f.retire) ?? ASSUMPTIONS.defaultRetire,
    inflation_rate: ASSUMPTIONS.inflation,
    discount_rate: ASSUMPTIONS.discount,
    edu_inflation_rate: ASSUMPTIONS.eduInflation,
    smoker_status: f.smoker === "yes",
    future_goals: goals,
  };
}

/** Rebuild form strings from a previously submitted input (returning users). */
export function fromInput(i: AssessmentInput): FormState {
  const s = (n: number | undefined, zeroBlank = false) => (n === undefined || n === null || (zeroBlank && n === 0) ? "" : String(n));
  const buffer = i.emergency_fund_months;
  return {
    age: s(i.age),
    employment: (i.employment_type as FormState["employment"]) ?? "",
    income: s(i.annual_income),
    expenses: s(i.annual_expenses),
    retire: s(i.retirement_age),
    smoker: i.smoker_status ? "yes" : "no",
    dependents: s(i.dependents_count),
    supportYears: s(i.support_horizon_years ?? i.years_support_needed),
    bufferMonths: s(buffer),
    homeLoan: s(i.home_loan, true),
    otherLoans: s(i.personal_loan, true),
    existingCover: s(i.existing_cover, true),
    liquidAssets: s(i.eligible_assets, true),
    goals: (i.future_goals ?? []).map((g) => ({
      type: ((g.category as string) === "house" ? "property" : (g.category as GoalForm["type"])) || "other",
      name: g.name,
      cost: s(g.cost_today),
      years: s(g.years_away),
    })),
  };
}

/** Sample profile for the optional "Load demo" button. */
export const DEMO_FORM: FormState = {
  age: "32", employment: "salaried", income: "1800000", expenses: "720000", retire: "60", smoker: "no",
  dependents: "2", supportYears: "20", bufferMonths: "6",
  homeLoan: "3500000", otherLoans: "", existingCover: "5000000", liquidAssets: "2000000",
  goals: [{ type: "education", name: "Child higher education", cost: "2500000", years: "14" }],
};

export const digitsOnly = (v: string, max = 12) => v.replace(/[^\d]/g, "").slice(0, max);
export const groupIN = (v: string) => (v === "" ? "" : Number(v).toLocaleString("en-IN"));
