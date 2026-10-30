import { describe, expect, it } from "vitest";
import type { ProductFit, Quote } from "@/types/api";
import { bestIds, coverOf, MAX_COMPARE, monthlyOf, toggleCompare } from "./compare";

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
