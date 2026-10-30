import { describe, expect, it } from "vitest";
import { DEFAULT_TERM_YEARS, indicativePremiumPath } from "./indicative-premium";

describe("indicativePremiumPath", () => {
  it("builds the query the premium endpoint expects", () => {
    expect(indicativePremiumPath({ age: 30, gender: "male", sumAssured: 10_000_000, smoker: false, termYears: 30 })).toBe(
      "/premium/indicative?age=30&gender=male&sum_assured=10000000&smoker=false&term=30",
    );
  });

  it("falls back to the default term", () => {
    const path = indicativePremiumPath({ age: 41, gender: "female", sumAssured: 5_000_000, smoker: true });
    expect(path).toContain(`term=${DEFAULT_TERM_YEARS}`);
    expect(path).toContain("smoker=true");
  });

  it("gives different paths for different inputs so a changed input is a new request", () => {
    const base = { age: 30, gender: "male" as const, sumAssured: 1_000_000, smoker: false };
    expect(indicativePremiumPath(base)).not.toBe(indicativePremiumPath({ ...base, gender: "female" }));
  });
});
