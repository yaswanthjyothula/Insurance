import type { AssessmentInput } from "@/types/assessment";
import type { Gender } from "@/types/api";

/** Every field is text so a money field can be genuinely empty instead of showing a made-up number. */
export interface LifeCoverForm {
  age: string;
  gender: Gender;
  smoker: boolean;
  income: string;
  expenses: string;
  dependents: string;
  supportYears: string;
  spouseAge: string;
  childrenAges: string;
  parentAges: string;
  liabilities: string;
  existingCover: string;
  assets: string;
}

export const BLANK_LIFE_COVER_FORM: LifeCoverForm = {
  age: "",
  gender: "male",
  smoker: false,
  income: "",
  expenses: "",
  dependents: "",
  supportYears: "",
  spouseAge: "",
  childrenAges: "",
  parentAges: "",
  liabilities: "",
  existingCover: "",
  assets: "",
};

export type FormErrors = Partial<Record<keyof LifeCoverForm, string>>;

const MAX_CHILDREN = 10;
const MAX_PARENTS = 4;

/** "5, 9 12" becomes [5, 9, 12]. Anything that is not a whole number comes back as NaN so validation can flag it. */
export function parseAgeList(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : NaN));
}

const isBlank = (value: string) => value.trim() === "";
/** Commas are allowed in amounts, as people type them (18,00,000). */
const toNumber = (value: string) => (isBlank(value) ? undefined : Number(value.replace(/,/g, "")));

function checkNumber(
  errors: FormErrors,
  key: keyof LifeCoverForm,
  raw: string,
  label: string,
  min: number,
  max: number,
  required: boolean,
) {
  const value = toNumber(raw);
  if (value === undefined) {
    if (required) errors[key] = `${label} is required`;
  } else if (!Number.isFinite(value) || value < min || value > max) {
    errors[key] = `${label} must be between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}`;
  }
}

function checkAgeList(
  errors: FormErrors,
  key: keyof LifeCoverForm,
  raw: string,
  label: string,
  min: number,
  max: number,
  maxCount: number,
) {
  const ages = parseAgeList(raw);
  if (ages.length > maxCount) errors[key] = `${label}: enter at most ${maxCount} ages`;
  else if (ages.some((age) => !Number.isFinite(age) || age < min || age > max))
    errors[key] = `${label}: use whole-number ages between ${min} and ${max}, separated by commas`;
}

export function validateLifeCoverForm(form: LifeCoverForm): FormErrors {
  const errors: FormErrors = {};
  checkNumber(errors, "age", form.age, "Your age", 18, 75, true);
  checkNumber(errors, "income", form.income, "Yearly income", 1, 1_000_000_000, true);
  checkNumber(errors, "expenses", form.expenses, "Yearly household expenses", 1, 1_000_000_000, true);
  checkNumber(errors, "dependents", form.dependents, "Dependents", 0, 10, true);
  checkNumber(errors, "supportYears", form.supportYears, "Years of support", 1, 50, false);
  checkNumber(errors, "spouseAge", form.spouseAge, "Spouse age", 18, 100, false);
  checkAgeList(errors, "childrenAges", form.childrenAges, "Children's ages", 0, 30, MAX_CHILDREN);
  checkAgeList(errors, "parentAges", form.parentAges, "Parents' ages", 30, 100, MAX_PARENTS);
  checkNumber(errors, "liabilities", form.liabilities, "Loans", 0, 1_000_000_000, false);
  checkNumber(errors, "existingCover", form.existingCover, "Existing cover", 0, 1_000_000_000, false);
  checkNumber(errors, "assets", form.assets, "Savings", 0, 1_000_000_000, false);
  return errors;
}

/** Build the /assessments payload. Blank optional fields are left out so the backend applies its pack defaults. */
export function toAssessmentInput(form: LifeCoverForm): AssessmentInput {
  const spouseAge = toNumber(form.spouseAge);
  return {
    age: toNumber(form.age) ?? 0,
    gender: form.gender,
    smoker_status: form.smoker,
    annual_income: toNumber(form.income) ?? 0,
    annual_expenses: toNumber(form.expenses) ?? 0,
    dependents_count: toNumber(form.dependents) ?? 0,
    support_horizon_years: toNumber(form.supportYears),
    spouse_age: spouseAge ?? null,
    children_ages: parseAgeList(form.childrenAges),
    parent_ages: parseAgeList(form.parentAges),
    outstanding_liabilities: toNumber(form.liabilities) ?? 0,
    existing_cover: toNumber(form.existingCover) ?? 0,
    eligible_assets: toNumber(form.assets) ?? 0,
    future_goals: [],
  };
}
