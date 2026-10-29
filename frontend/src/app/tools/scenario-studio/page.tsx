"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Bot, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { ToolShell, Panel, Segmented, NumberField, Count, Verdict } from "@/components/tools/kit";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { useAssessmentStore } from "@/store/assessment-store";

type Needs = { total_gross_need: number; net_coverage_gap: number };
type Diff = { field?: string; label?: string; baseline_value: unknown; scenario_value: unknown };
type Comparison = {
  title: string; description: string; explanation: string;
  baseline_result: { net_needs: Needs }; scenario_result: { net_needs: Needs };
  diffs: Diff[]; cover_difference: number; estimated_premium_difference: number;
};
type AiResponse = { ai_title?: string; ai_analysis?: string; actionable_recommendations?: string[]; model_used?: string };

const PRESETS = [
  { id: "another_child", title: "Another child", desc: "One more dependent, a college goal, and higher living costs." },
  { id: "retire_55", title: "Retire at 55", desc: "Five fewer earning years to protect." },
  { id: "income_down_20", title: "Income down 20%", desc: "A pay cut or career break." },
  { id: "loan_cleared", title: "Loan cleared early", desc: "Debt goes to zero, so the cover you need falls." },
  { id: "add_home_loan", title: "New home loan (₹50 L)", desc: "A fresh mortgage your family would inherit." },
];

const EXAMPLES = [
  "I am leaving my job to start a business with no salary for 12 months, taking a ₹15 lakh loan, and we are expecting a baby.",
  "We are buying a flat with a ₹75 lakh home loan and my spouse is taking a two-year study break.",
  "I want to retire at 45 and move to a smaller city where our costs fall by 25%.",
];

const EXAMPLE_BASELINE = { age: 32, annual_income: 1800000, annual_expenses: 720000, dependents_count: 2, support_horizon_years: 25, outstanding_liabilities: 4000000, existing_cover: 5000000, eligible_assets: 2000000, retirement_age: 60, inflation_rate: 0.06, discount_rate: 0.075, smoker_status: false };

