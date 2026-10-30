"use client";

import { ArrowDownAZ, ArrowUpAZ, Search, X } from "lucide-react";
import type { CustomerQuery } from "@/components/advisor/customers/customer-query";
import type { CustomerSort, GapBandKey, RiskAppetite } from "@/types/advisor";

const BANDS: { key: GapBandKey | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "large", label: "Large gap" },
  { key: "moderate", label: "Moderate" },
  { key: "small", label: "Small" },
  { key: "covered", label: "Covered" },
];

const SORTS: { key: CustomerSort; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "gap", label: "Protection gap" },
  { key: "income", label: "Income" },
  { key: "age", label: "Age" },
];

const FIELD = "rounded-xl border border-[#E8E5F0] bg-white px-3 py-2 text-sm text-[#24212B] transition-colors hover:border-[#D2C8F5]";

interface Props {
  search: string;
  onSearch: (value: string) => void;
  query: CustomerQuery;
  onChange: (change: Partial<CustomerQuery>) => void;
}

export function CustomerFilters({ search, onSearch, query, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A59FB5]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by name, city or occupation"
            aria-label="Search customers"
            maxLength={80}
            className={`${FIELD} w-full pl-9 pr-9`}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8A849A] hover:text-[#24212B]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Risk appetite"
            value={query.risk}
            onChange={(event) => onChange({ risk: event.target.value as RiskAppetite | "" })}
            className={FIELD}
          >
            <option value="">Any risk appetite</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select>
          <select
            aria-label="Sort by"
            value={query.sort}
            onChange={(event) => onChange({ sort: event.target.value as CustomerSort })}
            className={FIELD}
          >
            {SORTS.map((sort) => (
              <option key={sort.key} value={sort.key}>
                Sort: {sort.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange({ order: query.order === "asc" ? "desc" : "asc" })}
            aria-label={query.order === "asc" ? "Ascending. Switch to descending" : "Descending. Switch to ascending"}
            className={`${FIELD} px-2.5`}
          >
            {query.order === "asc" ? (
              <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div role="group" aria-label="Protection gap" className="flex flex-wrap gap-2">
        {BANDS.map((band) => {
          const on = query.band === band.key;
          return (
            <button
              key={band.key || "all"}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ band: band.key })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 motion-reduce:active:scale-100 ${
                on
                  ? "border-[#171B3D] bg-[#171B3D] text-white"
                  : "border-[#E8E5F0] bg-white text-[#6F6A7C] hover:border-[#D2C8F5] hover:text-[#24212B]"
              }`}
            >
              {band.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
