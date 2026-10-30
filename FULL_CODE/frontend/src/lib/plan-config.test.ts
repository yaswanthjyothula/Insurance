import { describe, expect, it } from "vitest";
import type { PackProduct, Quote, SelectedPlan } from "@/types/api";
import { monthlyTotal, paymentLabel, riderCoverLimit, toggleRider, ulipMultiples, upsertPlan } from "./plan-config";

const plan = (id: string, instalment: number, option = "regular"): SelectedPlan => ({
  request: {
    product_id: id,
    applicant: {
      age: 30,
      gender: "male",
      smoker: false,
      annual_income: 1,
      residency: "resident",
      spouse_working: false,
      spouse_annual_income: 0,
      existing_individual_cover: 0,
    },
    payment_option: option,
    mode: "monthly",
    riders: [],
  },
  quote: { total_instalment: instalment, payment_option: option } as Quote,
  fit_summary: "",
});

describe("paymentLabel", () => {
  it("explains each pay option in words", () => {
    expect(paymentLabel("regular")).toMatch(/every year/);
    expect(paymentLabel("limited_10")).toBe("Pay for 10 years only");
    expect(paymentLabel("single")).toBe("Pay once");
  });
});

describe("riderCoverLimit", () => {
  it("is the lower of the rider maximum and the share of base cover", () => {
    expect(riderCoverLimit(10_000_000, 100, 5_000_000)).toBe(5_000_000);
    expect(riderCoverLimit(2_000_000, 100, 5_000_000)).toBe(2_000_000);
    expect(riderCoverLimit(null, 50, 5_000_000)).toBe(2_500_000);
  });
});

describe("toggleRider", () => {
  it("adds a rider once and removes it on the second toggle", () => {
    const added = toggleRider([], "R1", 100_000);
    expect(added).toEqual([{ rider_id: "R1", sum_assured: 100_000 }]);
    expect(toggleRider(added, "R1", 100_000)).toEqual([]);
  });
});

describe("ulipMultiples", () => {
  const product = { sa_multiple_of_annual_premium: { entry_age_upto_44: [10, 15], entry_age_45_plus: [7] } } as unknown as PackProduct;
  it("switches table at age 45", () => {
    expect(ulipMultiples(product, 44)).toEqual([10, 15]);
    expect(ulipMultiples(product, 45)).toEqual([7]);
  });
});

describe("selection helpers", () => {
  it("keeps one plan per product", () => {
    const next = upsertPlan([plan("A", 100), plan("B", 200)], plan("A", 150));
    expect(next.map((p) => p.request.product_id).sort()).toEqual(["A", "B"]);
    expect(next.find((p) => p.request.product_id === "A")?.quote.total_instalment).toBe(150);
  });
  it("does not count single-premium plans in the monthly total", () => {
    expect(monthlyTotal([plan("A", 100), plan("B", 5000, "single")])).toBe(100);
  });
});
