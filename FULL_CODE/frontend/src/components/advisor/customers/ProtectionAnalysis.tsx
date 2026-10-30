"use client";

import { m } from "motion/react";
import { formatInrCompact } from "@/components/advisor/format";
import { EASE } from "@/components/advisor/motion";
import { Panel } from "@/components/advisor/dashboard/parts";
import type { NeedsAnalysis } from "@/types/advisor";

interface Line {
  label: string;
  value: number;
  tone: string;
  sign?: "+" | "−";
}

function Bar({ line, scale, index }: { line: Line; scale: number; index: number }) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-[#24212B]">{line.label}</span>
        <span className="font-semibold tabular-nums text-[#24212B]">
          {line.sign ? `${line.sign} ` : ""}
          {formatInrCompact(line.value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F1EDFC]">
        <m.div
          className={`h-full origin-left rounded-full ${line.tone}`}
          style={{ width: `${scale > 0 ? Math.min(100, (line.value / scale) * 100) : 0}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.06 * index }}
        />
      </div>
    </li>
  );
}

export function ProtectionAnalysis({ analysis }: { analysis: NeedsAnalysis }) {
  const n = analysis.net_needs;
  const h = analysis.hlv;
  const needs: Line[] = [
    { label: "Income replacement", value: n.income_replacement_pv, tone: "bg-[#7957FF]" },
    { label: "Future goals", value: n.future_goals_pv, tone: "bg-[#9A80FF]" },
    { label: "Outstanding liabilities", value: n.outstanding_liabilities, tone: "bg-[#6240E6]" },
    { label: "Immediate expenses", value: n.immediate_expenses, tone: "bg-[#B9A6FF]" },
  ];
  const offsets: Line[] = [
    { label: "Available assets", value: n.eligible_assets_deducted, tone: "bg-emerald-500", sign: "−" },
    { label: "Existing life cover", value: n.existing_cover_deducted, tone: "bg-emerald-400", sign: "−" },
  ];
  const scale = Math.max(n.total_gross_need, n.eligible_assets_deducted, n.existing_cover_deducted, 1);
  const a = analysis.inputs;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Net Needs calculation" className="lg:col-span-2">
          <p className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-[#8A849A]">What the family would need</p>
          <ul className="m-0 mb-4 list-none space-y-3 p-0">
            {needs.map((line, i) => (
              <Bar key={line.label} line={line} scale={scale} index={i} />
            ))}
          </ul>
          <p className="m-0 mb-4 flex items-baseline justify-between border-t border-[#F1EDFC] pt-3 text-sm font-bold text-[#24212B]">
            <span>Total need</span>
            <span className="tabular-nums">{formatInrCompact(n.total_gross_need)}</span>
          </p>
          <p className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-[#8A849A]">Already in place</p>
          <ul className="m-0 list-none space-y-3 p-0">
            {offsets.map((line, i) => (
              <Bar key={line.label} line={line} scale={scale} index={i + 4} />
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <section className="rounded-2xl bg-[#171B3D] p-5 text-white sm:p-6">
            <h2 className="m-0 text-base font-bold">Protection gap</h2>
            <p className="m-0 mt-3 text-3xl font-extrabold tracking-tight tabular-nums">
              {n.net_coverage_gap > 0 ? formatInrCompact(n.net_coverage_gap) : "None"}
            </p>
            <p className="m-0 mt-2 text-xs leading-relaxed text-white/70">
              {n.net_coverage_gap > 0
                ? `Additional cover to consider: about ${formatInrCompact(n.recommended_cover)} (rounded up to the pack's cover step).`
                : "Existing cover and assets meet the estimated need under these assumptions."}
            </p>
            <p className="m-0 mt-3 text-[11px] text-white/50">Estimate. Not a quote or a recommendation to buy.</p>
          </section>
          <Panel title="Human Life Value cross-check">
            <p className="m-0 text-2xl font-extrabold tracking-tight tabular-nums text-[#171B3D]">{formatInrCompact(h.hlv_gross)}</p>
            <p className="m-0 mt-1 text-xs text-[#6F6A7C]">Value of {h.earning_horizon_years} years of earnings the family would lose.</p>
            <p className="m-0 mt-3 text-sm text-[#24212B]">
              HLV gap after the same assets and cover: <strong>{h.hlv_net_gap > 0 ? formatInrCompact(h.hlv_net_gap) : "None"}</strong>
            </p>
            <p className="m-0 mt-2 text-[11px] text-[#8A849A]">A second opinion, not added to the Net Needs gap.</p>
          </Panel>
        </div>
      </div>

      <Panel title="Assumptions and limits">
        <p className="m-0 text-sm text-[#24212B]">{analysis.methodology.description}</p>
        <dl className="m-0 mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ["Inflation", `${(a.inflation_rate * 100).toFixed(1)}%`],
            ["Education inflation", `${(a.edu_inflation_rate * 100).toFixed(1)}%`],
            ["Return on payout", `${(a.discount_rate * 100).toFixed(1)}%`],
            ["Income growth", `${a.income_growth_pct.toFixed(1)}%`],
            ["Retirement age", String(a.retirement_age)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-[#8A849A]">{label}</dt>
              <dd className="m-0 mt-0.5 text-sm font-bold tabular-nums text-[#24212B]">{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="m-0 mt-4 list-disc space-y-1 pl-5 text-xs text-[#6F6A7C]">
          {analysis.methodology.limitations.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
