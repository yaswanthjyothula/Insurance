"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, Download, Search } from "lucide-react";
import { m } from "motion/react";
import { AnimatedNumber } from "@/components/advisor/AnimatedNumber";
import { Panel, EmptyState, Skeleton } from "@/components/advisor/dashboard/parts";
import { EASE } from "@/components/advisor/motion";
import { inrShort } from "@/lib/admin-form";
import { downloadFile } from "@/lib/admin-download";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { formatIst } from "@/lib/time";
import type { Analytics, Lead, TopProduct } from "@/types/admin";
import { BarChart3 } from "lucide-react";

const CATEGORY_TONE: Record<string, string> = {
  "Term Life": "bg-[#3D55E0]",
  ULIP: "bg-[#8B5CF6]",
  Endowment: "bg-[#14B8A6]",
  "Whole Life": "bg-[#F59E0B]",
  Other: "bg-[#A59FB5]",
};

function Kpi({ label, value, hint, money }: { label: string; value: number | null; hint?: string; money?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E8E5F0] bg-white p-4">
      <p className="m-0 text-xs font-semibold text-[#6F6A7C]">{label}</p>
      <p className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-[#0E1330]">
        {value === null ? <span className="text-[#C4BFD3]">—</span> : money ? inrShort(value) : <AnimatedNumber value={value} />}
      </p>
      {hint && <p className="m-0 mt-1 text-xs text-[#8A849A]">{hint}</p>}
    </div>
  );
}

