import type { ProductFit, SelectedPlan } from "@/types/api";

export const MAX_COMPARE = 3;

/** Adds or removes a product from the comparison. A full list ignores new additions instead of dropping an old one silently. */
export function toggleCompare(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= MAX_COMPARE ? ids : [...ids, id];
}

/** Starts a comparison from a group of plans (the recommended basket or the selection), keeping the first three. */
export function compareGroup(ids: string[]): string[] {
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}

/** A selected plan is compared as the customer configured it, not as the engine first suggested it. */
export function withSelectedQuotes(fits: ProductFit[], selection: SelectedPlan[]): ProductFit[] {
  return fits.map((f) => {
    const chosen = selection.find((s) => s.request.product_id === f.product_id);
    return chosen ? { ...f, quote: chosen.quote } : f;
  });
}

type Pick = (fit: ProductFit) => number | null;

/** Ids holding the best value of a row, so ties are all marked. `higher` says whether bigger is better. */
export function bestIds(fits: ProductFit[], pick: Pick, higher: boolean): string[] {
  const values = fits.map((f) => ({ id: f.product_id, v: pick(f) })).filter((x): x is { id: string; v: number } => x.v !== null);
  if (values.length < 2) return [];
  const target = higher ? Math.max(...values.map((x) => x.v)) : Math.min(...values.map((x) => x.v));
  if (values.every((x) => x.v === target)) return [];
  return values.filter((x) => x.v === target).map((x) => x.id);
}

export const monthlyOf = (f: ProductFit): number | null =>
  f.quote && f.quote.payment_option !== "single" ? f.quote.total_instalment : null;
export const coverOf = (f: ProductFit): number | null => f.quote?.sum_assured ?? null;
export const matchOf = (f: ProductFit): number | null => (f.eligible ? f.match_percent : null);
