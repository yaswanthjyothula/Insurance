import { describe, expect, it } from "vitest";
import {
  BLANK_FORM,
  countDependents,
  formFromSampleCustomer,
  resizeAgeList,
  toAssessmentInput,
  toRecommendRequest,
  validate,
  validateAll,
  type FormState,
} from "./assessment-form";
import type { SampleCustomerDetail } from "@/types/sample-customer";

/** A fully answered form: a 32-year-old with a working spouse, two children and one parent. */
const FILLED_FORM: FormState = {
  ...BLANK_FORM,
  age: "32",
  gender: "female",
  residency: "resident",
  employment: "salaried",
  income: "1800000",
  monthlyExpenses: "50000",
  retire: "",
  smoker: "no",
  hasSpouse: "yes",
  spouseAge: "31",
  spouseWorks: "yes",
  spouseIncome: "600000",
  childrenCount: "2",
  childAges: ["6", "4"],
  parentsCount: "1",
  parentAges: ["62"],
  homeLoan: "2000000",
  otherLoans: "500000",
  individualCover: "1000000",
  groupCover: "2000000",
  liquidSavings: "700000",
  marketInvestments: "300000",
  bufferMonths: "",
  goals: [
    { type: "education", name: "College", cost: "1500000", years: "12" },
    { type: "marriage", name: "Wedding", cost: "2500000", years: "20" },
  ],
  monthlyBudget: "",
  preferredTerm: "",
  risk: "medium",
  priority: "",
};

describe("validate", () => {
  it("asks for every required profile answer when the form is empty", () => {
    const errors = validate(BLANK_FORM, 0);
    expect(Object.keys(errors).sort()).toEqual(["age", "employment", "gender", "income", "monthlyExpenses", "residency", "smoker"]);
  });

  it.each(["17", "76", "-5", "abc"])("rejects the age %s", (age) => {
    expect(validate({ ...FILLED_FORM, age }, 0).age).toBeDefined();
  });

  it("accepts the youngest and oldest allowed ages", () => {
    expect(validate({ ...FILLED_FORM, age: "18" }, 0).age).toBeUndefined();
    expect(validate({ ...FILLED_FORM, age: "75" }, 0).age).toBeUndefined();
  });

  it("rejects a retirement age that is not above the current age", () => {
    expect(validate({ ...FILLED_FORM, age: "50", retire: "50" }, 0).retire).toMatch(/above your current age/);
    expect(validate({ ...FILLED_FORM, age: "50", retire: "45" }, 0).retire).toBeDefined();
    expect(validate({ ...FILLED_FORM, age: "50", retire: "60" }, 0).retire).toBeUndefined();
  });

  it("lets retirement age be blank", () => {
    expect(validate({ ...FILLED_FORM, retire: "" }, 0).retire).toBeUndefined();
  });

  it("allows zero income but never zero or negative expenses", () => {
    expect(validate({ ...FILLED_FORM, income: "0" }, 0).income).toBeUndefined();
    expect(validate({ ...FILLED_FORM, monthlyExpenses: "0" }, 0).monthlyExpenses).toBeDefined();
    expect(validate({ ...FILLED_FORM, monthlyExpenses: "-100" }, 0).monthlyExpenses).toBeDefined();
  });

  it("rejects negative amounts on the liabilities step", () => {
    const errors = validate({ ...FILLED_FORM, homeLoan: "-1", groupCover: "-20" }, 2);
    expect(Object.keys(errors).sort()).toEqual(["groupCover", "homeLoan"]);
  });

  it("only asks for spouse details when there is a spouse", () => {
    expect(validate({ ...FILLED_FORM, hasSpouse: "no", spouseAge: "", spouseWorks: "", spouseIncome: "" }, 1)).toEqual({});
    const errors = validate({ ...FILLED_FORM, spouseAge: "", spouseWorks: "yes", spouseIncome: "" }, 1);
    expect(Object.keys(errors).sort()).toEqual(["spouseAge", "spouseIncome"]);
  });

  it("requires an age for each child and parent", () => {
    const errors = validate({ ...FILLED_FORM, childAges: ["6", ""], parentAges: ["10"] }, 1);
    expect(Object.keys(errors).sort()).toEqual(["childAges.1", "parentAges.0"]);
  });

  it("requires a risk appetite but treats budget, term and priority as optional", () => {
    expect(validate({ ...FILLED_FORM, risk: "" }, 3).risk).toBeDefined();
    expect(validate(FILLED_FORM, 3)).toEqual({});
  });

  it("checks the optional budget and term ranges when given", () => {
    expect(validate({ ...FILLED_FORM, monthlyBudget: "0" }, 3).monthlyBudget).toBeDefined();
    expect(validate({ ...FILLED_FORM, preferredTerm: "4" }, 3).preferredTerm).toBeDefined();
    expect(validate({ ...FILLED_FORM, preferredTerm: "61" }, 3).preferredTerm).toBeDefined();
  });

  it("flags an incomplete goal row by field", () => {
    const errors = validate({ ...FILLED_FORM, goals: [{ type: "", name: " ", cost: "", years: "41" }] }, 3);
    expect(Object.keys(errors).sort()).toEqual(["goals.0.cost", "goals.0.name", "goals.0.type", "goals.0.years"]);
  });
});

