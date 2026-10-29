/**
 * Indicative yearly premium for a non-smoker male, calibrated to the only official price points we have:
 * ICICI's published first-year samples for ₹1 Cr cover (age 30 -> ₹11,342, 40 -> ₹18,225, 50 -> ₹34,532).
 * Same maths as the backend so the page and the ranking agree. Real prices come from the insurer's own quote.
 */
const ANCHORS: [number, number][] = [[30, 11342], [40, 18225], [50, 34532]];
export const SMOKER_FACTOR = 1.5;

export function indicativeAnnualPremium(sumAssured: number, age: number, smoker: boolean): number {
  const [lo, hi] = age <= ANCHORS[1][0] ? [ANCHORS[0], ANCHORS[1]] : [ANCHORS[1], ANCHORS[2]];
  const slope = (Math.log(hi[1]) - Math.log(lo[1])) / (hi[0] - lo[0]);
  const perCrore = lo[1] * Math.exp(slope * (age - lo[0]));
  return Math.round(perCrore * (sumAssured / 10_000_000) * (smoker ? SMOKER_FACTOR : 1));
}
