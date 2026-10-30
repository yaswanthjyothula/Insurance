import { describe, expect, it } from "vitest";
import type { ProductFit, Quote, SelectedPlan } from "@/types/api";
import { bestIds, compareGroup, coverOf, MAX_COMPARE, monthlyOf, toggleCompare, withSelectedQuotes } from "./compare";

const fit = (id: string, cover: number, monthly: number, option = "regular"): ProductFit =>
  ({
    product_id: id,
    eligible: true,
    match_percent: 50,
    quote: { sum_assured: cover, total_instalment: monthly, payment_option: option } as Quote,
  }) as ProductFit;

describe("toggleCompare", () => {
  it("adds, removes, and stops at the limit", () => {
    expect(toggleCompare([], "a")).toEqual(["a"]);
    expect(toggleCompare(["a", "b"], "a")).toEqual(["b"]);
    const full = Array.from({ length: MAX_COMPARE }, (_, i) => `p${i}`);
    expect(toggleCompare(full, "extra")).toEqual(full);
  });
});

describe("bestIds", () => {
  const fits = [fit("a", 5_000_000, 900), fit("b", 8_000_000, 700), fit("c", 8_000_000, 1200)];
  it("finds the lowest price and marks tied covers", () => {
    expect(bestIds(fits, monthlyOf, false)).toEqual(["b"]);
    expect(bestIds(fits, coverOf, true)).toEqual(["b", "c"]);
  });
  it("marks nothing when every value is the same or only one is known", () => {
    expect(bestIds([fit("a", 1, 100), fit("b", 1, 100)], monthlyOf, false)).toEqual([]);
    expect(bestIds([fit("a", 1, 100), fit("b", 1, 5000, "single")], monthlyOf, false)).toEqual([]);
  });
});

describe("compareGroup", () => {
  it("drops duplicates and keeps at most the limit", () => {
    expect(compareGroup(["a", "b", "a"])).toEqual(["a", "b"]);
    expect(compareGroup(["a", "b", "c", "d"])).toHaveLength(MAX_COMPARE);
  });
});

describe("withSelectedQuotes", () => {
  it("uses the customer's configuration for selected plans only", () => {
    const chosen = { request: { product_id: "b" }, quote: { sum_assured: 9_000_000 } } as SelectedPlan;
    const out = withSelectedQuotes([fit("a", 1, 100), fit("b", 2, 200)], [chosen]);
    expect(out[0].quote?.sum_assured).toBe(1);
    expect(out[1].quote?.sum_assured).toBe(9_000_000);
  });
});
