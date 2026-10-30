import { describe, expect, it } from "vitest";
import {
  amortisationBalances,
  annuityDueFutureValue,
  futureValueOfGoal,
  inflationProjection,
  monthlyEmi,
  monthlySavingNeeded,
  sipFutureValue,
} from "./finance-math";

describe("monthlyEmi", () => {
  it("matches the standard EMI for 50 lakh at 8.5% over 20 years", () => {
    expect(monthlyEmi(5_000_000, 8.5, 20)).toBeCloseTo(43391.16, 1);
  });

  it("splits the principal evenly when the rate is zero", () => {
    expect(monthlyEmi(1_200_000, 0, 10)).toBe(10_000);
  });
});

describe("amortisationBalances", () => {
  it("starts at the principal and ends at zero", () => {
    const points = amortisationBalances(5_000_000, 8.5, 20);
    expect(points[0]).toEqual({ year: 0, balance: 5_000_000 });
    expect(points).toHaveLength(21);
    expect(points[20].balance).toBeCloseTo(0, 4);
  });

  it("falls slowly at first because early instalments are mostly interest", () => {
    const [start, first, second] = amortisationBalances(5_000_000, 8.5, 20);
    expect(start.balance - first.balance).toBeLessThan(first.balance - second.balance);
  });
});

describe("futureValueOfGoal", () => {
  it("compounds a cost at the yearly rate", () => {
    expect(futureValueOfGoal(2_500_000, 8, 14)).toBeCloseTo(7_342_984, 0);
  });

  it("leaves the amount unchanged at zero years", () => {
    expect(futureValueOfGoal(100, 7, 0)).toBe(100);
  });
});

describe("inflationProjection", () => {
  it("returns year 0 through the last year", () => {
    const series = inflationProjection(1000, 10, 3);
    expect(series).toHaveLength(4);
    expect(series[0]).toBe(1000);
    expect(series[3]).toBeCloseTo(1331, 6);
  });
});

describe("annuityDueFutureValue", () => {
  it("adds up plain deposits when there is no growth", () => {
    expect(annuityDueFutureValue(500, 0, 12)).toBe(6000);
  });

  it("grows each deposit for one extra period compared with an ordinary annuity", () => {
    expect(annuityDueFutureValue(100, 10, 2)).toBeCloseTo(231, 6);
  });
});

describe("sipFutureValue", () => {
  it("gives about 1 crore for 10,000 a month over 20 years at 12%", () => {
    expect(sipFutureValue(10_000, 12, 20)).toBeCloseTo(9_991_479, 0);
  });
});

describe("monthlySavingNeeded", () => {
  it("reverses sipFutureValue", () => {
    const target = sipFutureValue(8_000, 9, 15);
    expect(monthlySavingNeeded(target, 9, 15)).toBeCloseTo(8_000, 6);
  });

  it("divides the target by the number of months when the return is zero", () => {
    expect(monthlySavingNeeded(1_200_000, 0, 10)).toBe(10_000);
  });
});
