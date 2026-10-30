import { describe, expect, it } from "vitest";
import {
  blankProduct,
  changedNeeds,
  changedUnderwriting,
  inrShort,
  productPatch,
  validateNeeds,
  validateProduct,
  validateUnderwriting,
} from "@/lib/admin-form";
import type { NeedsConfig, ProductConfig, UnderwritingConfig } from "@/types/admin";

const needs: NeedsConfig = {
  income_replacement_multiple_min: 10,
  income_replacement_multiple_max: 15,
  inflation_rate: 5.5,
  discount_rate: 7,
  deceased_expense_reduction_factor: 25,
  emergency_fund_months: 6,
};
const uw: UnderwritingConfig = {
  non_medical_sum_assured_limit: 10_000_000,
  non_medical_maximum_age: 35,
  tele_medical_threshold: 25_000_000,
  physical_medical_threshold: 50_000_000,
  stp_enabled: true,
  stp_maximum_sum_assured: 5_000_000,
  stp_maximum_age: 35,
  stp_allow_smokers: false,
};

describe("validateNeeds", () => {
  it("accepts the factory values", () => expect(validateNeeds(needs)).toEqual({}));
  it("flags a value outside its range and a minimum above the maximum", () => {
    expect(validateNeeds({ ...needs, inflation_rate: 40 }).inflation_rate).toBeDefined();
    expect(validateNeeds({ ...needs, income_replacement_multiple_min: 20 }).income_replacement_multiple_min).toMatch(/cannot be above/);
  });
});

describe("changedNeeds", () => {
  it("sends only what changed", () => expect(changedNeeds({ ...needs, inflation_rate: 8 }, needs)).toEqual({ inflation_rate: 8 }));
});

describe("validateUnderwriting", () => {
  it("accepts the factory values", () => expect(validateUnderwriting(uw)).toEqual({}));
  it("requires rising thresholds and an STP limit inside the non-medical limit", () => {
    expect(validateUnderwriting({ ...uw, tele_medical_threshold: 5_000_000 }).tele_medical_threshold).toBeDefined();
    expect(validateUnderwriting({ ...uw, physical_medical_threshold: 20_000_000 }).physical_medical_threshold).toBeDefined();
    expect(validateUnderwriting({ ...uw, stp_maximum_sum_assured: 20_000_000 }).stp_maximum_sum_assured).toBeDefined();
    expect(validateUnderwriting({ ...uw, stp_maximum_age: 50 }).stp_maximum_age).toBeDefined();
  });
  it("lists only changed fields", () => expect(changedUnderwriting({ ...uw, stp_enabled: false }, uw)).toEqual({ stp_enabled: false }));
});

describe("validateProduct", () => {
  const ok: ProductConfig = { ...blankProduct(), product_id: "PRD-GOLD01", product_name: "Gold Term" };
  it("accepts a complete product", () => expect(validateProduct(ok, [], true)).toEqual({}));
  it("checks the ID format and uniqueness only when creating", () => {
    expect(validateProduct({ ...ok, product_id: "gold" }, [], true).product_id).toBeDefined();
    expect(validateProduct(ok, ["PRD-GOLD01"], true).product_id).toMatch(/already used/);
    expect(validateProduct({ ...ok, product_id: "x" }, [], false).product_id).toBeUndefined();
  });
  it("catches the range and rate mistakes", () => {
    expect(validateProduct({ ...ok, minimum_entry_age: 60 }).minimum_entry_age).toBeDefined();
    expect(validateProduct({ ...ok, minimum_tenure: 50 }).minimum_tenure).toBeDefined();
    expect(validateProduct({ ...ok, minimum_sum_assured: 2e9 }).minimum_sum_assured).toBeDefined();
    expect(validateProduct({ ...ok, base_rate_per_1000: 0 }).base_rate_per_1000).toBeDefined();
    expect(validateProduct({ ...ok, smoker_loading_percentage: 400 }).smoker_loading_percentage).toBeDefined();
    expect(validateProduct({ ...ok, gender_discount_factors: { male: 1, female: 3 } }).female).toBeDefined();
  });
  it("does not ask a ULIP for a rate", () =>
    expect(validateProduct({ ...ok, category: "ULIP", base_rate_per_1000: null }).base_rate_per_1000).toBeUndefined());
});

describe("productPatch", () => {
  const saved: ProductConfig = { ...blankProduct(), product_id: "PRD-GOLD01", product_name: "Gold Term", maximum_income_multiple: 20 };
  it("includes only changed fields", () => {
    expect(productPatch({ ...saved, base_rate_per_1000: 2, active: false }, saved)).toEqual({ base_rate_per_1000: 2, active: false });
  });
  it("turns a cleared income multiple into the clear flag", () => {
    expect(productPatch({ ...saved, maximum_income_multiple: null }, saved)).toEqual({ clear_income_multiple: true });
  });
  it("sends only the gender factor that changed, and riders when the set differs", () => {
    expect(productPatch({ ...saved, gender_discount_factors: { male: 1, female: 0.8 }, allowed_riders: ["RDR-1"] }, saved)).toEqual({
      gender_discount_factors: { female: 0.8 },
      allowed_riders: ["RDR-1"],
    });
  });
});

describe("inrShort", () => {
  it("uses crore and lakh", () => {
    expect(inrShort(12_500_000)).toBe("₹1.25 Cr");
    expect(inrShort(4_500_000)).toBe("₹45 L");
    expect(inrShort(8500)).toBe("₹8,500");
    expect(inrShort(null)).toBe("—");
  });
});
