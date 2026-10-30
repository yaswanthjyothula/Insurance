"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { AnimatedNumber } from "@/components/advisor/AnimatedNumber";
import { EmptyState, Panel, Skeleton } from "@/components/advisor/dashboard/parts";
import { EASE } from "@/components/advisor/motion";
import { inrShort } from "@/lib/admin-form";
import { SOURCE_LABEL, STAGES, pct } from "@/lib/crm";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { CrmReports as Reports } from "@/types/admin";
import { BarChart3 } from "lucide-react";

function Kpi({ label, value, hint, text }: { label: string; value?: number | null; hint?: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E5F0] bg-white p-4">
      <p className="m-0 text-xs font-semibold text-[#6F6A7C]">{label}</p>
      <p className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-[#0E1330]">
        {text ?? (value === null || value === undefined ? <span className="text-[#C4BFD3]">—</span> : <AnimatedNumber value={value} />)}
      </p>
      {hint && <p className="m-0 mt-1 text-xs text-[#8A849A]">{hint}</p>}
    </div>
  );
}

/** Conversion, advisor performance and lost-lead reasons, all computed from the leads and their stage history. */
export function CrmReports({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<Reports>("/admin/crm/reports", { signal: controller.signal })
      .then((r) => {
        setData(r);
        setError(null);
      })
      .catch((f: unknown) => !controller.signal.aborted && setError(errorMessage(f, "We couldn't load the reports.")));
    return () => controller.abort();
  }, [refreshKey]);

  if (error)
    return (
      <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
        {error}
      </p>
    );
  if (!data)
    return (
      <div role="status" aria-label="Loading reports" className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-60" />
      </div>
    );
  if (data.total_leads === 0)
    return (
      <EmptyState
        icon={BarChart3}
        title="No leads to report on yet"
        hint="Reports appear as customers complete assessments, or when you add a lead by hand."
      />
    );

  const top = Math.max(1, ...data.funnel.map((f) => f.count));
  const maxDay = Math.max(1, ...data.created_per_day.map((d) => d.count));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Open leads" value={data.open_leads} hint={`${inrShort(data.open_cover)} of cover needed`} />
        <Kpi
          label="Win rate"
          text={pct(data.win_rate_percent)}
          hint={data.win_rate_percent === null ? "No won or lost leads yet" : `${data.won} won, ${data.lost} lost`}
        />
        <Kpi label="Overall conversion" text={pct(data.overall_conversion_percent)} hint={`${data.won} of ${data.total_leads} leads`} />
        <Kpi
          label="Average days to win"
          text={data.average_days_to_win === null ? "—" : String(data.average_days_to_win)}
          hint={`Won yearly premium ${inrShort(data.won_annual_premium)}`}
        />
      </div>

      <Panel title="Where leads get to">
        <ul className="m-0 list-none space-y-4 p-0">
          {data.funnel.map((f, i) => (
            <li key={f.key}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-[#0E1330]">{f.label}</span>
                <span className="font-bold tabular-nums">
                  {f.count}
                  <span className="ml-2 text-xs font-normal text-[#8A849A]">
                    {data.total_leads ? Math.round((f.count / data.total_leads) * 100) : 0}%
                  </span>
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-[#F1EDFC]"
                role="img"
                aria-label={`${f.label}: ${f.count} of ${data.total_leads} leads`}
              >
                <m.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-[#3D55E0] to-[#8B5CF6]"
                  style={{ width: `${(f.count / top) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.07 * i }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-4 text-xs text-[#8A849A]">Each bar counts the leads that reached that stage or went beyond it.</p>
      </Panel>

      <Panel title="Advisors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E5F0] text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">
                <th className="px-3 py-2">Advisor</th>
                <th className="px-3 py-2 text-right">Open</th>
                <th className="px-3 py-2 text-right">Won</th>
                <th className="px-3 py-2 text-right">Lost</th>
                <th className="px-3 py-2 text-right">Open cover</th>
                <th className="px-3 py-2 text-right">Won premium</th>
              </tr>
            </thead>
            <tbody>
              {data.by_advisor.map((a) => (
                <tr key={a.advisor_id} className="border-b border-[#F1EDFC]">
                  <td className="px-3 py-2.5 font-bold text-[#0E1330]">{a.advisor_name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{a.open}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{a.won}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-rose-700">{a.lost}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{inrShort(a.open_cover)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{inrShort(a.won_premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Where leads come from">
          <ul className="m-0 list-none space-y-2 p-0 text-sm">
            {Object.entries(data.by_source).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{SOURCE_LABEL[k] ?? k}</span>
                <strong className="tabular-nums">{v}</strong>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Why leads are lost">
          {data.lost_reasons.length === 0 ? (
            <p className="m-0 text-sm text-[#8A849A]">No lost leads yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0 text-sm">
              {data.lost_reasons.map((r) => (
                <li key={r.reason} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate capitalize">{r.reason}</span>
                  <strong className="tabular-nums">{r.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="New leads, last 30 days">
          <div
            className="flex h-28 items-end gap-[3px]"
            role="img"
            aria-label={`${data.created_per_day.reduce((a, d) => a + d.count, 0)} new leads in 30 days`}
          >
            {data.created_per_day.map((d, i) => (
              <m.span
                key={d.date}
                title={`${d.date}: ${d.count}`}
                className="flex-1 origin-bottom rounded-t bg-[#3D55E0]"
                style={{ height: `${Math.max(d.count ? 8 : 2, (d.count / maxDay) * 100)}%`, opacity: d.count ? 1 : 0.2 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.01 }}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Time in the current stage">
          <ul className="m-0 list-none space-y-2 p-0 text-sm">
            {STAGES.filter((s) => s.key in data.average_days_in_stage).map((s) => (
              <li key={s.key} className="flex justify-between">
                <span>{s.label}</span>
                <strong className="tabular-nums">
                  {data.average_days_in_stage[s.key] === null ? "—" : `${data.average_days_in_stage[s.key]} days`}
                </strong>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-xs text-[#8A849A]">Average age of the open leads in each stage.</p>
        </Panel>
      </div>
    </div>
  );
}
