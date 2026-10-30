import type { Applicant, Gender, Priority, RecommendRequest, Risk } from "@/types/api";
import type { AssessmentInput, FutureGoal } from "@/types/assessment";
import type { SampleCustomerDetail } from "@/types/sample-customer";

export type Choice<T extends string> = T | "";
export type Employment = NonNullable<AssessmentInput["employment_type"]>;
export type GoalCategory = Exclude<FutureGoal["category"], "house">;
export type Residency = Applicant["residency"];
type YesNo = Choice<"yes" | "no">;

/** Everything the form holds is a string so a field can be truly empty (placeholder only). */
export interface GoalForm {
  type: Choice<GoalCategory>;
  name: string;
  cost: string;
  years: string;
}

export interface FormState {
  age: string;
  gender: Choice<Gender>;
  residency: Choice<Residency>;
  employment: Choice<Employment>;
  income: string;
  /** Asked monthly because that is how households think about it; converted to a yearly figure on submit. */
  monthlyExpenses: string;
  retire: string;
  smoker: YesNo;
  hasSpouse: YesNo;
  spouseAge: string;
  spouseWorks: YesNo;
  spouseIncome: string;
  childrenCount: string;
  childAges: string[];
  parentsCount: string;
  parentAges: string[];
  homeLoan: string;
  otherLoans: string;
  individualCover: string;
  groupCover: string;
  liquidSavings: string;
  marketInvestments: string;
  bufferMonths: string;
  goals: GoalForm[];
  monthlyBudget: string;
  preferredTerm: string;
  risk: Choice<Risk>;
  priority: Choice<Priority>;
}

export const BLANK_FORM: FormState = {
  age: "",
  gender: "",
  residency: "",
  employment: "",
  income: "",
  monthlyExpenses: "",
  retire: "",
  smoker: "",
  hasSpouse: "",
  spouseAge: "",
  spouseWorks: "",
  spouseIncome: "",
  childrenCount: "",
  childAges: [],
  parentsCount: "",
  parentAges: [],
  homeLoan: "",
  otherLoans: "",
  individualCover: "",
  groupCover: "",
  liquidSavings: "",
  marketInvestments: "",
  bufferMonths: "",
  goals: [],
  monthlyBudget: "",
  preferredTerm: "",
  risk: "",
  priority: "",
};

export const BLANK_GOAL: GoalForm = { type: "", name: "", cost: "", years: "" };

export const GOAL_TYPES: { value: GoalCategory; label: string }[] = [
  { value: "education", label: "Education" },
  { value: "marriage", label: "Marriage" },
  { value: "property", label: "Home / property" },
  { value: "family_support", label: "Family support" },
  { value: "other", label: "Other" },
];

export const MAX_GOALS = 5;
export const MAX_CHILDREN = 8;
export const MAX_PARENTS = 4;
const MAX_DEPENDENTS = 10;
const MAX_AMOUNT = 1_000_000_000;
export const MONTHS_PER_YEAR = 12;

/** Goal kinds the recommendation engine understands; "other" has no product-side meaning. */
const RECOMMEND_GOAL_TYPE: Partial<Record<GoalCategory, string>> = {
  education: "child_education",
  marriage: "child_marriage",
  property: "house_purchase",
  family_support: "parents_care",
};

const EMPLOYMENT_FROM_PACK: Record<string, Employment> = {
  salaried_private: "salaried",
  salaried_government: "salaried",
  business_owner: "business",
  self_employed_professional: "self_employed",
};

export type Errors = Record<string, string>;

const toNumber = (text: string): number | undefined => (text.trim() === "" ? undefined : Number(text));
const sumOf = (...texts: string[]): number => texts.reduce((total, text) => total + (toNumber(text) ?? 0), 0);

interface RangeOptions {
  required?: boolean;
  positive?: boolean;
}