describe("validateAll", () => {
  it("reports the first step that has a problem", () => {
    expect(validateAll({ ...FILLED_FORM, childAges: ["", ""] }).firstInvalidStep).toBe(1);
    expect(validateAll(BLANK_FORM).firstInvalidStep).toBe(0);
  });

  it("reports no step for a complete form", () => {
    expect(validateAll(FILLED_FORM)).toEqual({ errors: {}, firstInvalidStep: -1 });
  });
});

describe("resizeAgeList", () => {
  it("adds empty slots and keeps what was typed", () => {
    expect(resizeAgeList(["6"], "3", 8)).toEqual(["6", "", ""]);
  });

  it("drops trailing slots when the count shrinks", () => {
    expect(resizeAgeList(["6", "4", "2"], "1", 8)).toEqual(["6"]);
  });

  it("treats a blank or invalid count as none and caps at the maximum", () => {
    expect(resizeAgeList(["6"], "", 8)).toEqual([]);
    expect(resizeAgeList([], "9", 4)).toHaveLength(4);
  });
});

describe("countDependents", () => {
  it("adds spouse, children and parents", () => {
    expect(countDependents(FILLED_FORM)).toBe(4);
  });

  it("does not count a spouse that is absent", () => {
    expect(countDependents({ ...FILLED_FORM, hasSpouse: "no" })).toBe(3);
  });

  it("never exceeds the engine's limit of ten", () => {
    const crowded = { ...FILLED_FORM, childAges: Array(8).fill("5") as string[], parentAges: Array(4).fill("60") as string[] };
    expect(countDependents(crowded)).toBe(10);
  });
});

describe("toAssessmentInput", () => {
  const input = toAssessmentInput(FILLED_FORM);

  it("converts monthly expenses to a yearly figure", () => {
    expect(input.annual_expenses).toBe(600000);
  });

  it("counts both covers as existing cover and both savings kinds as assets", () => {
    expect(input.existing_cover).toBe(3000000);
    expect(input.eligible_assets).toBe(1000000);
    expect(input.outstanding_liabilities).toBe(2500000);
  });

  it("parses the family structure", () => {
    expect(input.spouse_age).toBe(31);
    expect(input.children_ages).toEqual([6, 4]);
    expect(input.parent_ages).toEqual([62]);
    expect(input.dependents_count).toBe(4);
    expect(input.gender).toBe("female");
    expect(input.smoker_status).toBe(false);
  });

  it("leaves optional assumptions out when blank", () => {
    expect(input.retirement_age).toBeUndefined();
    expect(input.immediate_expenses).toBeUndefined();
    expect(input.inflation_rate).toBeUndefined();
    expect(input.income_growth_pct).toBeUndefined();
  });

  it("turns the emergency buffer into rupees using monthly expenses", () => {
    expect(toAssessmentInput({ ...FILLED_FORM, bufferMonths: "6" }).immediate_expenses).toBe(300000);
  });

  it("sends a null spouse age when there is no spouse", () => {
    expect(toAssessmentInput({ ...FILLED_FORM, hasSpouse: "no" }).spouse_age).toBeNull();
  });

  it("converts goals to the engine's shape", () => {
    expect(input.future_goals).toEqual([
      { name: "College", cost_today: 1500000, years_away: 12, category: "education" },
      { name: "Wedding", cost_today: 2500000, years_away: 20, category: "marriage" },
    ]);
  });
});

