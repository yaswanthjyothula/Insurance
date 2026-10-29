"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Scale, RefreshCw, Info, Check, X, ExternalLink, AlertCircle, ShieldCheck, ChevronDown, FileText, SlidersHorizontal } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR, shortInsurerName } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { indicativeAnnualPremium } from "@/lib/premium";
import type { RankedRecommendation, RecommendationResponse, PolicyCustomization, ProductCompareResponse, ComparedProductItem } from "@/types/recommendation";
import type { InsuranceProduct } from "@/types/index";

const NO_LIMIT = 1e9;
const fmt = (n: number) => formatINR(n, { compact: true });
const dateFmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const shortInsurer = shortInsurerName;

function coverRange(p: InsuranceProduct) {
  if (!p.min_sum_assured && p.max_sum_assured >= NO_LIMIT) return "Not confirmed";
  const lo = p.min_sum_assured ? fmt(p.min_sum_assured) : "";
  const hi = p.max_sum_assured >= NO_LIMIT ? "no upper limit" : fmt(p.max_sum_assured);
  return lo ? `${lo} to ${hi}` : `up to ${hi}`;
}
const entryRange = (p: InsuranceProduct) => (p.min_entry_age != null && p.max_entry_age != null ? `${p.min_entry_age} to ${p.max_entry_age} years` : "Not confirmed");
function termRange(p: InsuranceProduct) {
  if (p.min_term_years && p.max_maturity_age) return `${p.min_term_years}+ years, to age ${p.max_maturity_age}`;
  if (p.max_maturity_age) return `Up to age ${p.max_maturity_age}`;
  if (p.min_term_years) return `${p.min_term_years}+ years`;
  return "Not confirmed";
}
function maxTermFor(p: InsuranceProduct, age: number) {
  let m = 40;
  if (p.max_term_years) m = Math.min(m, p.max_term_years);
  if (p.max_maturity_age) m = Math.min(m, p.max_maturity_age - age);
  return Math.max(m, 1);
}

const STATUS = {
  sourced: { label: "Checked against insurer documents", short: "Verified", cls: "bg-[#E9E4FF] text-[#7957FF]" },
  partially_sourced: { label: "Partly verified", short: "Partly verified", cls: "bg-[#FFF4D6] text-[#8A6100]" },
  unverified_sample: { label: "Sample, not verified", short: "Sample", cls: "bg-[#F1EEF8] text-[#6F6A7C]" },
} as const;

type Priority = "balanced" | "lowest_cost" | "strongest_insurer" | "most_features";
const PRIORITIES: { value: Priority; label: string; hint: string }[] = [
  { value: "balanced", label: "Balanced", hint: "A mix of claims record, cover fit, price and features" },
  { value: "lowest_cost", label: "Lowest cost", hint: "Weights price most. Our price estimate is the same shape for every plan, so this separates plans only a little." },
  { value: "strongest_insurer", label: "Strongest insurer", hint: "Weights claims record and solvency most" },
  { value: "most_features", label: "Most features", hint: "Weights riders and payout options most" },
];
type MetricBlock = { model: { top1: number; top3: number }; fixed_rule_baseline: { top1: number; top3: number }; ceiling_known_preferences: { top1: number }; random: { top1: number } };
type MlInfo = { available: boolean; model?: string; training_households?: number; training_rows?: number; evaluation?: { overall: MetricBlock }; feature_importance?: { feature: string; importance: number }[]; disclosure?: string[] };

const label = "block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]";

/* ---------- Stable (module-level) pieces, so they never remount on state changes ---------- */

function Stat({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div>
      <span className={label}>{title}</span>
      <div className="mt-1 text-lg font-extrabold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[12px] text-[#6F6A7C] mt-0.5 leading-snug">{sub}</div>}
    </div>
  );
}