function checkRange(errors: Errors, key: string, raw: string, label: string, min: number, max: number, options: RangeOptions = {}): void {
  const value = toNumber(raw);
  if (value === undefined) {
    if (options.required) errors[key] = `${label} is required`;
    return;
  }
  if (!Number.isFinite(value)) errors[key] = `${label} must be a number`;
  else if (options.positive && value <= 0) errors[key] = `${label} must be greater than 0`;
  else if (value < min || value > max)
    errors[key] = `${label} must be between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}`;
}

function checkChoice(errors: Errors, key: string, value: string, message: string): void {
  if (!value) errors[key] = message;
}

function validateProfile(form: FormState): Errors {
  const errors: Errors = {};
  checkRange(errors, "age", form.age, "Age", 18, 75, { required: true });
  checkChoice(errors, "gender", form.gender, "Choose one (it sets premium rates)");
  checkChoice(errors, "residency", form.residency, "Choose one");
  checkChoice(errors, "employment", form.employment, "Select your employment type");
  checkRange(errors, "income", form.income, "Annual income", 0, MAX_AMOUNT, { required: true });
  checkRange(errors, "monthlyExpenses", form.monthlyExpenses, "Monthly expenses", 1, MAX_AMOUNT / MONTHS_PER_YEAR, {
    required: true,
    positive: true,
  });
  checkRange(errors, "retire", form.retire, "Retirement age", 45, 75);
  const age = toNumber(form.age);
  const retire = toNumber(form.retire);
  if (!errors.age && !errors.retire && age !== undefined && retire !== undefined && retire <= age) {
    errors.retire = `Retirement age must be above your current age (${age})`;
  }
  checkChoice(errors, "smoker", form.smoker, "Choose one");
  return errors;
}

function validateAgeList(errors: Errors, key: string, ages: string[], label: string, min: number, max: number): void {
  ages.forEach((age, index) => checkRange(errors, `${key}.${index}`, age, label, min, max, { required: true }));
}

function validateSpouse(form: FormState, errors: Errors): void {
  checkChoice(errors, "hasSpouse", form.hasSpouse, "Choose one");
  if (form.hasSpouse !== "yes") return;
  checkRange(errors, "spouseAge", form.spouseAge, "Spouse age", 18, 100, { required: true });
  checkChoice(errors, "spouseWorks", form.spouseWorks, "Choose one");
  if (form.spouseWorks === "yes")
    checkRange(errors, "spouseIncome", form.spouseIncome, "Spouse income", 1, MAX_AMOUNT, { required: true, positive: true });
}

function validateFamily(form: FormState): Errors {
  const errors: Errors = {};
  validateSpouse(form, errors);
  checkRange(errors, "childrenCount", form.childrenCount, "Number of children", 0, MAX_CHILDREN, { required: true });
  checkRange(errors, "parentsCount", form.parentsCount, "Number of dependent parents", 0, MAX_PARENTS, { required: true });
  validateAgeList(errors, "childAges", form.childAges, "Child's age", 0, 30);
  validateAgeList(errors, "parentAges", form.parentAges, "Parent's age", 30, 110);
  return errors;
}

export type AmountKey = "homeLoan" | "otherLoans" | "individualCover" | "groupCover" | "liquidSavings" | "marketInvestments";

function validateLiabilities(form: FormState): Errors {
  const errors: Errors = {};
  const amounts: [AmountKey, string][] = [
    ["homeLoan", "Home loan"],
    ["otherLoans", "Other loans"],
    ["individualCover", "Individual cover"],
    ["groupCover", "Employer group cover"],
    ["liquidSavings", "Liquid savings"],
    ["marketInvestments", "Market investments"],
  ];
  amounts.forEach(([key, label]) => checkRange(errors, key, form[key], label, 0, MAX_AMOUNT));
  checkRange(errors, "bufferMonths", form.bufferMonths, "Emergency buffer", 0, 36);
  return errors;
}

