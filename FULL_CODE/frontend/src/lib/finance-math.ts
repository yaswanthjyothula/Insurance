/** Pure money formulas shared by the calculator tools. Rates are percentages a year (8.5 means 8.5%). */

export interface BalancePoint {
  year: number;
  balance: number;
}

/** Equal monthly instalment that repays `principal` over `years` at a fixed yearly rate. */
export function monthlyEmi(principal: number, annualRatePct: number, years: number): number {
  const months = years * 12;
  const monthlyRate = annualRatePct / 1200;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * growth) / (growth - 1);
}

/** What is still owed at the end of each year of the loan, starting with the full principal at year 0. */
export function amortisationBalances(principal: number, annualRatePct: number, years: number): BalancePoint[] {
  const emi = monthlyEmi(principal, annualRatePct, years);
  const monthlyRate = annualRatePct / 1200;
  const points: BalancePoint[] = [{ year: 0, balance: principal }];
  let balance = principal;
  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyRate) - emi;
    if (month % 12 === 0) points.push({ year: month / 12, balance: Math.max(0, balance) });
  }
  return points;
}

/** A cost or amount grown at a steady yearly rate. Used for goal costs (inflation) and lump sums (returns). */
export function futureValueOfGoal(amountToday: number, annualRatePct: number, years: number): number {
  return amountToday * Math.pow(1 + annualRatePct / 100, years);
}

/** The amount in each year from now (year 0) to `years`, growing at a steady yearly rate. */
export function inflationProjection(amountToday: number, annualRatePct: number, years: number): number[] {
  return Array.from({ length: years + 1 }, (_, year) => futureValueOfGoal(amountToday, annualRatePct, year));
}

/** Value after `periods` deposits made at the START of each period, each earning `periodRatePct` per period. */
export function annuityDueFutureValue(payment: number, periodRatePct: number, periods: number): number {
  const rate = periodRatePct / 100;
  if (rate === 0) return payment * periods;
  return payment * ((Math.pow(1 + rate, periods) - 1) / rate) * (1 + rate);
}

/** Future value of a monthly SIP, first instalment at the start of month 1. */
export function sipFutureValue(monthlyAmount: number, annualReturnPct: number, years: number): number {
  return annuityDueFutureValue(monthlyAmount, annualReturnPct / 12, years * 12);
}

/** Monthly saving that grows to `target` over `years`: the inverse of {@link sipFutureValue}. */
export function monthlySavingNeeded(target: number, annualReturnPct: number, years: number): number {
  return target / sipFutureValue(1, annualReturnPct, years);
}