describe("toRecommendRequest", () => {
  const request = toRecommendRequest(FILLED_FORM, toAssessmentInput(FILLED_FORM));

  it("describes the applicant for pricing", () => {
    expect(request.applicant).toEqual({
      age: 32,
      gender: "female",
      smoker: false,
      annual_income: 1800000,
      residency: "resident",
      spouse_working: true,
      spouse_annual_income: 600000,
      existing_individual_cover: 1000000,
      youngest_child_age: 4,
    });
  });

  it("uses no budget, no term and a balanced priority when left blank", () => {
    expect(request.monthly_budget).toBeNull();
    expect(request.preferred_term_years).toBeNull();
    expect(request.priority).toBe("balanced");
    expect(request.risk_appetite).toBe("medium");
  });

  it("passes budget, term and priority through when given", () => {
    const chosen = toRecommendRequest(
      { ...FILLED_FORM, monthlyBudget: "2500", preferredTerm: "25", priority: "lowest_cost" },
      toAssessmentInput(FILLED_FORM),
    );
    expect([chosen.monthly_budget, chosen.preferred_term_years, chosen.priority]).toEqual([2500, 25, "lowest_cost"]);
  });

  it("maps goals to recommendation goal types without duplicates", () => {
    const twoEducationGoals = {
      ...FILLED_FORM,
      goals: [
        ...FILLED_FORM.goals,
        { type: "education" as const, name: "Masters", cost: "1", years: "15" },
        { type: "other" as const, name: "Trip", cost: "1", years: "2" },
      ],
    };
    expect(toRecommendRequest(twoEducationGoals, toAssessmentInput(twoEducationGoals)).goal_types).toEqual([
      "child_education",
      "child_marriage",
    ]);
  });

  it("treats savings and investments as money that could be invested", () => {
    expect(request.liquid_investable).toBe(1000000);
  });

  it("has no youngest child or spouse income when the household has neither", () => {
    const single = { ...FILLED_FORM, hasSpouse: "no" as const, childAges: [], childrenCount: "0" };
    const { applicant } = toRecommendRequest(single, toAssessmentInput(single));
    expect(applicant.youngest_child_age).toBeNull();
    expect(applicant.spouse_working).toBe(false);
    expect(applicant.spouse_annual_income).toBe(0);
  });
});

describe("formFromSampleCustomer", () => {
  const detail = {
    profile: {
      profile_id: "CUS-1",
      full_name: "Asha Rao",
      gender: "female",
      residency_status: "nri",
      employment_type: "business_owner",
      smoker_status: "smoker",
      risk_appetite: "high",
      annual_income_inr: 2400000,
      monthly_household_expenses_inr: 70000,
      spouse: { age: 38, working: false, annual_income_inr: 0 },
      children_ages: [9, 5],
      parent_ages: [66],
      liabilities: [
        { loan_type: "home", outstanding_principal_inr: 3000000 },
        { loan_type: "car", outstanding_principal_inr: 400000 },
        { loan_type: "personal", outstanding_principal_inr: 100000 },
      ],
      individual_cover_inr: 0,
      employer_group_cover_inr: 1500000,
      liquid_savings_inr: 800000,
      market_investments_inr: 0,
      monthly_premium_budget_inr: 1200,
      preferred_policy_term_years: null,
    },
    assessment: {
      age: 41,
      annual_income: 2400000,
      annual_expenses: 840000,
      dependents_count: 4,
      outstanding_liabilities: 3500000,
      existing_cover: 1500000,
      eligible_assets: 800000,
      future_goals: [{ name: "Child education", cost_today: 1300000, years_away: 12, category: "education" }],
    },
    applicant: {
      age: 41,
      gender: "female",
      smoker: true,
      annual_income: 2400000,
      residency: "nri",
      spouse_working: false,
      spouse_annual_income: 0,
      existing_individual_cover: 0,
      youngest_child_age: 5,
    },
    recommend_request: { priority: "growth" },
  } as unknown as SampleCustomerDetail;
  const form = formFromSampleCustomer(detail);

  it("fills the profile answers", () => {
    expect(form).toMatchObject({
      age: "41",
      gender: "female",
      residency: "nri",
      employment: "business",
      smoker: "yes",
      income: "2400000",
      monthlyExpenses: "70000",
    });
  });

  it("fills the family answers", () => {
    expect(form).toMatchObject({
      hasSpouse: "yes",
      spouseAge: "38",
      spouseWorks: "no",
      childrenCount: "2",
      childAges: ["9", "5"],
      parentsCount: "1",
      parentAges: ["66"],
    });
  });

  it("splits home loans from other loans and leaves zero amounts blank", () => {
    expect(form).toMatchObject({
      homeLoan: "3000000",
      otherLoans: "500000",
      individualCover: "",
      groupCover: "1500000",
      marketInvestments: "",
    });
  });

  it("carries goals and preferences across", () => {
    expect(form.goals).toEqual([{ type: "education", name: "Child education", cost: "1300000", years: "12" }]);
    expect(form).toMatchObject({ risk: "high", priority: "growth", monthlyBudget: "1200", preferredTerm: "" });
  });

  it("produces a form that passes validation", () => {
    expect(validateAll(form).firstInvalidStep).toBe(-1);
  });

  it("marks a customer without a spouse as having none", () => {
    const single = formFromSampleCustomer({ ...detail, profile: { ...detail.profile, spouse: null } });
    expect(single).toMatchObject({ hasSpouse: "no", spouseAge: "", spouseWorks: "" });
  });
});