function validateGoalsAndPreferences(form: FormState): Errors {
  const errors: Errors = {};
  form.goals.forEach((goal, index) => {
    checkChoice(errors, `goals.${index}.type`, goal.type, "Choose a type");
    if (!goal.name.trim()) errors[`goals.${index}.name`] = "Give this goal a name";
    checkRange(errors, `goals.${index}.cost`, goal.cost, "Cost", 1, MAX_AMOUNT, { required: true, positive: true });
    checkRange(errors, `goals.${index}.years`, goal.years, "Years away", 0, 40, { required: true });
  });
  checkRange(errors, "monthlyBudget", form.monthlyBudget, "Monthly budget", 1, 10_000_000, { positive: true });
  checkRange(errors, "preferredTerm", form.preferredTerm, "Policy term", 5, 60);
  checkChoice(errors, "risk", form.risk, "Choose how you feel about investment risk");
  return errors;
}

const STEP_VALIDATORS: ((form: FormState) => Errors)[] = [
  validateProfile,
  validateFamily,
  validateLiabilities,
  validateGoalsAndPreferences,
];
export const VALIDATED_STEP_COUNT = STEP_VALIDATORS.length;

export function validate(form: FormState, step: number): Errors {
  return STEP_VALIDATORS[step]?.(form) ?? {};
}

export function validateAll(form: FormState): { errors: Errors; firstInvalidStep: number } {
  const perStep = STEP_VALIDATORS.map((validator) => validator(form));
  return { errors: Object.assign({}, ...perStep), firstInvalidStep: perStep.findIndex((errors) => Object.keys(errors).length > 0) };
}

/** Grow or shrink a list of age fields to match the typed count, keeping what was already entered. */
export function resizeAgeList(ages: string[], countText: string, max: number): string[] {
  const count = Math.min(Math.max(Math.floor(Number(countText)) || 0, 0), max);
  return Array.from({ length: count }, (_, index) => ages[index] ?? "");
}

/** Spouse (0 or 1) + children + dependent parents, within the range the engine accepts. */
export function countDependents(form: FormState): number {
  const spouse = form.hasSpouse === "yes" ? 1 : 0;
  return Math.min(spouse + form.childAges.length + form.parentAges.length, MAX_DEPENDENTS);
}

const toAges = (ages: string[]): number[] => ages.map(Number);

function toFutureGoals(goals: GoalForm[]): FutureGoal[] {
  return goals.map((goal) => ({
    name: goal.name.trim(),
    cost_today: Number(goal.cost),
    years_away: Number(goal.years),
    category: goal.type || "other",
  }));
}

/** Build the needs-engine payload. Both covers count toward existing cover; savings and investments both count as assets. */
export function toAssessmentInput(form: FormState): AssessmentInput {
  const monthlyExpenses = Number(form.monthlyExpenses);
  const bufferMonths = toNumber(form.bufferMonths);
  const hasSpouse = form.hasSpouse === "yes";
  return {
    age: Number(form.age),
    employment_type: form.employment || "other",
    annual_income: Number(form.income),
    annual_expenses: monthlyExpenses * MONTHS_PER_YEAR,
    dependents_count: countDependents(form),
    outstanding_liabilities: sumOf(form.homeLoan, form.otherLoans),
    existing_cover: sumOf(form.individualCover, form.groupCover),
    eligible_assets: sumOf(form.liquidSavings, form.marketInvestments),
    immediate_expenses: bufferMonths === undefined ? undefined : Math.round(monthlyExpenses * bufferMonths),
    retirement_age: toNumber(form.retire),
    smoker_status: form.smoker === "yes",
    gender: form.gender || undefined,
    spouse_age: hasSpouse ? Number(form.spouseAge) : null,
    children_ages: toAges(form.childAges),
    parent_ages: toAges(form.parentAges),
    future_goals: toFutureGoals(form.goals),
  };
}

function toApplicant(form: FormState): Applicant {
  const spouseWorks = form.hasSpouse === "yes" && form.spouseWorks === "yes";
  const childAges = toAges(form.childAges);
  return {
    age: Number(form.age),
    gender: form.gender || "male",
    smoker: form.smoker === "yes",
    annual_income: Number(form.income),
    residency: form.residency || "resident",
    spouse_working: spouseWorks,
    spouse_annual_income: spouseWorks ? Number(form.spouseIncome) : 0,
    // Employer group cover is not individually underwritten, so it only counts in the needs engine, not here.
    existing_individual_cover: toNumber(form.individualCover) ?? 0,
    youngest_child_age: childAges.length ? Math.min(...childAges) : null,
  };
}

