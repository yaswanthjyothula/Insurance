"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, Sliders, ArrowRight, Scale, RefreshCw, Info, Check, X, ExternalLink, AlertCircle, ShieldCheck, ChevronDown, FileText } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { indicativeAnnualPremium } from "@/lib/premium";
import type { RankedRecommendation, RecommendationResponse, PolicyCustomization, ProductCompareResponse, ComparedProductItem } from "@/types/recommendation";
import type { InsuranceProduct } from "@/types/index";

const NO_LIMIT = 1e9;
const fmt = (n: number) => formatINR(n, { compact: true });
const dateFmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

function coverRange(p: InsuranceProduct) {
  if (!p.min_sum_assured && p.max_sum_assured >= NO_LIMIT) return "Not confirmed";
  const lo = p.min_sum_assured ? fmt(p.min_sum_assured) : "";
  const hi = p.max_sum_assured >= NO_LIMIT ? "no upper limit" : fmt(p.max_sum_assured);
  return lo ? `${lo} to ${hi}` : `up to ${hi}`;
}
function entryRange(p: InsuranceProduct) {
  return p.min_entry_age != null && p.max_entry_age != null ? `${p.min_entry_age} to ${p.max_entry_age} years` : "Not confirmed";
}
function termRange(p: InsuranceProduct) {
  if (p.min_term_years && p.max_maturity_age) return `${p.min_term_years}+ years, to age ${p.max_maturity_age}`;
  if (p.max_maturity_age) return `Up to age ${p.max_maturity_age}`;
  if (p.min_term_years) return `${p.min_term_years}+ years`;
  return "Not confirmed";
}
/** Longest term this plan can give at the buyer's age. */
function maxTermFor(p: InsuranceProduct, age: number) {
  let m = 40;
  if (p.max_term_years) m = Math.min(m, p.max_term_years);
  if (p.max_maturity_age) m = Math.min(m, p.max_maturity_age - age);
  return Math.max(m, 1);
}

