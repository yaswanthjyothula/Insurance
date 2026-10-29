"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, TrendingUp, ArrowRight, ArrowLeft, RefreshCw, Sliders, Info, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import type { ScenarioComparisonResult } from "@/types/assessment";

type Method = "net_needs" | "hlv";

const fmt = (n: number) => formatINR(n, { compact: true });
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
const SEGMENT_COLORS = ["#7957FF", "#9A80FF", "#C4B8FF", "#E1DAF7"];

export default function ResultsPage() {
  const router = useRouter();
  const { input, result, setStage, isHydrated } = useAssessmentStore();
  const [method, setMethod] = useState<Method>("net_needs");
  const [activeScenario, setActiveScenario] = useState<ScenarioComparisonResult | null>(null);
  const [scenarioType, setScenarioType] = useState<string | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  // Nobody should see numbers they never asked for: no assessment, back to the form
  useEffect(() => {
    if (isHydrated && !result) router.replace("/assessment");
  }, [isHydrated, result, router]);

  const runScenario = async (type: string, title: string) => {
    if (isScenarioLoading) return;
    setScenarioType(type);
    setIsScenarioLoading(true);
    setScenarioError(null);
    try {
      const res = await fetchFromAPI("/scenarios/compare", {
        method: "POST",
        body: JSON.stringify({ baseline_input: input, scenario: { scenario_type: type, title, description: `Simulated impact of ${title}` } }),
      });
      setActiveScenario(res);
    } catch (e) {
      setActiveScenario(null);
      setScenarioError(
        e instanceof Error && !/failed to fetch|load failed|networkerror/i.test(e.message)
          ? e.message
          : "We couldn't run that scenario. Please check the calculation service is running and try again."
      );
    } finally {
      setIsScenarioLoading(false);
    }
  };

  if (!isHydrated || !result) {
    return (
      <div className="min-h-screen flex flex-col text-[#24212B]">
        <JourneyProgress currentStage={2} />
        <div className="flex-1 flex flex-col items-center justify-center p-8" role="status">
          <RefreshCw className="w-8 h-8 text-[#7957FF] animate-spin mb-4" />
          <h2 className="text-xl font-bold">Loading your results…</h2>
          <p className="text-sm text-[#5A5566] mt-1">If you haven&apos;t completed the assessment yet, we&apos;ll take you back to it.</p>
        </div>
      </div>
    );
  }

  const inp = result.inputs ?? result.input ?? input;
  const net = result.net_needs;
  const hlv = result.hlv;
  const inflation = (inp.inflation_rate ?? 0.07) * 100;
  const discount = (inp.discount_rate ?? 0.08) * 100;
  const retire = inp.retirement_age ?? 60;
  const horizon = inp.support_horizon_years || Math.max(5, retire - inp.age);
  const monthly = inp.annual_expenses / 12;
  const bufferMonths = monthly > 0 ? net.immediate_expenses / monthly : 0;

  const protectedNow = net.existing_cover_deducted + net.eligible_assets_deducted;
  const grossForMethod = method === "net_needs" ? net.total_gross_need : hlv.hlv_gross + net.outstanding_liabilities;
  const gap = method === "net_needs" ? net.net_coverage_gap : hlv.hlv_net_gap;
  const surplus = Math.max(0, protectedNow - grossForMethod);
  const covered = gap <= 0;

  // Net Needs composition
  const goals = inp.future_goals ?? [];
  const parts = [
    { title: "Income replacement", value: net.income_replacement_pv, desc: `Present value of ${fmt(monthly)}/month household expenses over ${horizon} years, at ${inflation.toFixed(1)}% inflation and ${discount.toFixed(1)}% discount.` },
    { title: "Liabilities & debt", value: net.outstanding_liabilities, desc: net.outstanding_liabilities > 0 ? "Full clearance of your declared home loan, personal and other debts." : "No loans declared." },
    { title: "Future goals", value: net.future_goals_pv, desc: goals.length ? `Inflation-adjusted, discounted cost of: ${goals.map((g) => g.name).join(", ")}.` : "No goals declared." },
    { title: "Immediate buffer", value: net.immediate_expenses, desc: inp.immediate_expenses ? `${bufferMonths.toFixed(bufferMonths % 1 ? 1 : 0)} months of expenses kept ready for medical and transition costs.` : "Default liquidity buffer for medical and transition costs (6 months of expenses, minimum ₹3 L)." },
  ];
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);

  // Scenario availability
  const presets = [
    { type: "another_child", label: "+1 Dependent Child", desc: "Adds an education goal and 15% more expenses", off: "" },
    { type: "loan_cleared", label: "Clear All Loans", desc: "Liabilities drop to zero", off: net.outstanding_liabilities <= 0 ? "You haven't declared any loans" : "" },
    { type: "retire_55", label: "Early Retirement (55)", desc: "Shortens the earning window", off: inp.age >= 55 ? "You're already 55 or older" : retire <= 55 ? "You already retire at or before 55" : "" },
    { type: "income_drop_20", label: "20% Income Drop", desc: "Shows in the Human Life Value method", off: "" },
  ];

  const gapOf = (r: ScenarioComparisonResult["baseline_result"]) => (method === "net_needs" ? r.net_needs.net_coverage_gap : r.hlv.hlv_net_gap);
  const delta = activeScenario ? gapOf(activeScenario.scenario_result) - gapOf(activeScenario.baseline_result) : 0;

  const card = "ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl";
  const eyebrow = "text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]";

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={2} />

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-5 sm:px-8 pt-12 pb-28 flex flex-col gap-8">
        {/* Header */}
        <div className="ls-persp">
          <div data-scroll-tilt="5" className={`${card} px-8 sm:px-11 py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-7 [transform-origin:bottom_center]`}>
            <div className="max-w-[640px]">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[13px] font-bold uppercase tracking-[0.14em] mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stage 2 of 4: Coverage requirement &amp; gap analysis
              </div>
              <h1 className="m-0 text-[clamp(30px,3.4vw,46px)] leading-[1.05] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>Your estimated coverage requirement</h1>
              <p className="text-[17px] leading-[1.55] text-[#5A5566] mt-3 mb-0">{result.recommendation_summary ?? "Deterministic calculation based on your family's future income replacement and debt obligations."}</p>
            </div>

            <div role="group" aria-label="Calculation method" className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-xl bg-[#F1EEF8] border border-[#D9D3E8] shrink-0">
              {([["net_needs", "Net Needs", net.net_coverage_gap], ["hlv", "Human Life Value", hlv.hlv_net_gap]] as const).map(([k, label, v]) => {
                const on = method === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMethod(k)}
                    className={`px-5 py-2.5 rounded-lg text-left transition-all ${on ? "bg-[#7957FF] text-[#FFFFFF] shadow-[0_3px_0_#5B3BE6]" : "bg-[#FFFFFF] text-[#24212B] border border-[#D9D3E8] hover:-translate-y-0.5"}`}
                  >
                    <span className="block text-sm font-bold">{label}</span>
                    <span className={`block text-[13px] tabular-nums ${on ? "text-[#E9E4FF]" : "text-[#6F6A7C]"}`}>{fmt(v)} gap</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gap banner + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-3xl p-8 sm:p-10 text-[#FFFFFF] flex flex-col gap-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_10px_0_#5B3BE6,0_40px_70px_-30px_rgba(121,87,255,0.6)]" style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}>
            <span className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold tracking-[0.18em] uppercase text-[#E9E4FF]">
              {covered ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {covered ? "You're covered" : "Additional life cover required"}
            </span>
            {covered ? (
              <>
                <span className="font-black text-[clamp(34px,4.6vw,60px)] leading-[1.02] tracking-[-0.04em] ls-extrude-on-violet" style={{ color: "#FFFFFF" }}>No additional cover needed</span>
                <p className="m-0 text-[17px] leading-[1.55] text-[#F1EEFF] max-w-[560px]">
                  Your existing cover and liquid assets exceed the estimated need by <strong>{fmt(surplus)}</strong> under this method. You can still compare plans in the next stage.
                </p>
              </>
            ) : (
              <>
                <span className="font-black text-[clamp(38px,5.4vw,72px)] leading-none tracking-[-0.045em] tabular-nums ls-extrude-on-violet" style={{ color: "#FFFFFF" }}>{formatINR(gap)}</span>
                <span className="text-xl font-semibold text-[#E9E4FF] tabular-nums">about {fmt(gap)}</span>
                <p className="m-0 text-base leading-[1.6] text-[#F1EEFF] max-w-[560px]">
                  {method === "net_needs"
                    ? "Total financial obligations minus your existing life cover and liquid assets. This capital reserve keeps your family at its standard of living without debt distress."
                    : `Present value of your lifetime earning capacity until age ${retire}, after personal consumption, plus your debts, minus what you already have.`}
                </p>
              </>
            )}
          </div>

          <div className={`${card} lg:col-span-2 p-7 flex flex-col`}>
            <span className={`${eyebrow} mb-3`}>Calculation summary</span>
            <dl className="m-0 text-[15.5px] flex-1">
              {(method === "net_needs"
                ? [["Total gross need", fmt(net.total_gross_need), ""], ["Existing life cover", `−${fmt(net.existing_cover_deducted)}`, ""], ["Liquid assets", `−${fmt(net.eligible_assets_deducted)}`, ""]]
                : [["Human life value", fmt(hlv.hlv_gross), ""], ["Outstanding liabilities", `+${fmt(net.outstanding_liabilities)}`, ""], ["Existing life cover", `−${fmt(net.existing_cover_deducted)}`, ""], ["Liquid assets", `−${fmt(net.eligible_assets_deducted)}`, ""]]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3.5 border-b border-[#D9D3E8]">
                  <dt className="text-[#5A5566]">{k}</dt>
                  <dd className="m-0 font-bold tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-4">
                <dt className="font-bold">Remaining gap</dt>
                <dd className="m-0 font-extrabold text-[#7957FF] text-lg tabular-nums">{fmt(gap)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Composition */}
        <section className={`${card} p-7 sm:p-10 flex flex-col gap-7`} aria-label="How the number is built">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3"><TrendingUp className="w-5 h-5 text-[#7957FF]" />
                {method === "net_needs" ? `Need composition (total ${fmt(net.total_gross_need)})` : "Human Life Value breakdown"}
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-[#5A5566]">{method === "net_needs" ? "Every rupee maps to a declared obligation." : "What your future earnings are worth to your family today."}</p>
            </div>
            <span className="text-[13px] font-bold px-3 py-1.5 bg-[#E9E4FF] text-[#7957FF] rounded-md self-start sm:self-center whitespace-nowrap">Discount {discount.toFixed(1)}% · Inflation {inflation.toFixed(1)}%</span>
          </div>

          {method === "net_needs" ? (
            <>
              <div className="w-full h-[18px] rounded-[9px] overflow-hidden flex bg-[#F1EEF8] shadow-[inset_0_2px_4px_rgba(36,33,43,0.1)]" role="img" aria-label="Share of each component in total need">
                {parts.map((p, i) => <div key={p.title} style={{ width: `${pct(p.value)}%`, background: SEGMENT_COLORS[i] }} className="h-full" title={`${p.title}: ${pct(p.value).toFixed(0)}%`} />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {parts.map((p, i) => (
                  <div key={p.title} className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em]"><span className="w-3 h-3 rounded-[4px]" style={{ background: SEGMENT_COLORS[i] }} />{i + 1}. {p.title}</span>
                      <span className="text-[13px] font-bold text-[#6F6A7C]">{pct(p.value).toFixed(0)}%</span>
                    </div>
                    <div className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{fmt(p.value)}</div>
                    <p className="m-0 text-[13.5px] leading-[1.5] text-[#5A5566]">{p.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Human life value", fmt(hlv.hlv_gross), `Present value of ${hlv.earning_horizon_years} years of net earnings.`],
                ["Earning horizon", `${hlv.earning_horizon_years} years`, `From age ${inp.age} to retirement at ${retire}.`],
                ["Personal consumption", `${Math.round(hlv.personal_consumption_ratio * 100)}%`, "Share of income you spend on yourself, based on your dependents."],
                ["Wage growth", `${(hlv.wage_growth_rate * 100).toFixed(1)}%`, `Discounted at ${(hlv.discount_rate * 100).toFixed(1)}% a year.`],
              ].map(([t, v, d]) => (
                <div key={t} className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-2">
                  <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">{t}</span>
                  <div className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{v}</div>
                  <p className="m-0 text-[13.5px] leading-[1.5] text-[#5A5566]">{d}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scenario Studio */}
        <section className={`${card} p-7 sm:p-10 flex flex-col gap-6`} aria-label="Scenario simulation">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3"><Sliders className="w-5 h-5 text-[#7957FF]" />Simulate life events</h2>
              <p className="m-0 mt-1.5 text-[15px] text-[#5A5566]">See how a change would move your gap. Your own answers are never changed.</p>
            </div>
            {isScenarioLoading && <RefreshCw className="w-5 h-5 text-[#7957FF] animate-spin" aria-label="Running scenario" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map((sc) => {
              const on = scenarioType === sc.type && activeScenario !== null;
              return (
                <button
                  key={sc.type}
                  type="button"
                  disabled={Boolean(sc.off) || isScenarioLoading}
                  onClick={() => runScenario(sc.type, sc.label)}
                  title={sc.off || undefined}
                  className={`p-4 rounded-xl text-left border transition-all disabled:cursor-not-allowed ${
                    sc.off
                      ? "bg-[#FAF9F6] border-[#D9D3E8] text-[#A59FB5]"
                      : on
                      ? "bg-[#E9E4FF] border-[#7957FF] shadow-[0_4px_0_#7957FF]"
                      : "bg-[#FFFFFF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-[15px] font-bold">{sc.label}</div>
                  <div className={`text-[13px] mt-1 ${sc.off ? "" : "text-[#5A5566]"}`}>{sc.off || sc.desc}</div>
                </button>
              );
            })}
          </div>

          {scenarioError && (
            <div role="alert" className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#C23B3B] text-[#C23B3B] text-[15px] font-semibold">
              <span className="flex items-center gap-2.5"><AlertCircle className="w-5 h-5 shrink-0" />{scenarioError}</span>
              {scenarioType && <button type="button" className="underline shrink-0" onClick={() => runScenario(scenarioType, presets.find((p) => p.type === scenarioType)?.label ?? "Scenario")}>Try again</button>}
            </div>
          )}

          {activeScenario && (
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-bold uppercase tracking-[0.14em]">Scenario impact: {activeScenario.title}</span>
                <span className="text-sm font-bold px-3 py-1.5 rounded-md bg-[#7957FF] text-[#FFFFFF] shadow-[0_3px_0_#5B3BE6] tabular-nums">
                  Gap change ({method === "net_needs" ? "Net Needs" : "HLV"}): {delta === 0 ? "none" : signed(delta)}
                </span>
              </div>

              {delta === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#E9E4FF] text-[15px]">
                  <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
                  <span>
                    {method === "net_needs" && activeScenario.scenario_type.startsWith("income")
                      ? "Income doesn't change the Net Needs result. Switch to Human Life Value above to see this scenario's effect."
                      : "This scenario doesn't change your gap under the selected method."}
                  </span>
                </div>
              )}

              {activeScenario.diffs.length > 0 && (
                <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[15px]">
                  {activeScenario.diffs.map((d) => (
                    <li key={d.field} className="flex justify-between gap-4 py-2 border-b border-[#D9D3E8] last:border-0">
                      <span className="text-[#5A5566]">{d.label}</span>
                      <span className="font-bold text-right">{d.difference_str}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8]">
                  <div className="text-sm text-[#5A5566]">Current gap</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1">{fmt(gapOf(activeScenario.baseline_result))}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8]">
                  <div className="text-sm text-[#5A5566]">Simulated gap</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1">{fmt(gapOf(activeScenario.scenario_result))}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] shadow-[0_3px_0_#CFC5F5]">
                  <div className="text-sm text-[#5A5566]">Indicative premium change</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1 text-[#7957FF]">
                    {method === "net_needs" ? `${activeScenario.estimated_premium_difference > 0 ? "+" : activeScenario.estimated_premium_difference < 0 ? "−" : ""}${formatINR(Math.abs(activeScenario.estimated_premium_difference))}/yr` : "Net Needs only"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Methodology */}
        {result.methodology && (
          <details className={`${card} group`}>
            <summary className="list-none cursor-pointer px-7 sm:px-10 py-6 flex items-center justify-between gap-4 font-bold text-lg">
              <span className="flex items-center gap-3"><Info className="w-5 h-5 text-[#7957FF]" />How this was calculated</span>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-7 sm:px-10 pb-8 flex flex-col gap-4 text-[15.5px] leading-[1.6] text-[#4A4553]">
              <p className="m-0"><strong className="text-[#24212B]">{result.methodology.method}.</strong> {result.methodology.description}</p>
              <p className="m-0"><strong className="text-[#24212B]">Assumptions:</strong> {result.methodology.assumptions_summary}</p>
              {result.methodology.limitations.length > 0 && (
                <div>
                  <strong className="text-[#24212B]">Limitations</strong>
                  <ul className="mt-2 mb-0 pl-5 flex flex-col gap-1.5">{result.methodology.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Link href="/assessment" className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-base font-semibold shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all">
            <ArrowLeft className="w-4 h-4" />Edit my answers
          </Link>
          <Link href="/products" onClick={() => setStage(3)} className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold">
            Continue to Stage 3: choose &amp; customise plans<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
