"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { Figure, Panel, ToolShell, Verdict } from "@/components/tools/kit";

type Citation = { clause_title: string; extracted_text: string; confidence_score: number };
type Result = {
  insurer: string | null; product_name: string | null; policy_number_masked: string | null;
  sum_assured: number | null; annual_premium: number | null; policy_term_years: number | null; premium_paying_term_years: number | null;
  key_benefits: string[]; exclusions: string[]; waiting_periods: string[]; critical_deadlines: string[];
  citations: Citation[]; uncertain_fields: string[]; potential_protection_gaps: string[]; suggested_questions_for_insurer: string[]; disclaimer: string;
};

const EXAMPLE = `Plan name: Example Term Plan
Policy number: ABC123456789
Sum assured: Rs 1,00,00,000
Annual premium: Rs 14,850
Policy term: 30 years
Premium paying term: 30 years
Grace period: 30 days from the due date.
Free-look period: 30 days from receipt of the policy.
Death benefit: the sum assured is paid to the nominee.
Suicide exclusion: if death is by suicide within 12 months of the start of the policy, 80% of premiums paid is refunded.`;

const val = (v: number | string | null, f?: (n: number) => string) => (v === null || v === undefined ? <span className="text-[#8C879A]">Not found</span> : typeof v === "number" && f ? f(v) : v);

function List({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Panel title={title}>{items.length ? <ul className="space-y-2 text-[15px] leading-6 text-[#24212B]">{items.map((i) => <li key={i} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7957FF]" />{i}</li>)}</ul> : <p className="text-[15px] text-[#8C879A]">{empty}</p>}</Panel>
  );
}

export default function PolicyXRayPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/\.(txt|md|csv)$/i.test(f.name) && f.type !== "text/plain") { setError("Only text files can be read here. For a PDF, open it, copy the text and paste it below."); return; }
    setError(null);
    setText(await f.text());
  };

  const analyse = async () => {
    setError(null);
    if (text.trim().length < 20) { setError("Paste at least a few lines of your policy first."); return; }
    setLoading(true);
    try {
      const r = await fetchFromAPI("/policies/analyse", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ raw_text: text }).toString() });
      setRes(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyse. Is the backend running?");
    } finally { setLoading(false); }
  };

  return (
    <ToolShell slug="policy-xray">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="xray-text" className="text-sm font-semibold text-[#24212B]">Paste text from your policy schedule or wording</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setText(EXAMPLE)} className="text-sm font-semibold text-[#7957FF] hover:underline">Try an example</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-sm font-semibold text-[#7957FF] hover:underline"><Upload className="w-3.5 h-3.5" />Open a .txt file</button>
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </div>
        <textarea id="xray-text" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste here. Your text is sent only to analyse it and is not kept."
          className="mt-3 w-full rounded-xl border border-[#D9D3E8] bg-[#FAF9F6] p-3 text-[15px] leading-6 text-[#24212B] focus:border-[#7957FF] focus:outline-none" />
        {error && <p className="mt-3 text-sm font-semibold text-[#C0364B]" role="alert">{error}</p>}
        <button type="button" onClick={analyse} disabled={loading} data-magnetic
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7957FF] px-5 py-3 text-[15px] font-bold text-white disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Reading</> : <><FileText className="w-4 h-4" />Read my policy</>}
        </button>
      </Panel>

      {res && (
        <div className="mt-6 space-y-4 ls-pop">
          <Panel>
            <div className="grid gap-5 sm:grid-cols-4">
              <Figure label="Insurer"><span className="text-xl">{val(res.insurer)}</span></Figure>
              <Figure label="Sum assured"><span className="text-xl">{val(res.sum_assured, (n) => formatINR(n, { compact: true }))}</span></Figure>
              <Figure label="Yearly premium"><span className="text-xl">{val(res.annual_premium, (n) => formatINR(n))}</span></Figure>
              <Figure label="Policy term"><span className="text-xl">{val(res.policy_term_years, (n) => `${n} years`)}</span></Figure>
            </div>
          </Panel>
          {res.uncertain_fields.length > 0 && <Verdict tone="warn"><p className="font-bold">Not found in your text</p><ul className="mt-1 list-disc pl-5">{res.uncertain_fields.map((u) => <li key={u}>{u}</li>)}</ul></Verdict>}
          <div className="grid gap-4 md:grid-cols-2">
            <List title="Benefits" items={res.key_benefits} empty="No benefit lines found." />
            <List title="Exclusions" items={res.exclusions} empty="No exclusions found." />
            <List title="Waiting periods" items={res.waiting_periods} empty="No waiting periods found." />
            <List title="Deadlines" items={res.critical_deadlines} empty="No deadlines found." />
          </div>
          {res.potential_protection_gaps.length > 0 && <List title="Worth checking" items={res.potential_protection_gaps} empty="" />}
          {res.citations.length > 0 && (
            <Panel title="Lines this was read from">
              <ul className="space-y-3">{res.citations.map((c, i) => <li key={i} className="rounded-xl bg-[#FAF9F6] border border-[#D9D3E8] p-3"><p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">{c.clause_title}</p><p className="mt-1 text-[15px] text-[#24212B]">“{c.extracted_text}”</p></li>)}</ul>
            </Panel>
          )}
          <List title="Questions to ask your insurer" items={res.suggested_questions_for_insurer} empty="" />
          <p className="text-sm text-[#6F6A7C]">{res.disclaimer}</p>
        </div>
      )}
    </ToolShell>
  );
}
