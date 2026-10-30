"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Info,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { postJSON } from "@/lib/api";
import type { ScenarioComparisonResult } from "@/types/assessment";
import { useI18n } from "@/i18n/I18nProvider";
import { en, type MessageKey } from "@/i18n/en";

type Method = "net_needs" | "hlv";

const fmt = (n: number) => formatINR(n, { compact: true });
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
const SEGMENT_COLORS = ["#7957FF", "#9A80FF", "#C4B8FF", "#E1DAF7"];

export default function ResultsPage() {
  const router = useRouter();
  const { t, tx } = useI18n();
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
      setActiveScenario(
        await postJSON<ScenarioComparisonResult>("/scenarios/compare", {
          baseline_input: input,
          scenario: { scenario_type: type, title, description: `Simulated impact of ${title}` },
        }),
      );
    } catch (e) {
      setActiveScenario(null);
      setScenarioError(e instanceof Error ? tx(e.message) : t("results.scenario.error"));
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
          <h2 className="text-xl font-bold">{t("results.loading.title")}</h2>
          <p className="text-sm text-[#5A5566] mt-1">{t("results.loading.hint")}</p>
        </div>
      </div>
    );
  }

  const inp = result.inputs ?? result.input ?? input;
  const net = result.net_needs;
  const hlv = result.hlv;
  const discount = hlv.discount_rate * 100;
  const retire = inp.retirement_age ?? inp.age + hlv.earning_horizon_years;
  const monthly = inp.annual_expenses / 12;
  const recommendedCover = net.recommended_cover ?? Math.max(net.net_coverage_gap, 0);

  const protectedNow = net.existing_cover_deducted + net.eligible_assets_deducted;
  const grossForMethod = method === "net_needs" ? net.total_gross_need : hlv.hlv_gross + net.outstanding_liabilities;
  const gap = method === "net_needs" ? net.net_coverage_gap : hlv.hlv_net_gap;
  const surplus = Math.max(0, protectedNow - grossForMethod);
  const covered = gap <= 0;
  const headlineCover = method === "net_needs" ? recommendedCover : gap;

  // Net Needs composition
  const goals = inp.future_goals ?? [];
  const parts = [
    {
      title: t("results.part.income.title"),
      value: net.income_replacement_pv,
      desc:
        inp.inflation_rate === undefined
          ? t("results.part.income.descNoInflation", { monthly: fmt(monthly), rate: discount.toFixed(1) })
          : t("results.part.income.descInflation", {
              monthly: fmt(monthly),
              inflation: (inp.inflation_rate * 100).toFixed(1),
              rate: discount.toFixed(1),
            }),
    },
    {
      title: t("results.part.liabilities.title"),
      value: net.outstanding_liabilities,
      desc: net.outstanding_liabilities > 0 ? t("results.part.liabilities.desc") : t("results.part.liabilities.none"),
    },
    {
      title: t("results.part.goals.title"),
      value: net.future_goals_pv,
      desc: goals.length ? t("results.part.goals.desc", { goals: goals.map((g) => g.name).join(", ") }) : t("results.part.goals.none"),
    },
    {
      title: t("results.part.buffer.title"),
      value: net.immediate_expenses,
      desc: t("results.part.buffer.desc"),
    },
  ];
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);

  // Scenario availability
  const presets: { type: string; labelKey: MessageKey; descKey: MessageKey; off: string }[] = [
    { type: "another_child", labelKey: "results.preset.anotherChild.label", descKey: "results.preset.anotherChild.desc", off: "" },
    {
      type: "loan_cleared",
      labelKey: "results.preset.loanCleared.label",
      descKey: "results.preset.loanCleared.desc",
      off: net.outstanding_liabilities <= 0 ? t("results.preset.loanCleared.off") : "",
    },
    {
      type: "retire_55",
      labelKey: "results.preset.retire55.label",
      descKey: "results.preset.retire55.desc",
      off: inp.age >= 55 ? t("results.preset.retire55.offAge") : retire <= 55 ? t("results.preset.retire55.offRetire") : "",
    },
    { type: "income_drop_20", labelKey: "results.preset.incomeDrop.label", descKey: "results.preset.incomeDrop.desc", off: "" },
  ];

  const gapOf = (r: ScenarioComparisonResult["baseline_result"]) =>
    method === "net_needs" ? r.net_needs.net_coverage_gap : r.hlv.hlv_net_gap;
  const delta = activeScenario ? gapOf(activeScenario.scenario_result) - gapOf(activeScenario.baseline_result) : 0;

  const card = "ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl";
  const eyebrow = "text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]";

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={2} />

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-5 sm:px-8 pt-12 pb-28 flex flex-col gap-8">
        {/* Header */}
        <div className="ls-persp">
          <div
            data-scroll-tilt="5"
            className={`${card} px-8 sm:px-11 py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-7 [transform-origin:bottom_center]`}
          >
            <div className="max-w-[640px]">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[13px] font-bold uppercase tracking-[0.14em] mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("results.header.stage")}
              </div>
              <h1
                className="m-0 text-[clamp(30px,3.4vw,46px)] leading-[1.05] font-extrabold tracking-[-0.04em]"
                style={{ color: "#24212B" }}
              >
                {t("results.header.title")}
              </h1>
              <p className="text-[17px] leading-[1.55] text-[#5A5566] mt-3 mb-0">
                {result.recommendation_summary ? tx(result.recommendation_summary) : t("results.header.defaultSummary")}
              </p>
            </div>

            <div
              role="group"
              aria-label={t("results.method.groupLabel")}
              className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-xl bg-[#F1EEF8] border border-[#D9D3E8] shrink-0"
            >
              {(
                [
                  ["net_needs", t("results.method.netNeeds"), net.net_coverage_gap],
                  ["hlv", t("results.method.hlv"), hlv.hlv_net_gap],
                ] as const
              ).map(([k, label, v]) => {
                const on = method === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMethod(k)}
                    className={`px-5 py-2.5 rounded-lg text-start transition-all ${on ? "bg-[#7957FF] text-[#FFFFFF] shadow-[0_3px_0_#5B3BE6]" : "bg-[#FFFFFF] text-[#24212B] border border-[#D9D3E8] hover:-translate-y-0.5"}`}
                  >
                    <span className="block text-sm font-bold">{label}</span>
                    <span className={`block text-[13px] tabular-nums ${on ? "text-[#E9E4FF]" : "text-[#6F6A7C]"}`}>
                      {t("results.method.gapLine", { amount: fmt(v) })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gap banner + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div
            className="lg:col-span-3 rounded-3xl p-8 sm:p-10 text-[#FFFFFF] flex flex-col gap-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_10px_0_#5B3BE6,0_40px_70px_-30px_rgba(121,87,255,0.6)]"
            style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
          >
            <span className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold tracking-[0.18em] uppercase text-[#E9E4FF]">
              {covered ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {covered
                ? t("results.banner.covered")
                : method === "net_needs"
                  ? t("results.banner.recommended")
                  : t("results.banner.hlvGap")}
            </span>
            {covered ? (
              <>
                <span
                  className="font-black text-[clamp(34px,4.6vw,60px)] leading-[1.02] tracking-[-0.04em] ls-extrude-on-violet"
                  style={{ color: "#FFFFFF" }}
                >
                  {t("results.banner.noExtra")}
                </span>
                <p className="m-0 text-[17px] leading-[1.55] text-[#F1EEFF] max-w-[560px]">
                  {t("results.banner.surplus", { amount: fmt(surplus) })}
                </p>
              </>
            ) : (
              <>
                <span
                  className="font-black text-[clamp(38px,5.4vw,72px)] leading-none tracking-[-0.045em] tabular-nums ls-extrude-on-violet"
                  style={{ color: "#FFFFFF" }}
                >
                  {formatINR(headlineCover)}
                </span>
                <span className="text-xl font-semibold text-[#E9E4FF] tabular-nums">
                  {method === "net_needs"
                    ? t("results.banner.roundedUp", { amount: fmt(net.net_coverage_gap) })
                    : t("results.banner.about", { amount: fmt(gap) })}
                </span>
                <p className="m-0 text-base leading-[1.6] text-[#F1EEFF] max-w-[560px]">
                  {method === "net_needs" ? t("results.banner.netNeedsExplain") : t("results.banner.hlvExplain", { age: retire })}
                </p>
              </>
            )}
          </div>

          <div className={`${card} lg:col-span-2 p-7 flex flex-col`}>
            <span className={`${eyebrow} mb-3`}>{t("results.summary.title")}</span>
            <dl className="m-0 text-[15.5px] flex-1">
              {(method === "net_needs"
                ? [
                    [t("results.summary.totalGrossNeed"), fmt(net.total_gross_need), ""],
                    [t("results.summary.existingCover"), `−${fmt(net.existing_cover_deducted)}`, ""],
                    [t("results.summary.liquidAssets"), `−${fmt(net.eligible_assets_deducted)}`, ""],
                  ]
                : [
                    [t("results.summary.humanLifeValue"), fmt(hlv.hlv_gross), ""],
                    [t("results.summary.outstandingLiabilities"), `+${fmt(net.outstanding_liabilities)}`, ""],
                    [t("results.summary.existingCover"), `−${fmt(net.existing_cover_deducted)}`, ""],
                    [t("results.summary.liquidAssets"), `−${fmt(net.eligible_assets_deducted)}`, ""],
                  ]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3.5 border-b border-[#D9D3E8]">
                  <dt className="text-[#5A5566]">{k}</dt>
                  <dd className="m-0 font-bold tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-4">
                <dt className="font-bold">{t("results.summary.remainingGap")}</dt>
                <dd className="m-0 font-extrabold text-[#7957FF] text-lg tabular-nums">{fmt(gap)}</dd>
              </div>
              {method === "net_needs" && (
                <div className="flex justify-between gap-4 pt-3">
                  <dt className="font-bold">{t("results.summary.recommendedCover")}</dt>
                  <dd className="m-0 font-extrabold text-[#7957FF] text-lg tabular-nums">{fmt(recommendedCover)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Composition */}
        <section className={`${card} p-7 sm:p-10 flex flex-col gap-7`} aria-label={t("results.composition.ariaLabel")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#7957FF]" />
                {method === "net_needs"
                  ? t("results.composition.netNeedsTitle", { amount: fmt(net.total_gross_need) })
                  : t("results.composition.hlvTitle")}
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-[#5A5566]">
                {method === "net_needs" ? t("results.composition.netNeedsHint") : t("results.composition.hlvHint")}
              </p>
            </div>
            <span className="text-[13px] font-bold px-3 py-1.5 bg-[#E9E4FF] text-[#7957FF] rounded-md self-start sm:self-center whitespace-nowrap">
              {t("results.composition.returnBadge", { rate: discount.toFixed(1) })}
            </span>
          </div>

          {result.methodology && (
            <p className="m-0 text-[15px] leading-[1.6] text-[#4A4553]">
              <strong className="text-[#24212B]">{t("results.composition.assumptions")}</strong>{" "}
              {tx(result.methodology.assumptions_summary)}
            </p>
          )}

          {method === "net_needs" ? (
            <>
              <div
                className="w-full h-[18px] rounded-[9px] overflow-hidden flex bg-[#F1EEF8] shadow-[inset_0_2px_4px_rgba(36,33,43,0.1)]"
                role="img"
                aria-label={t("results.composition.chartLabel")}
              >
                {parts.map((p, i) => (
                  <div
                    key={p.title}
                    style={{ width: `${pct(p.value)}%`, background: SEGMENT_COLORS[i] }}
                    className="h-full"
                    title={t("results.composition.segmentTitle", { title: p.title, percent: pct(p.value).toFixed(0) })}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {parts.map((p, i) => (
                  <div key={p.title} className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em]">
                        <span className="w-3 h-3 rounded-[4px]" style={{ background: SEGMENT_COLORS[i] }} />
                        {t("results.composition.partHeading", { n: i + 1, title: p.title })}
                      </span>
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
                [t("results.hlv.value.title"), fmt(hlv.hlv_gross), t("results.hlv.value.desc", { years: hlv.earning_horizon_years })],
                [
                  t("results.hlv.horizon.title"),
                  t("results.hlv.horizon.value", { years: hlv.earning_horizon_years }),
                  t("results.hlv.horizon.desc", { age: inp.age, retire }),
                ],
                [
                  t("results.hlv.consumption.title"),
                  `${Math.round(hlv.personal_consumption_ratio * 100)}%`,
                  t("results.hlv.consumption.desc"),
                ],
                [
                  t("results.hlv.wage.title"),
                  `${(hlv.wage_growth_rate * 100).toFixed(1)}%`,
                  t("results.hlv.wage.desc", { rate: (hlv.discount_rate * 100).toFixed(1) }),
                ],
              ].map(([title, v, d]) => (
                <div key={title} className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-2">
                  <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">{title}</span>
                  <div className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{v}</div>
                  <p className="m-0 text-[13.5px] leading-[1.5] text-[#5A5566]">{d}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scenario Studio */}
        <section className={`${card} p-7 sm:p-10 flex flex-col gap-6`} aria-label={t("results.scenario.ariaLabel")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
                <Sliders className="w-5 h-5 text-[#7957FF]" />
                {t("results.scenario.title")}
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-[#5A5566]">{t("results.scenario.hint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/tools/scenario-studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F0FF] hover:bg-[#EFEBFF] text-[#7957FF] text-xs font-bold transition-all border border-[#7957FF]/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{t("results.scenario.customLink")}</span>
              </Link>
              {isScenarioLoading && (
                <RefreshCw className="w-5 h-5 text-[#7957FF] animate-spin" aria-label={t("results.scenario.running")} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map((sc) => {
              const on = scenarioType === sc.type && activeScenario !== null;
              return (
                <button
                  key={sc.type}
                  type="button"
                  disabled={Boolean(sc.off) || isScenarioLoading}
                  onClick={() => runScenario(sc.type, en[sc.labelKey])}
                  title={sc.off || undefined}
                  className={`p-4 rounded-xl text-start border transition-all disabled:cursor-not-allowed ${
                    sc.off
                      ? "bg-[#FAF9F6] border-[#D9D3E8] text-[#A59FB5]"
                      : on
                        ? "bg-[#E9E4FF] border-[#7957FF] shadow-[0_4px_0_#7957FF]"
                        : "bg-[#FFFFFF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-[15px] font-bold">{t(sc.labelKey)}</div>
                  <div className={`text-[13px] mt-1 ${sc.off ? "" : "text-[#5A5566]"}`}>{sc.off || t(sc.descKey)}</div>
                </button>
              );
            })}
          </div>

          {scenarioError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#C23B3B] text-[#C23B3B] text-[15px] font-semibold"
            >
              <span className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {scenarioError}
              </span>
              {scenarioType && (
                <button
                  type="button"
                  className="underline shrink-0"
                  onClick={() =>
                    runScenario(scenarioType, en[presets.find((p) => p.type === scenarioType)?.labelKey ?? "results.preset.fallbackLabel"])
                  }
                >
                  {t("common.tryAgain")}
                </button>
              )}
            </div>
          )}

          {activeScenario && (
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-bold uppercase tracking-[0.14em]">
                  {t("results.scenario.impact", { title: tx(activeScenario.title) })}
                </span>
                <span className="text-sm font-bold px-3 py-1.5 rounded-md bg-[#7957FF] text-[#FFFFFF] shadow-[0_3px_0_#5B3BE6] tabular-nums">
                  {t(method === "net_needs" ? "results.scenario.gapChangeNetNeeds" : "results.scenario.gapChangeHlv", {
                    change: delta === 0 ? t("results.scenario.none") : signed(delta),
                  })}
                </span>
              </div>

              {delta === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#E9E4FF] text-[15px]">
                  <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
                  <span>
                    {method === "net_needs" && activeScenario.scenario_type.startsWith("income")
                      ? t("results.scenario.incomeNote")
                      : t("results.scenario.noChangeNote")}
                  </span>
                </div>
              )}

              {activeScenario.diffs.length > 0 && (
                <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[15px]">
                  {activeScenario.diffs.map((d) => (
                    <li key={d.field} className="flex justify-between gap-4 py-2 border-b border-[#D9D3E8] last:border-0">
                      <span className="text-[#5A5566]">{tx(d.label)}</span>
                      <span className="font-bold text-end">{d.difference_str}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8]">
                  <div className="text-sm text-[#5A5566]">{t("results.scenario.currentGap")}</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1">{fmt(gapOf(activeScenario.baseline_result))}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8]">
                  <div className="text-sm text-[#5A5566]">{t("results.scenario.simulatedGap")}</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1">{fmt(gapOf(activeScenario.scenario_result))}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] shadow-[0_3px_0_#CFC5F5]">
                  <div className="text-sm text-[#5A5566]">{t("results.scenario.premiumChange")}</div>
                  <div className="text-xl font-extrabold tabular-nums mt-1 text-[#7957FF]">
                    {method === "net_needs"
                      ? t("results.scenario.premiumPerYear", {
                          amount: `${activeScenario.estimated_premium_difference > 0 ? "+" : activeScenario.estimated_premium_difference < 0 ? "−" : ""}${formatINR(Math.abs(activeScenario.estimated_premium_difference))}`,
                        })
                      : t("results.scenario.netNeedsOnly")}
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
              <span className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#7957FF]" />
                {t("results.methodology.title")}
              </span>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-7 sm:px-10 pb-8 flex flex-col gap-4 text-[15.5px] leading-[1.6] text-[#4A4553]">
              <p className="m-0">
                <strong className="text-[#24212B]">{tx(result.methodology.method)}.</strong> {tx(result.methodology.description)}
              </p>
              {result.methodology.limitations.length > 0 && (
                <div>
                  <strong className="text-[#24212B]">{t("results.methodology.limitations")}</strong>
                  <ul className="mt-2 mb-0 ps-5 flex flex-col gap-1.5">
                    {result.methodology.limitations.map((l) => (
                      <li key={l}>{tx(l)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-base font-semibold shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("results.nav.edit")}
          </Link>
          <Link
            href="/products"
            onClick={() => setStage(3)}
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold"
          >
            {t("results.nav.continue")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