function Share({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <div>
      <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">{title}</p>
      {total === 0 ? (
        <p className="m-0 text-sm text-[#8A849A]">No data yet.</p>
      ) : (
        <>
          <div
            className="flex h-3 overflow-hidden rounded-full bg-[#F1EDFC]"
            role="img"
            aria-label={Object.entries(data)
              .map(([k, v]) => `${k} ${Math.round((v / total) * 100)}%`)
              .join(", ")}
          >
            {Object.entries(data).map(([k, v]) => (
              <m.span
                key={k}
                className={`h-full origin-left ${CATEGORY_TONE[k] ?? CATEGORY_TONE.Other}`}
                style={{ width: `${(v / total) * 100}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            ))}
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-[#6F6A7C]">
            {Object.entries(data).map(([k, v]) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${CATEGORY_TONE[k] ?? CATEGORY_TONE.Other}`} aria-hidden="true" />
                {k} {Math.round((v / total) * 100)}% <span className="text-[#A59FB5]">({v})</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TopList({ title, items }: { title: string; items: TopProduct[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Panel title={title}>
      {items.length === 0 ? (
        <p className="m-0 text-sm text-[#8A849A]">Nothing recorded yet.</p>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((p, i) => (
            <li key={p.product_id}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-[#0E1330]">
                  {p.product_name} <span className="text-xs font-normal text-[#8A849A]">{p.category}</span>
                </span>
                <span className="tabular-nums text-[#6F6A7C]">{p.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F1EDFC]">
                <m.div
                  className="h-full origin-left rounded-full bg-[#3D55E0]"
                  style={{ width: `${(p.count / max) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.05 * i }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function LeadsTable() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchFromAPI<Lead[]>(`/admin/leads?q=${encodeURIComponent(q.trim())}&limit=100`, { signal: controller.signal })
        .then((r) => {
          setRows(r);
          setError(null);
        })
        .catch((f: unknown) => !controller.signal.aborted && setError(errorMessage(f, "We couldn't load the leads.")));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const exportAs = async (format: "csv" | "json") => {
    setExportError(null);
    try {
      await downloadFile(`/admin/leads/export?format=${format}`, `lifesure-leads.${format}`);
    } catch (failure) {
      setExportError(errorMessage(failure, "The export failed."));
    }
  };

  return (
    <Panel
      title="Recent leads"
      aside={
        <div className="flex gap-2">
          {(["csv", "json"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => exportAs(f)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D3E8] bg-white px-3 py-1.5 text-xs font-bold text-[#3D55E0] hover:border-[#3D55E0]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export {f.toUpperCase()}
            </button>
          ))}
        </div>
      }
    >
      <p className="m-0 mb-4 text-sm text-[#6F6A7C]">
        Signed-in customers who completed an assessment, with the answers they gave. Exports are meant for the CRM and are recorded in the
        audit log.
      </p>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A59FB5]" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, ID or assessment"
          aria-label="Search leads"
          className="w-full rounded-xl border border-[#D9D3E8] py-2 pl-9 pr-3 text-sm"
        />
      </div>
      {exportError && (
        <p role="alert" className="m-0 mb-3 text-sm font-semibold text-rose-700">
          {exportError}
        </p>
      )}
      {error ? (
        <p role="alert" className="m-0 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : !rows ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <EmptyState
          title={q ? "No lead matches" : "No leads yet"}
          hint={q ? "Try a different search." : "A lead appears when a signed-in customer completes the needs assessment."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E5F0] text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Income</th>
                <th className="px-3 py-2">Cover gap</th>
                <th className="px-3 py-2">Recommended</th>
                <th className="w-8 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.assessment_id}>
                  <tr
                    className="cursor-pointer border-b border-[#F1EDFC] hover:bg-[#FBFAFF]"
                    onClick={() => setOpen(open === r.assessment_id ? null : r.assessment_id)}
                  >
                    <td className="px-3 py-3">
                      <span className="block font-bold text-[#0E1330]">{r.customer || "Customer"}</span>
                      <span className="block text-xs text-[#8A849A]">{r.customer_id || r.contact}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#6F6A7C]">{formatIst(r.saved_at)}</td>
                    <td className="px-3 py-3 tabular-nums">{inrShort(r.annual_income)}</td>
                    <td className="px-3 py-3 tabular-nums">{inrShort(r.coverage_gap)}</td>
                    <td className="px-3 py-3 font-bold tabular-nums text-[#3D55E0]">{inrShort(r.recommended_cover)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-expanded={open === r.assessment_id}
                        aria-label={`Details for ${r.customer}`}
                        className="text-[#8A849A]"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${open === r.assessment_id ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                  {open === r.assessment_id && (
                    <tr className="bg-[#FBFAFF]">
                      <td colSpan={6} className="px-3 py-4">
                        <dl className="m-0 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {[
                            ["Age", r.age],
                            ["Dependents", r.dependents],
                            ["Loans", inrShort(r.outstanding_liabilities)],
                            ["Existing cover", inrShort(r.existing_cover)],
                            ["Total need", inrShort(r.total_need)],
                            ["Config version", r.config_version || "—"],
                            ["Assessment", r.assessment_id.slice(0, 8)],
                          ].map(([k, v]) => (
                            <div key={String(k)}>
                              <dt className="text-xs font-semibold text-[#8A849A]">{k}</dt>
                              <dd className="m-0 mt-0.5 text-sm font-bold tabular-nums text-[#0E1330]">{v ?? "—"}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<Analytics>("/admin/analytics", { signal: controller.signal })
      .then(setData)
      .catch((f: unknown) => !controller.signal.aborted && setError(errorMessage(f, "We couldn't load the analytics.")));
    return () => controller.abort();
  }, []);

  if (error)
    return (
      <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
        {error}
      </p>
    );
  if (!data)
    return (
      <div role="status" aria-label="Loading analytics" className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );

  const top = Math.max(1, ...data.funnel.map((f) => f.count));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Average coverage gap"
          value={data.average_coverage_gap}
          money
          hint={data.assessments_with_gap ? `${data.assessments_with_gap} assessments` : "No assessments yet"}
        />
        <Kpi
          label="Average coverage purchased"
          value={data.average_coverage_purchased}
          money
          hint={data.plans_with_cover ? `${data.plans_with_cover} chosen plans` : "No plans chosen yet"}
        />
        <Kpi
          label="Assessment drop-off"
          value={data.drop_off_percent}
          hint={data.drop_off_percent === null ? "Needs start-tracking data" : "% who started and did not finish"}
        />
        <Kpi
          label="Advisor booking conversion"
          value={data.advisor_booking_conversion_percent}
          hint={
            data.customers_assessed
              ? `${data.customers_booked_after_assessment} of ${data.customers_assessed} assessed customers (simulated)`
              : "Simulated bookings"
          }
        />
      </div>
      {data.tracking_note && <p className="m-0 rounded-xl bg-[#FFF8E6] px-4 py-2.5 text-sm text-[#8A6100]">{data.tracking_note}</p>}

      <Panel title="Customer funnel">
        {!data.has_data ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing tracked yet"
            hint="Figures appear as customers use the platform. Nothing is estimated."
          />
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {data.funnel.map((step, i) => (
              <li key={step.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#0E1330]">
                    {step.label} {step.note && <span className="text-xs font-normal text-[#8A849A]">· {step.note}</span>}
                  </span>
                  <span className="font-bold tabular-nums text-[#0E1330]">{step.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#F1EDFC]" role="img" aria-label={`${step.label}: ${step.count}`}>
                  <m.div
                    className="h-full origin-left rounded-full bg-gradient-to-r from-[#3D55E0] to-[#8B5CF6]"
                    style={{ width: `${(step.count / top) * 100}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.07 * i }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopList title="Top recommended products" items={data.top_recommended} />
        <TopList title="Top chosen products" items={data.top_selected} />
      </div>
      <Panel title="Product category share">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Share title="Recommended" data={data.category_share.recommended} />
          <Share title="Chosen by customers" data={data.category_share.selected} />
        </div>
      </Panel>
      <LeadsTable />
    </div>
  );
}