function toGoalTypes(goals: GoalForm[]): string[] {
  const kinds = goals.flatMap((goal) => (goal.type ? [RECOMMEND_GOAL_TYPE[goal.type]] : []));
  return [...new Set(kinds.filter((kind): kind is string => Boolean(kind)))];
}

/** Everything the Products page posts to /recommendations. */
export function toRecommendRequest(form: FormState, assessment: AssessmentInput): RecommendRequest {
  return {
    assessment,
    applicant: toApplicant(form),
    monthly_budget: toNumber(form.monthlyBudget) ?? null,
    preferred_term_years: toNumber(form.preferredTerm) ?? null,
    risk_appetite: form.risk || "medium",
    priority: form.priority || "balanced",
    liquid_investable: sumOf(form.liquidSavings, form.marketInvestments),
    goal_types: toGoalTypes(form.goals),
  };
}

/** Zero means "none" in the pack, but a blank field reads better than a typed 0. */
const textOrBlank = (value: number | null | undefined): string => (value ? String(value) : "");

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");

function goalsFromAssessment(goals: FutureGoal[] | undefined): GoalForm[] {
  return (goals ?? []).map((goal) => ({
    type: goal.category === "house" ? "property" : goal.category,
    name: goal.name,
    cost: String(goal.cost_today),
    years: String(goal.years_away),
  }));
}

function loanTotal(loans: SampleCustomerDetail["profile"]["liabilities"], isHome: boolean): number {
  return loans.filter((loan) => (loan.loan_type === "home") === isHome).reduce((total, loan) => total + loan.outstanding_principal_inr, 0);
}

/** Map a synthetic pack customer onto the form so the visitor can see and edit every answer. */
export function formFromSampleCustomer(detail: SampleCustomerDetail): FormState {
  const { profile, assessment, recommend_request: recommend } = detail;
  const spouse = profile.spouse;
  return {
    age: String(assessment.age),
    gender: profile.gender,
    residency: profile.residency_status === "nri" ? "nri" : "resident",
    employment: EMPLOYMENT_FROM_PACK[profile.employment_type] ?? "other",
    income: String(profile.annual_income_inr),
    monthlyExpenses: String(profile.monthly_household_expenses_inr),
    retire: "",
    smoker: yesNo(profile.smoker_status === "smoker"),
    hasSpouse: yesNo(spouse !== null),
    spouseAge: spouse ? String(spouse.age) : "",
    spouseWorks: spouse ? yesNo(spouse.working) : "",
    spouseIncome: textOrBlank(spouse?.annual_income_inr),
    childrenCount: String(profile.children_ages.length),
    childAges: profile.children_ages.map(String),
    parentsCount: String(profile.parent_ages.length),
    parentAges: profile.parent_ages.map(String),
    homeLoan: textOrBlank(loanTotal(profile.liabilities, true)),
    otherLoans: textOrBlank(loanTotal(profile.liabilities, false)),
    individualCover: textOrBlank(profile.individual_cover_inr),
    groupCover: textOrBlank(profile.employer_group_cover_inr),
    liquidSavings: textOrBlank(profile.liquid_savings_inr),
    marketInvestments: textOrBlank(profile.market_investments_inr),
    bufferMonths: "",
    goals: goalsFromAssessment(assessment.future_goals),
    monthlyBudget: textOrBlank(profile.monthly_premium_budget_inr),
    preferredTerm: textOrBlank(profile.preferred_policy_term_years),
    risk: profile.risk_appetite,
    priority: recommend.priority,
  };
}

export const digitsOnly = (value: string, max = 12): string => value.replace(/[^\d]/g, "").slice(0, max);
export const groupIN = (value: string): string => (value === "" ? "" : Number(value).toLocaleString("en-IN"));
