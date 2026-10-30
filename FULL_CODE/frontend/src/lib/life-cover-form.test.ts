import { describe, expect, it } from "vitest";
import { BLANK_LIFE_COVER_FORM, parseAgeList, toAssessmentInput, validateLifeCoverForm, type LifeCoverForm } from "./life-cover-form";

const FILLED: LifeCoverForm = { ...BLANK_LIFE_COVER_FORM, age: "32", income: "18,00,000", expenses: "720000", dependents: "2" };

describe("parseAgeList", () => {
  it("splits on commas and spaces", () => {
    expect(parseAgeList("3, 7 12")).toEqual([3, 7, 12]);
  });

  it("returns an empty list for blank text", () => {
    expect(parseAgeList("  ")).toEqual([]);
  });

  it("marks anything that is not a whole number as NaN", () => {
    expect(parseAgeList("5, x, 2.5").map(Number.isNaN)).toEqual([false, true, true]);
  });
});

describe("validateLifeCoverForm", () => {
  it("asks for the required fields on a blank form", () => {
    expect(Object.keys(validateLifeCoverForm(BLANK_LIFE_COVER_FORM)).sort()).toEqual(["age", "dependents", "expenses", "income"]);
  });

  it("accepts a form with only the required fields", () => {
    expect(validateLifeCoverForm(FILLED)).toEqual({});
  });

  it("flags a malformed children list", () => {
    expect(validateLifeCoverForm({ ...FILLED, childrenAges: "3, abc" }).childrenAges).toBeDefined();
  });

  it("flags more parents than the backend accepts", () => {
    expect(validateLifeCoverForm({ ...FILLED, parentAges: "60, 61, 62, 63, 64" }).parentAges).toBeDefined();
  });
});

describe("toAssessmentInput", () => {
  it("reads amounts typed with commas and leaves optional money fields at zero", () => {
    const input = toAssessmentInput(FILLED);
    expect(input.annual_income).toBe(1_800_000);
    expect(input.existing_cover).toBe(0);
    expect(input.spouse_age).toBeNull();
    expect(input.support_horizon_years).toBeUndefined();
  });

  it("carries the family ages and gender", () => {
    const input = toAssessmentInput({ ...FILLED, gender: "female", spouseAge: "30", childrenAges: "3, 7", parentAges: "62" });
    expect(input).toMatchObject({ gender: "female", spouse_age: 30, children_ages: [3, 7], parent_ages: [62] });
  });
});