function Details({ rec, monthly }: { rec: RankedRecommendation; monthly: number }) {
  const p = rec.product;
  const st = STATUS[p.data_status ?? "unverified_sample"];
  return (
    <div className="grid lg:grid-cols-2 gap-x-10 gap-y-6 pt-5 mt-5 border-t border-[#D9D3E8]">
      <div className="flex flex-col gap-4 text-[14px]">
        <div className={`inline-flex items-center gap-1.5 self-start text-[12px] font-bold px-2.5 py-1 rounded-md ${st.cls}`}><ShieldCheck className="w-3.5 h-3.5" />{st.label}</div>
        <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3">
          <div><dt className={label}>Cover offered</dt><dd className="m-0 mt-0.5 font-semibold">{coverRange(p)}</dd></div>
          <div><dt className={label}>Entry age</dt><dd className="m-0 mt-0.5 font-semibold">{entryRange(p)}</dd></div>
          <div><dt className={label}>Policy term</dt><dd className="m-0 mt-0.5 font-semibold">{termRange(p)}</dd></div>
          <div><dt className={label}>Product number</dt><dd className="m-0 mt-0.5 font-semibold">{p.uin ?? "Not confirmed"}</dd></div>
        </dl>
        <div><span className={label}>Riders</span><div className="flex flex-wrap gap-1.5 mt-1.5">{p.riders_available.length ? p.riders_available.map((r) => <span key={r} className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[13px]">{r}</span>) : <span className="text-[#6F6A7C]">None offered</span>}</div></div>
        <div><span className={label}>Payout options</span><div className="flex flex-wrap gap-1.5 mt-1.5">{p.death_benefit_options?.length ? p.death_benefit_options.map((r) => <span key={r} className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[13px]">{r}</span>) : <span className="text-[#6F6A7C]">Not confirmed</span>}</div></div>
        {p.sample_premium && <div className="text-[13px] p-3 rounded-xl bg-[#FAF9F6] border border-[#D9D3E8]"><strong>Official sample price:</strong> age {p.sample_premium.age}, {fmt(p.sample_premium.cover)}, {p.sample_premium.term_years} yrs: {formatINR(p.sample_premium.annual_premium)}/yr.</div>}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px]">
          {p.product_page_url && <a href={p.product_page_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Plan page<ExternalLink className="w-3.5 h-3.5" /></a>}
          {p.brochure_url && <a href={p.brochure_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline"><FileText className="w-3.5 h-3.5" />Brochure</a>}
          {p.claim_ratio_source_url && <a href={p.claim_ratio_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Claims source<ExternalLink className="w-3.5 h-3.5" /></a>}
          {p.solvency_source_url && <a href={p.solvency_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Solvency source<ExternalLink className="w-3.5 h-3.5" /></a>}
          {p.quote_url && <a href={p.quote_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Get the exact price<ExternalLink className="w-3.5 h-3.5" /></a>}
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="text-[14px] leading-normal text-[#4A4553]">{rec.grounded_explanation}</div>
        {rec.model_percent != null && <div className="text-[13px] p-3 rounded-xl bg-[#FAF9F6] border border-[#D9D3E8]"><strong>How the match is made:</strong> rule score {rec.rule_percent}% (the five factors below) and trained-model fit {rec.model_percent}% for your priority, averaged to {rec.match_percent}%. The model was trained on synthetic data.</div>}
        {rec.score_breakdown.map((f) => (
          <div key={f.key}>
            <div className="flex justify-between text-[13px] font-semibold"><span>{f.label} <span className="font-medium text-[#6F6A7C]">· {Math.round(f.weight * 100)}%</span></span><span className="tabular-nums">{Math.round(f.score * 100)}%</span></div>
            <div className="h-2 rounded-full bg-[#E9E4FF] mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#7957FF]" style={{ width: `${f.score * 100}%` }} /></div>
            <div className="text-[12.5px] text-[#6F6A7C] mt-1 leading-snug">{f.detail}</div>
          </div>
        ))}
        {(rec.cons.length > 0 || p.notes?.length) ? (
          <div className="text-[13px] text-[#4A4553]"><strong>Things to know</strong><ul className="mt-1 mb-0 pl-5 flex flex-col gap-1">{[...rec.cons, ...(p.notes ?? [])].map((c) => <li key={c}>{c}</li>)}</ul></div>
        ) : null}
        <div className="text-[12.5px] text-[#6F6A7C]">Estimate for {fmt(rec.suggested_sum_assured)} cover: about {formatINR(monthly)} a month. Only the insurer can quote the exact price.</div>
      </div>
    </div>
  );
}

function PlanRow({ rec, monthly, selected, open, compared, onChoose, onToggleOpen, onToggleCompare }: {
  rec: RankedRecommendation; monthly: number; selected: boolean; open: boolean; compared: boolean;
  onChoose: () => void; onToggleOpen: () => void; onToggleCompare: () => void;
}) {
  const p = rec.product;
  const st = STATUS[p.data_status ?? "unverified_sample"];
  const unconfirmed = rec.eligibility_status === "eligibility_unconfirmed";
  return (
    <article className={`flex flex-col rounded-2xl border bg-[#FFFFFF] p-5 transition-all ${open ? "sm:col-span-2 lg:col-span-3" : ""} ${selected ? "border-[#7957FF] shadow-[0_4px_0_#7957FF]" : "border-[#D9D3E8] shadow-[0_3px_0_#E9E4FF,0_4px_0_#D9D3E8] hover:-translate-y-0.5"}`}>
      <div className="flex items-start gap-3">
        <span className="flex-none w-9 h-9 rounded-lg grid place-items-center text-[14px] font-extrabold bg-[#F1EEF8] text-[#24212B]">{rec.rank}</span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[17px] font-extrabold tracking-[-0.01em] leading-snug">{p.name}</h3>
          <div className="text-[13px] text-[#6F6A7C]">{shortInsurer(p.insurer)} · <span className={`font-semibold ${st.cls.split(" ")[1]}`}>{st.short}</span></div>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold shrink-0"><input type="checkbox" checked={compared} onChange={onToggleCompare} className="w-4 h-4 accent-[#7957FF]" />Compare</label>
      </div>

      <p className="m-0 mt-3 text-[14px] leading-normal text-[#5A5566] line-clamp-3 flex-1">{p.tagline}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#FAF9F6] border border-[#E9E4FF] p-3 [&_div.text-lg]:text-[16px] [&_div.text-lg]:whitespace-nowrap [&_span]:text-[10px]">
        <Stat title="Match" value={`${rec.match_percent}%`} />
        <Stat title="Claims" value={p.claim_settlement_ratio != null ? `${p.claim_settlement_ratio}%` : "n/a"} />
        <Stat title="Per month" value={`≈ ${formatINR(monthly)}`} />
      </div>

      {unconfirmed && <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-[#FFF4D6] text-[#7A5600] text-[13px]"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />Entry age limits couldn&apos;t be confirmed, so we can&apos;t say you qualify. Check with the insurer.</div>}

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onToggleOpen} aria-expanded={open} className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#7957FF] hover:underline">{open ? "Hide details" : "Details & why"}<ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
        <button type="button" onClick={onChoose} className={`h-10 px-5 rounded-lg text-[15px] font-bold border transition-all whitespace-nowrap ${selected ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]" : "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8] hover:border-[#7957FF]"}`}>
          {selected ? <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" strokeWidth={3} />Selected</span> : "Choose"}
        </button>
      </div>

      {open && <Details rec={rec} monthly={monthly} />}
    </article>
  );
}

/* ---------- Page ---------- */

export default function ProductsPage() {
  const router = useRouter();
  const { input, result, selectedProduct, customization, setSelectedProduct, setCustomization, setStage, isHydrated } = useAssessmentStore();

  const gap = result?.net_needs?.net_coverage_gap ?? 0;
  const retire = input.retirement_age ?? 60;
  const defaultTenure = Math.min(40, Math.max(10, retire - input.age));

  const [tenureOverride, setTenureOverride] = useState<number | null>(null);
  const [saOverride, setSaOverride] = useState<number | null>(null);
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const tenureYears = tenureOverride ?? defaultTenure;

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(selectedProduct?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [comparison, setComparison] = useState<(ProductCompareResponse & { error?: boolean }) | { error: true } | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [priority, setPriority] = useState<Priority>("balanced");
  const [mlInfo, setMlInfo] = useState<MlInfo | null>(null);

  useEffect(() => {
    if (isHydrated && !result) router.replace("/assessment");
  }, [isHydrated, result, router]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isHydrated || restored) return;
    if (customization) {
      setTenureOverride(customization.tenure_years);
      setSaOverride(customization.sum_assured);
      setSelectedRiders(customization.selected_riders ?? []);
      if (customization.selected_product_id) setActiveId(customization.selected_product_id);
    }
    setRestored(true);
  }, [isHydrated, restored, customization]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isHydrated || !result || !restored) return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsLoading(true);
    setLoadError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setTimeout(() => fetchFromAPI("/recommendations", {
      method: "POST",
      body: JSON.stringify({ age: input.age, annual_income: input.annual_income, coverage_gap: gap, dependents_count: input.dependents_count, desired_tenure_years: tenureYears, smoker_status: input.smoker_status || false, preferred_category: "term", priority }),
    })
      .then((res: RecommendationResponse) => {
        if (cancelled) return;
        setData(res);
        setActiveId((cur) => (cur && res.recommendations.some((r) => r.product.id === cur) ? cur : res.recommendations.find((r) => r.eligibility_status === "eligible")?.product.id ?? res.recommendations[0]?.product.id ?? null));
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setLoadError(err instanceof Error && !/failed to fetch|load failed|networkerror/i.test(err.message) ? err.message : "We couldn't reach the plan-matching service. Please make sure it is running and try again.");
      })
      .finally(() => !cancelled && setIsLoading(false)), 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isHydrated, result, restored, input, gap, tenureYears, reloadKey, priority]);

  useEffect(() => {
    if (!adjustOpen && !comparison) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setAdjustOpen(false); setComparison(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adjustOpen, comparison]);

  useEffect(() => {
    fetchFromAPI("/recommendations/model-info").then(setMlInfo).catch(() => setMlInfo(null));
  }, []);

  const recs = data?.recommendations ?? [];
  const available = recs.filter((r) => r.eligibility_status === "eligible" || r.eligibility_status === "eligibility_unconfirmed");
  const unavailable = recs.filter((r) => !available.includes(r));
  const best = available[0] ?? null;
  const rest = available.slice(1);
  const active = recs.find((r) => r.product.id === activeId) ?? null;
  const ap = active?.product ?? null;

  const minSA = Math.max(ap?.min_sum_assured || 0, 500000);
  const maxSA = ap && ap.max_sum_assured < NO_LIMIT ? ap.max_sum_assured : Math.max(gap * 2, 50_000_000);
  const sumAssured = Math.min(Math.max(saOverride ?? active?.suggested_sum_assured ?? gap, minSA), maxSA);
  const maxTerm = ap ? maxTermFor(ap, input.age) : 40;
  const minTerm = Math.min(ap?.min_term_years ?? 5, maxTerm);
  const tenure = Math.min(Math.max(tenureYears, minTerm), maxTerm);
  const smoker = Boolean(input.smoker_status);
  const annualPremium = indicativeAnnualPremium(sumAssured, input.age, smoker);
  const remainingGap = Math.max(0, gap - sumAssured);
  const monthlyFor = (r: RankedRecommendation) => Math.round(indicativeAnnualPremium(r.suggested_sum_assured, input.age, smoker) / 12);

  const choose = (rec: RankedRecommendation) => {
    setActiveId(rec.product.id);
    setSelectedProduct(rec.product);
    setSaOverride(null);
    setSelectedRiders([]);
  };
  const toggleCompare = (id: string) => setCompareList((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length < 3 ? [...l, id] : l));

  const runComparison = async () => {
    if (compareList.length < 2) return;
    setIsComparing(true);
    try {
      setComparison((await fetchFromAPI("/products/compare", { method: "POST", body: JSON.stringify({ product_ids: compareList, target_sum_assured: sumAssured, tenure_years: tenure, age: input.age, smoker_status: smoker }) })) as ProductCompareResponse);
    } catch {
      setComparison({ error: true });
    } finally {
      setIsComparing(false);
    }
  };

  const proceed = () => {
    if (!ap) return;
    const cfg: PolicyCustomization = {
      selected_product_id: ap.id, sum_assured: sumAssured, tenure_years: tenure,
      payment_frequency: customization?.payment_frequency ?? "monthly", selected_riders: selectedRiders,
      estimated_annual_premium: annualPremium, estimated_monthly_premium: Math.round(annualPremium / 12), remaining_gap: remainingGap,
    };
    setSelectedProduct(ap);
    setCustomization(cfg);
    setStage(4);
    router.push("/advisory");
  };

  if (!isHydrated || !result) {
    return (
      <div className="min-h-screen flex flex-col text-[#24212B]">
        <JourneyProgress currentStage={3} />
        <div className="flex-1 flex flex-col items-center justify-center p-8" role="status">
          <RefreshCw className="w-8 h-8 text-[#7957FF] animate-spin mb-4" />
          <h2 className="text-xl font-bold">Loading your plans…</h2>
          <p className="text-sm text-[#5A5566] mt-1">If you haven&apos;t completed the assessment yet, we&apos;ll take you back to it.</p>
        </div>
      </div>
    );
  }

  const asOf = recs[0]?.product.as_of;
  const bestMonthly = best ? monthlyFor(best) : 0;

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={3} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-5 sm:px-8 pt-6 pb-32 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-[clamp(26px,2.8vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em]" style={{ color: "#24212B" }}>Plans matched to you</h1>
          <p className="m-0 text-[16px] leading-[1.5] text-[#5A5566] max-w-[720px]">
            {gap > 0 ? <>You need about <strong className="text-[#24212B]">{fmt(gap)}</strong> of extra cover.</> : <>Your cover already meets your estimated need.</>} Real term plans, best match first.
          </p>
          <details className="group text-[14px] text-[#5A5566] max-w-[760px]" data-no-reveal>
            <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 font-semibold text-[#7957FF]"><Info className="w-4 h-4" />Where this data comes from<ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" /></summary>
            <p className="mt-2 mb-0 leading-normal"><strong>Coverage:</strong> we compare {recs.length} term plans from {new Set(recs.map((r) => r.product.insurer)).size} of the 24 life insurers registered with IRDAI. It is a checked selection, not every plan on the market. Plan details and the claim and solvency ratios are copied from each insurer&apos;s own documents and filings{asOf && <> (checked {dateFmt(asOf)})</>}, with sources in each plan&apos;s details. Premiums are <strong>estimates</strong>, so only the insurer can give an exact quote. Plans are scored on claims record (30%), financial strength (15%), fit to your cover and term (25%), affordability (15%) and riders and payout options (15%). We don&apos;t sell insurance.</p>
          </details>

          <div className="mt-2 flex flex-col gap-2" data-no-reveal>
            <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">What matters most to you?</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="What matters most">
              {PRIORITIES.map((o) => (
                <button key={o.value} type="button" onClick={() => setPriority(o.value)} aria-pressed={priority === o.value} title={o.hint}
                  className={`h-10 px-4 rounded-lg border text-[14.5px] font-semibold transition-all ${priority === o.value ? "bg-[#7957FF] border-[#7957FF] text-[#FFFFFF]" : "bg-[#FFFFFF] border-[#D9D3E8] text-[#24212B] hover:border-[#7957FF]"}`}>{o.label}</button>
              ))}
            </div>
            <p className="m-0 text-[13.5px] text-[#6F6A7C]">{PRIORITIES.find((o) => o.value === priority)?.hint}</p>
          </div>

          {mlInfo?.available && data?.ranking_method === "rules+trained-model" && (
            <details className="group text-[14px] text-[#5A5566] max-w-[820px]" data-no-reveal>
              <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 font-semibold text-[#7957FF]"><Info className="w-4 h-4" />How these plans are ranked (trained model, synthetic data)<ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" /></summary>
              <div className="mt-2 flex flex-col gap-2.5 leading-normal">
                <p className="m-0">The match is <strong>half a transparent rule score and half a scikit-learn model</strong> ({mlInfo.model}) trained on {mlInfo.training_households?.toLocaleString("en-IN")} <strong>synthetic</strong> households. Entry-age rules are applied first, and the model never overrides them.</p>
                {mlInfo.evaluation && (
                  <p className="m-0">On {mlInfo.evaluation.overall.model.top1 != null ? "households it had not seen (also synthetic)" : ""}, it picks the simulated buyer&apos;s plan first {Math.round(mlInfo.evaluation.overall.model.top1 * 100)}% of the time, against {Math.round(mlInfo.evaluation.overall.fixed_rule_baseline.top1 * 100)}% for a fixed rule and {Math.round(mlInfo.evaluation.overall.random.top1 * 100)}% for random. The best any model could do with the simulation&apos;s random choice noise is {Math.round(mlInfo.evaluation.overall.ceiling_known_preferences.top1 * 100)}%.</p>
                )}
                <ul className="m-0 pl-5 flex flex-col gap-1">{mlInfo.disclosure?.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
            </details>
          )}
        </header>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl border border-[#C23B3B] text-[#C23B3B] font-semibold" data-no-reveal>
            <span className="flex items-center gap-2.5"><AlertCircle className="w-5 h-5 shrink-0" />{loadError}</span>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="underline">Try again</button>
          </div>
        )}

        {isLoading && !data ? (
          <div className="p-14 text-center bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8]" role="status"><RefreshCw className="w-8 h-8 text-[#7957FF] animate-spin mx-auto mb-3" /><p className="font-bold m-0">Matching plans…</p></div>
        ) : available.length === 0 && !loadError ? (
          <div className="p-10 text-center bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8]"><h3 className="m-0 text-xl font-bold">No plan is open to you at age {input.age}</h3><p className="text-[#5A5566] mt-2 mb-0">All the term plans we cover have entry age limits below your age. An advisor can look at other options with you.</p></div>
        ) : (
          <div className={`flex flex-col gap-7 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
            {best && (
              <section aria-label="Best match" className="flex flex-col gap-3">
                <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-[#7957FF]">Best match for you</h2>
                <div className="rounded-3xl p-6 sm:p-8 text-[#FFFFFF] shadow-[0_18px_40px_-24px_rgba(121,87,255,0.7)]" style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}>
                  <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] items-center">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#E9E4FF]">{shortInsurer(best.product.insurer)}</span>
                        <span className="rounded-full bg-[rgba(255,255,255,0.2)] px-2.5 py-0.5 text-[12px] font-bold">{best.match_percent}% match</span>
                      </div>
                      <h3 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em]" style={{ color: "#FFFFFF" }}>{best.product.name}</h3>
                      <p className="m-0 text-[15px] leading-normal text-[#F1EEFF]">{best.product.tagline}</p>
                      <p className="m-0 text-[14px] leading-normal text-[#E9E4FF]">{best.grounded_explanation}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => choose(best)} className="h-11 px-6 rounded-lg bg-[#FFFFFF] text-[#7957FF] font-bold hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">{activeId === best.product.id ? <><Check className="w-4 h-4" strokeWidth={3} />Selected</> : "Choose this plan"}</button>
                        <button type="button" onClick={() => setOpenId(openId === best.product.id ? null : best.product.id)} className="h-11 px-5 rounded-lg border border-[rgba(255,255,255,0.45)] text-[#FFFFFF] font-semibold hover:bg-[rgba(255,255,255,0.12)]">{openId === best.product.id ? "Hide details" : "Details & why"}</button>
                        <label className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer"><input type="checkbox" checked={compareList.includes(best.product.id)} onChange={() => toggleCompare(best.product.id)} className="w-4 h-4 accent-white" />Compare</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Claims paid", best.product.claim_settlement_ratio != null ? `${best.product.claim_settlement_ratio}%` : "n/a"],
                        ["Solvency", best.product.solvency_ratio != null ? `${best.product.solvency_ratio}x` : "n/a"],
                        ["Est. per month", `≈ ${formatINR(bestMonthly)}`],
                        ["Cover", fmt(best.suggested_sum_assured)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-[rgba(255,255,255,0.14)] px-4 py-3"><div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E9E4FF]">{k}</div><div className="text-xl font-extrabold tabular-nums mt-0.5 whitespace-nowrap">{v}</div></div>
                      ))}
                    </div>
                  </div>
                  {openId === best.product.id && (
                    <div className="rounded-2xl bg-[#FFFFFF] text-[#24212B] p-6"><Details rec={best} monthly={bestMonthly} /></div>
                  )}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section aria-label="Other plans" className="flex flex-col gap-3">
                <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-[#7957FF]">Other plans ({rest.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {rest.map((r) => (
                    <PlanRow key={r.product.id} rec={r} monthly={monthlyFor(r)} selected={activeId === r.product.id} open={openId === r.product.id} compared={compareList.includes(r.product.id)}
                      onChoose={() => choose(r)} onToggleOpen={() => setOpenId(openId === r.product.id ? null : r.product.id)} onToggleCompare={() => toggleCompare(r.product.id)} />
                  ))}
                </div>
              </section>
            )}

            {unavailable.length > 0 && (
              <details className="rounded-2xl border border-[#D9D3E8] bg-[#FFFFFF]">
                <summary className="cursor-pointer px-5 py-4 font-bold">Not available for you ({unavailable.length})</summary>
                <ul className="m-0 px-5 pb-4 pl-10 flex flex-col gap-2 text-[14.5px] text-[#4A4553]">
                  {unavailable.map((r) => <li key={r.product.id}><strong>{shortInsurer(r.product.insurer)} {r.product.name}</strong>: {r.eligibility_status.replace("unsuitable: ", "")}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Selection bar */}
        {ap && (
          <div data-no-reveal className="sticky bottom-4 z-30">
            <div className="rounded-2xl bg-[rgba(255,255,255,0.96)] backdrop-blur-md border border-[#D9D3E8] shadow-[0_20px_50px_-20px_rgba(36,33,43,0.35)] px-5 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">Your choice</div>
                <div className="font-extrabold truncate">{shortInsurer(ap.insurer)} {ap.name}</div>
                <div className="text-[13.5px] text-[#5A5566] tabular-nums">{fmt(sumAssured)} cover · {tenure} yrs · ≈ {formatINR(Math.round(annualPremium / 12))}/month <span className="text-[#6F6A7C]">(estimate)</span></div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {compareList.length >= 2 && <button type="button" onClick={runComparison} disabled={isComparing} className="h-12 px-4 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center gap-2 shadow-[0_3px_0_#D9D3E8] disabled:opacity-60"><Scale className="w-4 h-4 text-[#7957FF]" />Compare {compareList.length}</button>}
                <button type="button" onClick={() => setAdjustOpen(true)} className="h-12 px-4 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center gap-2 shadow-[0_3px_0_#D9D3E8]"><SlidersHorizontal className="w-4 h-4 text-[#7957FF]" />Adjust cover &amp; term</button>
                <button type="button" onClick={proceed} className="h-12 px-6 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center gap-2">Talk to an advisor<ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {/* Adjust dialog */}
        {adjustOpen && ap && (
          <div className="fixed inset-0 z-50 bg-[#24212B]/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Adjust cover and term" onClick={() => setAdjustOpen(false)}>
            <div className="bg-[#FFFFFF] rounded-3xl max-w-[560px] w-full max-h-[90vh] overflow-y-auto p-7 sm:p-8 shadow-2xl border border-[#D9D3E8] flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="m-0 text-2xl font-extrabold tracking-[-0.02em]">Adjust your cover</h2><p className="m-0 mt-1 text-[14.5px] text-[#5A5566]">{shortInsurer(ap.insurer)} {ap.name}</p></div>
                <button onClick={() => setAdjustOpen(false)} className="p-2 rounded-lg hover:bg-[#F1EEF8]" aria-label="Close"><X className="w-5 h-5" /></button>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2"><label htmlFor="sa" className={label}>Sum assured</label><span className="text-xl font-extrabold tabular-nums">{fmt(sumAssured)}</span></div>
                <input id="sa" type="range" min={minSA} max={maxSA} step={100000} value={sumAssured} onChange={(e) => setSaOverride(Number(e.target.value))} className="w-full h-7 cursor-pointer" />
                <div className="flex justify-between text-[12.5px] text-[#6F6A7C] mt-1"><span>{fmt(minSA)}</span><span>Your need: {fmt(gap)}</span><span>{fmt(maxSA)}</span></div>
                <div className={`mt-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold flex items-center gap-2 ${remainingGap > 0 ? "bg-[#FFF4D6] text-[#7A5600]" : "bg-[#E9E4FF] text-[#7957FF]"}`}>
                  {remainingGap > 0 ? <><Info className="w-4 h-4 shrink-0" />{fmt(remainingGap)} of your need stays uncovered.</> : <><Check className="w-4 h-4 shrink-0" strokeWidth={3} />This covers your full estimated need.</>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2"><label htmlFor="term" className={label}>Policy term</label><span className="text-[13px] text-[#6F6A7C]">Covers to age {input.age + tenure}</span></div>
                <div className="flex items-center gap-3"><input id="term" type="range" min={minTerm} max={maxTerm} step={1} value={tenure} onChange={(e) => setTenureOverride(Number(e.target.value))} className="flex-1 h-7 cursor-pointer" /><span className="w-20 text-right text-xl font-extrabold tabular-nums">{tenure} yrs</span></div>
                <div className="flex justify-between text-[12.5px] text-[#6F6A7C] mt-1"><span>{minTerm} yrs</span><span>{maxTerm} yrs max for you</span></div>
              </div>

              <div>
                <span className={label}>Add-ons (riders)</span>
                {ap.riders_available.length ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {ap.riders_available.map((r) => {
                      const on = selectedRiders.includes(r);
                      return (
                        <button key={r} type="button" role="checkbox" aria-checked={on} onClick={() => setSelectedRiders((s) => (on ? s.filter((x) => x !== r) : [...s, r]))} className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-[14px] font-semibold flex items-center justify-between gap-3 transition-all ${on ? "bg-[#E9E4FF] border-[#7957FF]" : "bg-[#FFFFFF] border-[#D9D3E8] hover:border-[#7957FF]"}`}>
                          <span>{r}</span>
                          <span className={`w-5 h-5 rounded-md grid place-items-center border shrink-0 ${on ? "bg-[#7957FF] border-[#7957FF] text-white" : "border-[#D9D3E8]"}`}>{on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}</span>
                        </button>
                      );
                    })}
                    <p className="m-0 text-[12.5px] text-[#6F6A7C]">Rider prices are set by the insurer and aren&apos;t in the estimate.</p>
                  </div>
                ) : <p className="m-0 mt-2 text-[14px] text-[#6F6A7C]">This plan doesn&apos;t offer riders.</p>}
              </div>

              <div className="rounded-2xl p-5 bg-[#E9E4FF] border border-[#D9D3E8]">
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7957FF] mb-1">Estimated premium</div>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="text-3xl font-black tabular-nums tracking-[-0.03em]">{formatINR(Math.round(annualPremium / 12))}<span className="text-sm font-medium text-[#5A5566]"> /month</span></div>
                  <div className="text-[14px] font-bold text-[#7957FF] tabular-nums">{formatINR(annualPremium)} /year</div>
                </div>
                <p className="m-0 mt-2 pt-2 border-t border-[#D9D3E8] text-[12.5px] leading-snug text-[#5A5566]">An estimate, not a quotation. Your health, occupation and the insurer&apos;s underwriting will change it.{ap.quote_url && <> <a href={ap.quote_url} target="_blank" rel="noreferrer" className="text-[#7957FF] font-semibold hover:underline">Get the exact price</a></>}</p>
              </div>

              <button type="button" onClick={() => setAdjustOpen(false)} className="h-12 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold">Done</button>
            </div>
          </div>
        )}

        {/* Comparison dialog */}
        {comparison && (
          <div className="fixed inset-0 z-50 bg-[#24212B]/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Plan comparison" onClick={() => setComparison(null)}>
            <div className="bg-[#FFFFFF] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-9 shadow-2xl border border-[#D9D3E8]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#D9D3E8] mb-6">
                <div>
                  <h2 className="m-0 text-2xl font-extrabold tracking-[-0.02em] flex items-center gap-3"><Scale className="w-6 h-6 text-[#7957FF]" />Plan comparison</h2>
                  <p className="m-0 mt-1.5 text-[14.5px] text-[#5A5566]">{"error" in comparison && comparison.error ? "We couldn't load the comparison. Please try again." : (comparison as ProductCompareResponse).comparison_summary}</p>
                </div>
                <button onClick={() => setComparison(null)} className="p-2 rounded-lg hover:bg-[#F1EEF8]" aria-label="Close comparison"><X className="w-5 h-5" /></button>
              </div>
              {!("error" in comparison && comparison.error) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px] border-collapse min-w-[640px]">
                    <thead><tr className="border-b border-[#D9D3E8]"><th className="p-3 text-[12px] uppercase tracking-[0.12em] text-[#7957FF]">Compare</th>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <th key={i.product.id} className="p-3 font-extrabold">{i.product.name}<div className="text-[12px] font-medium text-[#6F6A7C]">{shortInsurer(i.product.insurer)}</div></th>)}</tr></thead>
                    <tbody className="divide-y divide-[#D9D3E8] align-top">
                      {([
                        ["Product number", (p: InsuranceProduct) => p.uin ?? "Not confirmed"],
                        ["Claims paid", (p: InsuranceProduct) => (p.claim_settlement_ratio != null ? `${p.claim_settlement_ratio}% (${p.claim_ratio_basis})` : "Not confirmed")],
                        ["Solvency ratio", (p: InsuranceProduct) => (p.solvency_ratio != null ? `${p.solvency_ratio}x (${p.solvency_basis})` : "Not confirmed")],
                        ["Entry age", entryRange],
                        ["Cover offered", coverRange],
                        ["Policy term", termRange],
                        ["Riders", (p: InsuranceProduct) => (p.riders_available.length ? p.riders_available.join(", ") : "None")],
                        ["Payout options", (p: InsuranceProduct) => p.death_benefit_options?.join(", ") || "Not confirmed"],
                        ["Exclusions", (p: InsuranceProduct) => p.exclusions.join(" ") || "Not confirmed"],
                      ] as [string, (p: InsuranceProduct) => string][]).map(([k, fn]) => (
                        <tr key={k}><td className="p-3 font-bold text-[#7957FF] w-40">{k}</td>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <td key={i.product.id} className="p-3">{fn(i.product)}</td>)}</tr>
                      ))}
                      <tr><td className="p-3 font-bold text-[#7957FF]">Est. premium</td>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <td key={i.product.id} className="p-3 font-extrabold tabular-nums">{formatINR(i.estimated_annual_premium)}/yr<div className="text-[12px] font-medium text-[#6F6A7C]">same method for all plans</div></td>)}</tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-6 pt-5 border-t border-[#D9D3E8] flex justify-end"><button onClick={() => setComparison(null)} className="h-12 px-6 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold">Close</button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