export default function ScenarioStudioPage() {
  const store = useAssessmentStore();
  const [base, setBase] = useState(EXAMPLE_BASELINE);
  const [usingOwn, setUsingOwn] = useState(false);
  const [mode, setMode] = useState<"describe" | "pick">("describe");
  const [presetId, setPresetId] = useState("another_child");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Comparison | null>(null);
  const [ai, setAi] = useState<AiResponse | null>(null);
  const [saved, setSaved] = useState<{ title?: string; cover_difference?: number }[]>([]);

  const hasOwn = store.isHydrated && store.input.annual_income > 0;
  const set = (k: keyof typeof EXAMPLE_BASELINE, v: number) => setBase((b) => ({ ...b, [k]: v }));

  const useMine = () => {
    const i = store.input;
    setBase({ ...EXAMPLE_BASELINE, age: i.age || 32, annual_income: i.annual_income, annual_expenses: i.annual_expenses, dependents_count: i.dependents_count, support_horizon_years: i.support_horizon_years ?? i.years_support_needed ?? 25, outstanding_liabilities: i.outstanding_liabilities, existing_cover: i.existing_cover, eligible_assets: i.eligible_assets, retirement_age: i.retirement_age ?? 60, smoker_status: !!i.smoker_status });
    setUsingOwn(true);
  };

  const loadSaved = useCallback(async () => {
    try { setSaved((await fetchFromAPI("/scenarios")) || []); } catch { /* list is optional */ }
  }, []);

  const runPreset = async (id: string) => {
    setLoading(true); setError(null); setPresetId(id);
    try {
      const p = PRESETS.find((x) => x.id === id);
      const res = await fetchFromAPI("/scenarios", { method: "POST", body: JSON.stringify({ scenario: { scenario_type: id, title: p?.title ?? "Scenario", description: p?.desc ?? "" }, baseline_input: base }) });
      setResult(res); setAi(null); loadSaved();
    } catch { setError("We couldn't reach the calculation service. Make sure the backend is running and try again."); }
    finally { setLoading(false); }
  };

  const runAi = async (text?: string) => {
    const t = (text ?? prompt).trim();
    if (t.length < 3) { setError("Describe what is changing in a sentence or two."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetchFromAPI("/scenarios/ai-custom", { method: "POST", body: JSON.stringify({ user_scenario_prompt: t, baseline_input: base }) });
      setResult(res.scenario_comparison);
      setAi({ ai_title: res.ai_title, ai_analysis: res.ai_analysis, actionable_recommendations: res.actionable_recommendations, model_used: res.model_used });
      loadSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "The AI scenario could not be run. Try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage or fetched after mount
    loadSaved();
  }, [loadSaved]);

  const before = result?.baseline_result.net_needs.net_coverage_gap ?? 0;
  const after = result?.scenario_result.net_needs.net_coverage_gap ?? 0;
  const delta = result?.cover_difference ?? 0;
  const max = Math.max(before, after, 1);

  return (
    <ToolShell slug="scenario-studio" wide>
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: baseline */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <Panel title="Your starting point">
            <p className="-mt-2 mb-4 text-sm leading-6 text-[#4A4658]">{usingOwn ? "Using your Needs Finder answers. Edit any number." : "These are example numbers. Replace them with yours."}</p>
            {hasOwn && !usingOwn && <button type="button" onClick={useMine} className="mb-4 w-full rounded-xl border border-[#7957FF] bg-[#E9E4FF] px-4 py-2.5 text-sm font-bold text-[#7957FF] hover:bg-[#DDD5FF]">Use my Needs Finder numbers</button>}
            <div className="space-y-4">
              <NumberField label="Age" prefix="" value={base.age} onChange={(v) => set("age", v)} />
              <NumberField label="Yearly income" value={base.annual_income} onChange={(v) => set("annual_income", v)} />
              <NumberField label="Yearly expenses" value={base.annual_expenses} onChange={(v) => set("annual_expenses", v)} />
              <NumberField label="Loans outstanding" value={base.outstanding_liabilities} onChange={(v) => set("outstanding_liabilities", v)} />
              <NumberField label="Existing life cover" value={base.existing_cover} onChange={(v) => set("existing_cover", v)} />
              <NumberField label="Savings and investments" value={base.eligible_assets} onChange={(v) => set("eligible_assets", v)} />
              <NumberField label="Dependents" prefix="" value={base.dependents_count} onChange={(v) => set("dependents_count", v)} />
            </div>
          </Panel>
        </aside>

        {/* Right: scenario + result */}
        <div className="lg:col-span-8 space-y-5">
          <Panel>
            <Segmented label="How do you want to set the change?" value={mode} onChange={setMode} options={[{ value: "describe", label: "Describe it" }, { value: "pick", label: "Pick an event" }]} />
            {mode === "describe" ? (
              <div className="mt-5">
                <label htmlFor="scn" className="text-sm font-semibold text-[#24212B]">What is changing in your life?</label>
                <textarea id="scn" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="For example: we are buying a flat with a ₹60 lakh loan and I am moving to part-time work."
                  className="mt-2 w-full rounded-xl border border-[#D9D3E8] bg-[#FAF9F6] p-3 text-[15px] leading-6 text-[#24212B] focus:border-[#7957FF] focus:outline-none" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXAMPLES.map((e) => <button key={e} type="button" onClick={() => setPrompt(e)} className="rounded-full border border-[#D9D3E8] bg-white px-3 py-1.5 text-left text-sm text-[#4A4658] hover:border-[#7957FF]">{e.length > 56 ? e.slice(0, 56) + "…" : e}</button>)}
                </div>
                <button type="button" onClick={() => runAi()} disabled={loading} data-magnetic className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7957FF] px-5 py-3 text-[15px] font-bold text-white disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Reading your scenario, up to 30 seconds</> : <><Sparkles className="w-4 h-4" />Run this scenario</>}
                </button>
                <p className="mt-2 text-sm text-[#6F6A7C]">An AI model turns your words into changes to the numbers on the left. The cover maths is then done by fixed rules, not by the AI.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" onClick={() => runPreset(p.id)} disabled={loading} aria-pressed={presetId === p.id && !ai && !!result}
                    className={`ls-spot rounded-2xl border p-4 text-left transition-colors ${presetId === p.id && !ai && result ? "border-[#7957FF] bg-[#E9E4FF]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}>
                    <span className="block text-[15px] font-bold text-[#24212B]">{p.title}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-[#4A4658]">{p.desc}</span>
                  </button>
                ))}
              </div>
            )}
            {error && <div className="mt-4"><Verdict tone="bad">{error}</Verdict></div>}
          </Panel>

          {result ? (
            <div className="space-y-5 ls-pop">
              <Panel>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">{ai ? "Your scenario" : "Scenario"}</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#24212B]">{ai?.ai_title || result.title}</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C]">Cover needed now</p>
                    <p className="mt-1 text-3xl font-extrabold text-[#24212B]">{formatINR(before, { compact: true })}</p>
                    <div className="mt-2 h-3 rounded-full bg-[#E9E4FF]"><div className="h-full rounded-full bg-[#D9D3E8] transition-all duration-700" style={{ width: `${(before / max) * 100}%` }} /></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C]">Cover needed after</p>
                    <p className="mt-1 text-3xl font-extrabold text-[#7957FF]"><Count value={after} format={(v) => formatINR(v, { compact: true })} /></p>
                    <div className="mt-2 h-3 rounded-full bg-[#E9E4FF]"><div className="h-full rounded-full bg-[#7957FF] transition-all duration-700" style={{ width: `${(after / max) * 100}%` }} /></div>
                  </div>
                </div>
                <div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3 ${delta > 0 ? "bg-[#FFF3E0] text-[#8A4B06]" : "bg-[#E7F6F0] text-[#0B5E49]"}`}>
                  <span className="inline-flex items-center gap-1.5 text-lg font-extrabold">{delta > 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}{delta > 0 ? "+" : "-"}{formatINR(Math.abs(delta), { compact: true })} cover</span>
                  <span className="text-[15px] font-semibold">{result.estimated_premium_difference >= 0 ? "+" : "-"}{formatINR(Math.abs(result.estimated_premium_difference))} a year in premium (estimate)</span>
                </div>
                {result.explanation && <p className="mt-4 text-[15px] leading-7 text-[#4A4658]">{result.explanation}</p>}
              </Panel>

              {ai?.ai_analysis && (
                <Panel>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7957FF]"><Bot className="w-4 h-4" />AI reading of your scenario{ai.model_used ? <span className="font-medium text-[#6F6A7C]"> · {ai.model_used}</span> : null}</div>
                  {ai.model_used?.includes("heuristic") && <div className="mt-3"><Verdict tone="warn">The AI model did not answer in time, so this used a simple built-in reading of your text. Amounts may be approximate. Check the numbers in the table below, or try again.</Verdict></div>}
                  <p className="mt-2 text-[15px] leading-7 text-[#24212B]">{ai.ai_analysis}</p>
                  {ai.actionable_recommendations && ai.actionable_recommendations.length > 0 && (
                    <ul className="mt-3 space-y-2">{ai.actionable_recommendations.map((r) => <li key={r} className="flex gap-2 text-[15px] leading-6 text-[#24212B]"><CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-[#0E7A5F]" />{r}</li>)}</ul>
                  )}
                </Panel>
              )}

              {result.diffs.length > 0 && (
                <Panel title="What changed in your numbers">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[15px]">
                      <thead><tr className="border-b border-[#D9D3E8] text-left text-xs font-bold uppercase tracking-wider text-[#6F6A7C]"><th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Before</th><th className="py-2">After</th></tr></thead>
                      <tbody>{result.diffs.map((d, i) => <tr key={i} className="border-b border-[#D9D3E8]/60 last:border-0"><td className="py-2.5 pr-4 font-semibold text-[#24212B]">{d.label || d.field}</td><td className="py-2.5 pr-4 text-[#4A4658]">{String(d.baseline_value)}</td><td className="py-2.5 font-bold text-[#24212B]">{String(d.scenario_value)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </div>
          ) : (
            <Panel><p className="text-[15px] leading-7 text-[#4A4658]">Describe a change or pick an event. You will see the cover you would need before and after, side by side.</p></Panel>
          )}

          {saved.length > 0 && (
            <Panel title={`Earlier scenarios (${saved.length})`}>
              <ul className="divide-y divide-[#D9D3E8]/60">{saved.slice(0, 5).map((s, i) => <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-[15px]"><span className="font-semibold text-[#24212B]">{s.title}</span><span className="text-[#4A4658]">{typeof s.cover_difference === "number" ? `${s.cover_difference > 0 ? "+" : "-"}${formatINR(Math.abs(s.cover_difference), { compact: true })}` : ""}</span></li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
