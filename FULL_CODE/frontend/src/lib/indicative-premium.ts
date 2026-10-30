import type { Gender } from "@/types/api";

export interface IndicativePremiumParams {
  age: number;
  gender: Gender;
  sumAssured: number;
  smoker: boolean;
  termYears?: number;
}

/** Shape of GET /premium/indicative. `annual_premium` is null when the pack does not offer cover at that age. */
export interface IndicativePremiumResponse {
  annual_premium: number | null;
  available: boolean;
}

export const DEFAULT_TERM_YEARS = 30;

/** Request path for a plain level-term quote. Built as a string so it can double as the cache key of a request. */
export function indicativePremiumPath({
  age,
  gender,
  sumAssured,
  smoker,
  termYears = DEFAULT_TERM_YEARS,
}: IndicativePremiumParams): string {
  const query = new URLSearchParams({
    age: String(age),
    gender,
    sum_assured: String(sumAssured),
    smoker: String(smoker),
    term: String(termYears),
  });
  return `/premium/indicative?${query.toString()}`;
}
