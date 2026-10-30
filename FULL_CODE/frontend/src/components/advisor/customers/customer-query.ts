import type { CustomerSort, GapBandKey, RiskAppetite } from "@/types/advisor";

export interface CustomerQuery {
  q: string;
  band: GapBandKey | "";
  risk: RiskAppetite | "";
  sort: CustomerSort;
  order: "asc" | "desc";
  page: number;
}

export const DEFAULT_QUERY: CustomerQuery = { q: "", band: "", risk: "", sort: "name", order: "asc", page: 1 };
export const PAGE_SIZE = 10;

/** The URL query the API expects. Empty filters are left out. */
export function toSearchParams(query: CustomerQuery): string {
  const params = new URLSearchParams({ sort: query.sort, order: query.order, page: String(query.page), page_size: String(PAGE_SIZE) });
  if (query.q.trim()) params.set("q", query.q.trim().slice(0, 80));
  if (query.band) params.set("band", query.band);
  if (query.risk) params.set("risk", query.risk);
  return params.toString();
}

/** Changing a search, filter or sort starts again from the first page; changing the page keeps them. */
export function withChange(query: CustomerQuery, change: Partial<CustomerQuery>): CustomerQuery {
  const resetsPage = Object.keys(change).some((key) => key !== "page");
  return { ...query, ...change, page: change.page ?? (resetsPage ? 1 : query.page) };
}

export function rangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) return "No customers";
  const first = (page - 1) * pageSize + 1;
  return `${first}–${Math.min(total, page * pageSize)} of ${total}`;
}