const STATUS = {
  sourced: { label: "Checked against insurer documents", cls: "bg-[#E9E4FF] text-[#7957FF]" },
  partially_sourced: { label: "Partly verified", cls: "bg-[#FFF4D6] text-[#9A6A00]" },
  unverified_sample: { label: "Sample, not verified", cls: "bg-[#F1EEF8] text-[#6F6A7C]" },
} as const;

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
  const [compareList, setCompareList] = useState<string[]>([]);
  const [comparison, setComparison] = useState<(ProductCompareResponse & { error?: boolean }) | { error: true } | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Bring back this visitor's earlier choices once the saved session has loaded
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
    if (isHydrated && !result) router.replace("/assessment");
  }, [isHydrated, result, router]);

  useEffect(() => {
    if (!isHydrated || !result || !restored) return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsLoading(true);
    setLoadError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setTimeout(() => fetchFromAPI("/recommendations", {
      method: "POST",
      body: JSON.stringify({
        age: input.age,
        annual_income: input.annual_income,
        coverage_gap: gap,
        dependents_count: input.dependents_count,
        desired_tenure_years: tenureYears,
        smoker_status: input.smoker_status || false,
        preferred_category: "term",
      }),
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
  }, [isHydrated, result, restored, input, gap, tenureYears, reloadKey]);

  const recs = data?.recommendations ?? [];
  const available = recs.filter((r) => r.eligibility_status === "eligible" || r.eligibility_status === "eligibility_unconfirmed");
  const unavailable = recs.filter((r) => !available.includes(r));
  const active = recs.find((r) => r.product.id === activeId) ?? null;
  const ap = active?.product ?? null;

  // Studio values, kept inside what the chosen plan actually offers
  const minSA = Math.max(ap?.min_sum_assured || 0, 500000);
  const maxSA = ap && ap.max_sum_assured < NO_LIMIT ? ap.max_sum_assured : Math.max(gap * 2, 50_000_000);
  const sumAssured = Math.min(Math.max(saOverride ?? active?.suggested_sum_assured ?? gap, minSA), maxSA);
  const maxTerm = ap ? maxTermFor(ap, input.age) : 40;
  const minTerm = Math.min(ap?.min_term_years ?? 5, maxTerm);
  const tenure = Math.min(Math.max(tenureYears, minTerm), maxTerm);
  const annualPremium = indicativeAnnualPremium(sumAssured, input.age, Boolean(input.smoker_status));
  const remainingGap = Math.max(0, gap - sumAssured);
  const riderOptions = ap?.riders_available ?? [];

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
      setComparison((await fetchFromAPI("/products/compare", { method: "POST", body: JSON.stringify({ product_ids: compareList, target_sum_assured: sumAssured, tenure_years: tenure, age: input.age, smoker_status: input.smoker_status || false }) })) as ProductCompareResponse);
    } catch {
      setComparison({ error: true });
    } finally {
      setIsComparing(false);
    }
  };

  const proceed = () => {
    if (!ap) return;
    const cfg: PolicyCustomization = {
      selected_product_id: ap.id,
      sum_assured: sumAssured,
      tenure_years: tenure,
      payment_frequency: customization?.payment_frequency ?? "monthly",
      selected_riders: selectedRiders,
      estimated_annual_premium: annualPremium,
      estimated_monthly_premium: Math.round(annualPremium / 12),
      remaining_gap: remainingGap,
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

  const card = "ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl";
  const label = "block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]";
  const asOf = available[0]?.product.as_of ?? recs[0]?.product.as_of;

  const renderPlan = (rec: RankedRecommendation) => {
    const p = rec.product;
    const isActive = activeId === p.id;
    const st = STATUS[p.data_status ?? "unverified_sample"];
    const unconfirmed = rec.eligibility_status === "eligibility_unconfirmed";
    const monthly = Math.round(indicativeAnnualPremium(rec.suggested_sum_assured, input.age, Boolean(input.smoker_status)) / 12);
    return (
      <article key={p.id} className={`bg-[#FFFFFF] rounded-3xl border p-6 sm:p-7 flex flex-col gap-5 transition-all ${isActive ? "border-[#7957FF] shadow-[0_5px_0_#7957FF,0_30px_50px_-30px_rgba(121,87,255,0.5)]" : "border-[#D9D3E8] shadow-[0_4px_0_#E9E4FF,0_5px_0_#D9D3E8]"}`}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4 items-start min-w-0">
            <span className="flex-none w-11 h-11 rounded-xl grid place-items-center font-extrabold text-white bg-[#7957FF] shadow-[0_3px_0_#5B3BE6]">#{rec.rank}</span>
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7957FF] truncate">{p.insurer}</div>
              <h3 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{p.name}</h3>
              <div className="text-[13px] text-[#6F6A7C] mt-0.5">{p.uin ? `UIN ${p.uin}` : "UIN not confirmed"}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E9E4FF] text-[#7957FF] text-base font-extrabold tabular-nums">{rec.match_percent}% match</div>
            <div className={`mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-md ${st.cls}`}><ShieldCheck className="w-3.5 h-3.5" />{st.label}</div>
          </div>
        </header>

        <p className="m-0 text-[15px] leading-normal text-[#4A4553]">{p.tagline}</p>

        {unconfirmed && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FFF4D6] text-[#7A5600] text-[14px]"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />We could not confirm this plan&apos;s entry age limits from the insurer&apos;s documents, so we can&apos;t say you qualify. Check with the insurer.</div>
        )}

        <dl className="m-0 grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
          <div>
            <dt className={label}>Claim settlement</dt>
            <dd className="m-0 mt-1 text-lg font-extrabold tabular-nums">{p.claim_settlement_ratio != null ? `${p.claim_settlement_ratio}%` : "Not confirmed"}</dd>
            {p.claim_settlement_ratio != null && <div className="text-[12px] text-[#6F6A7C] leading-snug mt-0.5">{p.claim_ratio_basis}{p.claim_ratio_source_url && <> · <a href={p.claim_ratio_source_url} target="_blank" rel="noreferrer" className="text-[#7957FF] font-semibold hover:underline">source</a></>}</div>}
          </div>
          <div>
            <dt className={label}>Solvency ratio</dt>
            <dd className="m-0 mt-1 text-lg font-extrabold tabular-nums">{p.solvency_ratio != null ? `${p.solvency_ratio}x` : "Not confirmed"}</dd>
            {p.solvency_ratio != null && <div className="text-[12px] text-[#6F6A7C] leading-snug mt-0.5">{p.solvency_basis}; minimum 1.5x{p.solvency_source_url && <> · <a href={p.solvency_source_url} target="_blank" rel="noreferrer" className="text-[#7957FF] font-semibold hover:underline">source</a></>}</div>}
          </div>
          <div>
            <dt className={label}>Est. premium</dt>
            <dd className="m-0 mt-1 text-lg font-extrabold tabular-nums">≈ {formatINR(monthly)}<span className="text-sm font-medium text-[#6F6A7C]"> /month</span></dd>
            <div className="text-[12px] text-[#6F6A7C] mt-0.5">estimate for {fmt(rec.suggested_sum_assured)} cover</div>
          </div>
          <div><dt className={label}>Cover offered</dt><dd className="m-0 mt-1 text-[15px] font-bold">{coverRange(p)}</dd></div>
          <div><dt className={label}>Entry age</dt><dd className="m-0 mt-1 text-[15px] font-bold">{entryRange(p)}</dd></div>
          <div><dt className={label}>Policy term</dt><dd className="m-0 mt-1 text-[15px] font-bold">{termRange(p)}</dd></div>
        </dl>

        <div className="flex flex-col gap-3 text-[14px]">
          <div><span className={label}>Riders</span><div className="flex flex-wrap gap-1.5 mt-1.5">{p.riders_available.length ? p.riders_available.map((r) => <span key={r} className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[13px]">{r}</span>) : <span className="text-[#6F6A7C]">None offered with this plan</span>}</div></div>
          <div><span className={label}>Payout options</span><div className="flex flex-wrap gap-1.5 mt-1.5">{p.death_benefit_options?.length ? p.death_benefit_options.map((r) => <span key={r} className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[13px]">{r}</span>) : <span className="text-[#6F6A7C]">Not confirmed</span>}</div></div>
        </div>

        {p.sample_premium && (
          <div className="text-[13.5px] text-[#4A4553] p-3.5 rounded-xl bg-[#FAF9F6] border border-[#D9D3E8]">
            <strong>Official sample price:</strong> age {p.sample_premium.age}, {fmt(p.sample_premium.cover)} cover, {p.sample_premium.term_years} years: {formatINR(p.sample_premium.annual_premium)} a year. <span className="text-[#6F6A7C]">{p.sample_premium.note}.</span>
          </div>
        )}

        <details className="group rounded-xl border border-[#D9D3E8] bg-[#FAF9F6]">
          <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between font-bold text-[15px]">
            <span>Why this match</span><ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 flex flex-col gap-3.5">
            <p className="m-0 text-[14px] leading-normal text-[#4A4553]">{rec.grounded_explanation}</p>
            {rec.score_breakdown.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-[13px] font-semibold"><span>{f.label} <span className="font-medium text-[#6F6A7C]">· {Math.round(f.weight * 100)}% of score</span></span><span className="tabular-nums">{Math.round(f.score * 100)}%</span></div>
                <div className="h-2 rounded-full bg-[#E9E4FF] mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#7957FF]" style={{ width: `${f.score * 100}%` }} /></div>
                <div className="text-[12.5px] text-[#6F6A7C] mt-1 leading-snug">{f.detail}</div>
              </div>
            ))}
            {(rec.cons.length > 0 || p.notes?.length) && (
              <div className="text-[13px] text-[#4A4553]"><strong>Things to know</strong><ul className="mt-1 mb-0 pl-5 flex flex-col gap-1">{[...rec.cons, ...(p.notes ?? [])].map((c) => <li key={c}>{c}</li>)}</ul></div>
            )}
          </div>
        </details>

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D9D3E8]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
            <label className="flex items-center gap-2 cursor-pointer font-semibold"><input type="checkbox" checked={compareList.includes(p.id)} onChange={() => toggleCompare(p.id)} className="w-4 h-4 accent-[#7957FF]" />Compare</label>
            {p.product_page_url && <a href={p.product_page_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Plan page<ExternalLink className="w-3.5 h-3.5" /></a>}
            {p.brochure_url && <a href={p.brochure_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline"><FileText className="w-3.5 h-3.5" />Brochure</a>}
            {p.quote_url && <a href={p.quote_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7957FF] font-semibold hover:underline">Get the exact price<ExternalLink className="w-3.5 h-3.5" /></a>}
          </div>
          <button type="button" onClick={() => choose(rec)} className={`h-11 px-5 rounded-lg text-[15px] font-bold border transition-all ${isActive ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]" : "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5"}`}>
            {isActive ? "Selected" : "Customise this plan"}
          </button>
        </footer>
      </article>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={3} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-5 sm:px-8 pt-12 pb-28 flex flex-col gap-8">
        <div className="ls-persp">
          <div data-scroll-tilt="5" className={`${card} px-8 sm:px-11 py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6 [transform-origin:bottom_center]`}>
            <div className="max-w-[760px]">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[13px] font-bold uppercase tracking-[0.14em] mb-4"><Award className="w-3.5 h-3.5" />Stage 3 of 4: Plan matching &amp; customisation</div>
              <h1 className="m-0 text-[clamp(30px,3.4vw,46px)] leading-[1.05] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>Real term plans, matched to you</h1>
              <p className="text-[17px] leading-[1.55] text-[#5A5566] mt-3 mb-0">
                {gap > 0 ? <>We compared real term plans from {recs.length || 8} insurers against your <strong>{fmt(gap)}</strong> cover need.</> : <>Your cover already meets your estimated need. Here are real term plans if you still want more.</>}
                {data && <> {data.eligible_count} {data.eligible_count === 1 ? "is" : "are"} open to you based on confirmed age limits.</>}
              </p>
            </div>
            {compareList.length >= 2 && (
              <button type="button" onClick={runComparison} disabled={isComparing} className="h-14 px-6 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center gap-2.5 shrink-0 disabled:opacity-60"><Scale className="w-5 h-5" />Compare {compareList.length} plans</button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] text-[14.5px] leading-normal text-[#4A4553]" data-no-reveal>
          <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
          <div>
            <strong className="text-[#24212B]">Where this comes from.</strong> Plan details, claim settlement and solvency ratios are copied from each insurer&apos;s own documents and public filings{asOf && <> (checked {dateFmt(asOf)})</>}, with a source link on each. Premiums are <strong>estimates</strong> calibrated to one insurer&apos;s published sample prices, so only the insurer can give an exact quote. We don&apos;t sell insurance. Claim ratios use different bases and years across insurers, so treat small differences with care.
          </div>
        </div>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl border border-[#C23B3B] text-[#C23B3B] font-semibold" data-no-reveal>
            <span className="flex items-center gap-2.5"><AlertCircle className="w-5 h-5 shrink-0" />{loadError}</span>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="underline">Try again</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Plans */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-[#7957FF]">Ranked plans ({available.length})</h2>
              {data && <span className="text-[13px] text-[#6F6A7C]">{data.model_version.replace(/-/g, " ")} · five published factors</span>}
            </div>

            {isLoading && !data ? (
              <div className="p-14 text-center bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8]" role="status"><RefreshCw className="w-8 h-8 text-[#7957FF] animate-spin mx-auto mb-3" /><p className="font-bold m-0">Matching plans…</p></div>
            ) : available.length === 0 && !loadError ? (
              <div className="p-10 text-center bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8]"><h3 className="m-0 text-xl font-bold">No plan is open to you at age {input.age}</h3><p className="text-[#5A5566] mt-2 mb-0">All the term plans we cover have entry age limits below your age. An advisor can look at other options with you.</p></div>
            ) : (
              <div className={`flex flex-col gap-5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>{available.map((r) => renderPlan(r))}</div>
            )}

            {unavailable.length > 0 && (
              <details className="rounded-2xl border border-[#D9D3E8] bg-[#FFFFFF]">
                <summary className="cursor-pointer px-5 py-4 font-bold">Not available for you ({unavailable.length})</summary>
                <ul className="m-0 px-5 pb-4 pl-10 flex flex-col gap-2 text-[14.5px] text-[#4A4553]">
                  {unavailable.map((r) => <li key={r.product.id}><strong>{r.product.insurer} {r.product.name}</strong>: {r.eligibility_status.replace("unsuitable: ", "")}</li>)}
                </ul>
              </details>
            )}
          </div>

          {/* Studio */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className={`${card} p-7 flex flex-col gap-6`} data-no-reveal>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#7957FF] uppercase tracking-[0.14em] mb-1.5"><Sliders className="w-3.5 h-3.5" />Customisation studio</div>
                <h3 className="m-0 text-2xl font-extrabold tracking-[-0.02em]">{ap ? `${ap.insurer.split(" ")[0]} ${ap.name}` : "Select a plan"}</h3>
                <p className="m-0 mt-1 text-[14.5px] text-[#5A5566]">Change the cover and term to see the estimate move.</p>
              </div>

              {ap ? (
                <>
                  <div>
                    <div className="flex justify-between items-baseline mb-2"><label htmlFor="sa" className={label}>Sum assured</label><span className="text-lg font-extrabold tabular-nums">{fmt(sumAssured)}</span></div>
                    <input id="sa" type="range" min={minSA} max={maxSA} step={100000} value={sumAssured} onChange={(e) => setSaOverride(Number(e.target.value))} className="w-full h-7 cursor-pointer" />
                    <div className="flex justify-between text-[12.5px] text-[#6F6A7C] mt-1"><span>{fmt(minSA)}</span><span>Your need: {fmt(gap)}</span><span>{fmt(maxSA)}</span></div>
                    <div className={`mt-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold flex items-center gap-2 ${remainingGap > 0 ? "bg-[#FFF4D6] text-[#7A5600]" : "bg-[#E9E4FF] text-[#7957FF]"}`}>
                      {remainingGap > 0 ? <><Info className="w-4 h-4 shrink-0" />{fmt(remainingGap)} of your need stays uncovered.</> : <><Check className="w-4 h-4 shrink-0" strokeWidth={3} />This covers your full estimated need.</>}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-2"><label htmlFor="term" className={label}>Policy term</label><span className="text-[13px] text-[#6F6A7C]">Covers to age {input.age + tenure}</span></div>
                    <div className="flex items-center gap-3"><input id="term" type="range" min={minTerm} max={maxTerm} step={1} value={tenure} onChange={(e) => setTenureOverride(Number(e.target.value))} className="flex-1 h-7 cursor-pointer" /><span className="w-20 text-right text-lg font-extrabold tabular-nums">{tenure} yrs</span></div>
                    <div className="flex justify-between text-[12.5px] text-[#6F6A7C] mt-1"><span>{minTerm} yrs</span><span>{maxTerm} yrs max for you</span></div>
                  </div>

                  <div>
                    <span className={label}>Riders (add-ons)</span>
                    {riderOptions.length ? (
                      <div className="flex flex-col gap-2 mt-2">
                        {riderOptions.map((r) => {
                          const on = selectedRiders.includes(r);
                          return (
                            <button key={r} type="button" role="checkbox" aria-checked={on} onClick={() => setSelectedRiders((s) => (on ? s.filter((x) => x !== r) : [...s, r]))} className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-[14px] font-semibold flex items-center justify-between gap-3 transition-all ${on ? "bg-[#E9E4FF] border-[#7957FF]" : "bg-[#FFFFFF] border-[#D9D3E8] hover:border-[#7957FF]"}`}>
                              <span>{r}</span>
                              <span className={`w-5 h-5 rounded-md grid place-items-center border shrink-0 ${on ? "bg-[#7957FF] border-[#7957FF] text-white" : "border-[#D9D3E8]"}`}>{on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}</span>
                            </button>
                          );
                        })}
                        <p className="m-0 text-[12.5px] text-[#6F6A7C]">Rider prices are set by the insurer and are not in the estimate below.</p>
                      </div>
                    ) : (
                      <p className="m-0 mt-2 text-[14px] text-[#6F6A7C]">This plan does not offer riders.</p>
                    )}
                  </div>

                  <div className="rounded-2xl p-5 bg-[#E9E4FF] border border-[#D9D3E8]">
                    <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7957FF] mb-1">Estimated premium (base cover)</div>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="text-3xl font-black tabular-nums tracking-[-0.03em]">{formatINR(Math.round(annualPremium / 12))}<span className="text-sm font-medium text-[#5A5566]"> /month</span></div>
                      <div className="text-[14px] font-bold text-[#7957FF] tabular-nums">{formatINR(annualPremium)} /year</div>
                    </div>
                    <p className="m-0 mt-2.5 pt-2.5 border-t border-[#D9D3E8] text-[12.5px] leading-snug text-[#5A5566]">An estimate, not a quotation. It is calibrated to published sample prices for a non-smoking male{input.smoker_status ? ", with a smoker loading of about 50%" : ""}, and your health, occupation and the insurer&apos;s underwriting will change it. {ap.quote_url && <a href={ap.quote_url} target="_blank" rel="noreferrer" className="text-[#7957FF] font-semibold hover:underline">Get the exact price on the insurer&apos;s site</a>}</p>
                  </div>

                  <button type="button" onClick={proceed} className="w-full h-14 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold inline-flex items-center justify-center gap-2.5">
                    Continue to Stage 4: talk to an advisor<ArrowRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <p className="m-0 text-[#5A5566]">Pick a plan on the left to customise it.</p>
              )}
            </div>
          </aside>
        </div>

        {comparison && (
          <div className="fixed inset-0 z-50 bg-[#24212B]/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Plan comparison">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-9 shadow-2xl border border-[#D9D3E8]">
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
                    <thead><tr className="border-b border-[#D9D3E8]"><th className="p-3 text-[12px] uppercase tracking-[0.12em] text-[#7957FF]">Compare</th>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <th key={i.product.id} className="p-3 font-extrabold">{i.product.name}<div className="text-[12px] font-medium text-[#6F6A7C]">{i.product.insurer}</div></th>)}</tr></thead>
                    <tbody className="divide-y divide-[#D9D3E8] align-top">
                      {([
                        ["Product number (UIN)", (p: InsuranceProduct) => p.uin ?? "Not confirmed"],
                        ["Claim settlement", (p: InsuranceProduct) => (p.claim_settlement_ratio != null ? `${p.claim_settlement_ratio}% (${p.claim_ratio_basis})` : "Not confirmed")],
                        ["Solvency ratio", (p: InsuranceProduct) => (p.solvency_ratio != null ? `${p.solvency_ratio}x (${p.solvency_basis})` : "Not confirmed")],
                        ["Entry age", entryRange],
                        ["Cover offered", coverRange],
                        ["Policy term", termRange],
                        ["Riders", (p: InsuranceProduct) => (p.riders_available.length ? p.riders_available.join(", ") : "None")],
                        ["Payout options", (p: InsuranceProduct) => p.death_benefit_options?.join(", ") || "Not confirmed"],
                        ["Suicide clause / exclusions", (p: InsuranceProduct) => p.exclusions.join(" ") || "Not confirmed"],
                      ] as [string, (p: InsuranceProduct) => string][]).map(([k, fn]) => (
                        <tr key={k}><td className="p-3 font-bold text-[#7957FF] w-44">{k}</td>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <td key={i.product.id} className="p-3">{fn(i.product)}</td>)}</tr>
                      ))}
                      <tr><td className="p-3 font-bold text-[#7957FF]">Estimated premium</td>{(comparison as ProductCompareResponse).compared_products.map((i: ComparedProductItem) => <td key={i.product.id} className="p-3 font-extrabold tabular-nums">{formatINR(i.estimated_annual_premium)}/yr<div className="text-[12px] font-medium text-[#6F6A7C]">estimate, same method for all plans</div></td>)}</tr>
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
