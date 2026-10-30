"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, SearchX, Users } from "lucide-react";
import { m } from "motion/react";
import { formatInrCompact, initials } from "@/components/advisor/format";
import { rise, stagger } from "@/components/advisor/motion";
import { EmptyState, Skeleton } from "@/components/advisor/dashboard/parts";
import { CustomerFilters } from "@/components/advisor/customers/CustomerFilters";
import { DEFAULT_QUERY, PAGE_SIZE, rangeLabel, withChange, type CustomerQuery } from "@/components/advisor/customers/customer-query";
import { GapBadge } from "@/components/advisor/customers/GapBadge";
import { useCustomers } from "@/components/advisor/customers/useCustomers";
import type { CustomerSummary } from "@/types/advisor";

function Row({ customer }: { customer: CustomerSummary }) {
  return (
    <m.li variants={rise}>
      <Link
        href={`/advisor/customers/${encodeURIComponent(customer.profile_id)}`}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-[#E8E5F0] hover:bg-[#FBFAFE] md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-4"
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F0FF] text-xs font-bold text-[#6240E6]"
            aria-hidden="true"
          >
            {initials(customer.full_name)}
          </span>
          <span className="block min-w-0">
            <span className="block truncate text-sm font-bold text-[#24212B]">{customer.full_name}</span>
            <span className="block truncate text-xs text-[#6F6A7C]">
              {customer.age} · {customer.city}
            </span>
          </span>
        </span>
        <span className="md:hidden">
          <GapBadge band={customer.gap_band} />
        </span>
        <span className="hidden truncate text-sm text-[#24212B] md:block">{customer.occupation}</span>
        <span className="hidden text-sm tabular-nums text-[#24212B] md:block">{formatInrCompact(customer.annual_income_inr)}</span>
        <span className="hidden text-sm tabular-nums text-[#24212B] md:block">
          {customer.net_coverage_gap_inr > 0 ? formatInrCompact(customer.net_coverage_gap_inr) : "None"}
        </span>
        <span className="hidden justify-self-end md:block">
          <GapBadge band={customer.gap_band} />
        </span>
        <span className="basis-full truncate text-xs text-[#8A849A] md:hidden">
          {customer.occupation} · {formatInrCompact(customer.annual_income_inr)} income
        </span>
      </Link>
    </m.li>
  );
}

export function CustomersPage() {
  const [query, setQuery] = useState<CustomerQuery>(DEFAULT_QUERY);
  const [search, setSearch] = useState("");
  const { data, loading, error, reload } = useCustomers(query);

  // The query only follows the search box once typing pauses, so each keystroke does not hit the server
  useEffect(() => {
    const timer = setTimeout(() => setQuery((current) => (current.q === search ? current : withChange(current, { q: search }))), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const change = (patch: Partial<CustomerQuery>) => setQuery((current) => withChange(current, patch));
  const filtered = Boolean(query.q || query.band || query.risk);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">My customers</h1>
        <p className="m-0 text-sm text-[#6F6A7C]">
          The customers assigned to you, with how much cover each still needs. Sample data from the problem pack.
        </p>
      </header>

      <CustomerFilters search={search} onSearch={setSearch} query={query} onChange={change} />

      <section
        aria-label="Customers"
        className="rounded-2xl border border-[#E8E5F0] bg-white p-2 shadow-[0_1px_2px_rgba(23,27,61,0.04)] sm:p-3"
      >
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-wide text-[#A59FB5] md:grid">
          <span>Customer</span>
          <span>Occupation</span>
          <span>Income</span>
          <span>Cover needed</span>
          <span className="w-[100px] text-right">Gap</span>
        </div>

        {error ? (
          <div role="alert" className="space-y-3 p-8 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
            <p className="m-0 text-sm font-semibold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </div>
        ) : !data ? (
          <div role="status" aria-label="Loading customers" className="space-y-2 p-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[60px]" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-4">
            {filtered ? (
              <EmptyState icon={SearchX} title="No customers match" hint="Try a different search, or clear a filter." />
            ) : (
              <EmptyState icon={Users} title="No customers assigned yet" hint="Customers assigned to you will appear here." />
            )}
          </div>
        ) : (
          <m.ul
            key={`${data.page}-${data.total}-${query.sort}-${query.order}`}
            variants={stagger}
            initial="hidden"
            animate="show"
            className={`m-0 list-none space-y-1 p-0 transition-opacity ${loading ? "opacity-60" : ""}`}
            aria-busy={loading}
          >
            {data.items.map((customer) => (
              <Row key={customer.profile_id} customer={customer} />
            ))}
          </m.ul>
        )}
      </section>

      {data && data.total > 0 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          <p className="m-0 text-xs text-[#6F6A7C]" aria-live="polite">
            {rangeLabel(data.page, PAGE_SIZE, data.total)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => change({ page: data.page - 1 })}
              disabled={data.page <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E8E5F0] bg-white px-3 py-2 text-xs font-bold text-[#24212B] transition-colors hover:border-[#D2C8F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </button>
            <span className="text-xs tabular-nums text-[#6F6A7C]">
              Page {data.page} of {data.pages}
            </span>
            <button
              type="button"
              onClick={() => change({ page: data.page + 1 })}
              disabled={data.page >= data.pages}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E8E5F0] bg-white px-3 py-2 text-xs font-bold text-[#24212B] transition-colors hover:border-[#D2C8F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
