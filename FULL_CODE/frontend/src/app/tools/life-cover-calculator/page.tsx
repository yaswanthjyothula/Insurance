"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Assumption, Figure, Panel, Segmented, ToolShell, Verdict } from "@/components/tools/kit";
import { TextField } from "@/components/tools/TextField";
import { formatINR } from "@/lib/utils";
import { postJSON } from "@/lib/api";
import {
  BLANK_LIFE_COVER_FORM,
  toAssessmentInput,
  validateLifeCoverForm,
  type FormErrors,
  type LifeCoverForm,
} from "@/lib/life-cover-form";
import type { AssessmentResult } from "@/types/assessment";

const GENDER_OPTIONS = [
  { value: "male" as const, label: "Male" },
  { value: "female" as const, label: "Female" },
];
const SMOKER_OPTIONS = [
  { value: "no" as const, label: "No" },
  { value: "yes" as const, label: "Yes" },
];

export default function LifeCoverCalculatorPage() {
  const [form, setForm] = useState<LifeCoverForm>(BLANK_LIFE_COVER_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const setField = <K extends keyof LifeCoverForm>(key: K, value: LifeCoverForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  const calculate = async () => {
    const found = validateLifeCoverForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await postJSON<AssessmentResult>("/assessments", toAssessmentInput(form)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not work out your cover. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell slug="life-cover-calculator" wide>
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 space-y-4">
          <Panel title="You and your money">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Your age" value={form.age} onChange={(v) => setField("age", v)} placeholder="32" error={errors.age} />
                <TextField
                  label="Dependents"
                  value={form.dependents}
                  onChange={(v) => setField("dependents", v)}
                  placeholder="2"
                  error={errors.dependents}
                />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <Segmented
                  label="Gender (used for premium rates)"
                  value={form.gender}
                  onChange={(v) => setField("gender", v)}
                  options={GENDER_OPTIONS}
                />
                <Segmented
                  label="Tobacco use in the last 3 years"
                  value={form.smoker ? "yes" : "no"}
                  onChange={(v) => setField("smoker", v === "yes")}
                  options={SMOKER_OPTIONS}
                />
              </div>
              <TextField
                label="Yearly income"
                prefix="₹"
                value={form.income}
                onChange={(v) => setField("income", v)}
                placeholder="18,00,000"
                error={errors.income}
              />
              <TextField
                label="Yearly household expenses"
                prefix="₹"
                value={form.expenses}
                onChange={(v) => setField("expenses", v)}
                placeholder="7,20,000"
                hint="What your family spends to live, in a year"
                error={errors.expenses}
              />
              <TextField
                label="Loans outstanding"
                prefix="₹"
                value={form.liabilities}
                onChange={(v) => setField("liabilities", v)}
                placeholder="0"
                error={errors.liabilities}
              />
              <TextField
                label="Existing life cover"
                prefix="₹"
                value={form.existingCover}
                onChange={(v) => setField("existingCover", v)}
                placeholder="0"
                error={errors.existingCover}
              />
              <TextField
                label="Savings and investments"
                prefix="₹"
                value={form.assets}
                onChange={(v) => setField("assets", v)}
                placeholder="0"
                hint="Not counting the home you live in"
                error={errors.assets}
              />
            </div>
          </Panel>
          <Panel title="Your family (optional)">
            <p className="-mt-2 mb-4 text-sm leading-6 text-[#4A4658]">
              Add ages and the years of support follow your family: the youngest child, your spouse and your parents. Leave them blank to
              enter a flat number of years instead.
            </p>
            <div className="space-y-4">
              <TextField
                label="Spouse's age"
                value={form.spouseAge}
                onChange={(v) => setField("spouseAge", v)}
                placeholder="30"
                error={errors.spouseAge}
              />
              <TextField
                label="Children's ages"
                value={form.childrenAges}
                onChange={(v) => setField("childrenAges", v)}
                placeholder="3, 7"
                hint="Separate with commas"
                error={errors.childrenAges}
              />
              <TextField
                label="Parents' ages"
                value={form.parentAges}
                onChange={(v) => setField("parentAges", v)}
                placeholder="62, 59"
                hint="Only parents who depend on you"
                error={errors.parentAges}
              />
              <TextField
                label="Years of support (if no ages)"
                value={form.supportYears}
                onChange={(v) => setField("supportYears", v)}
                placeholder="25"
                error={errors.supportYears}
              />
            </div>
          </Panel>
          {error && <Verdict tone="bad">{error}</Verdict>}
          <button
            type="button"
            onClick={calculate}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7957FF] px-5 py-3 text-[15px] font-bold text-white hover:bg-[#6444E6] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working it out
              </>
            ) : (
              "Work out my cover"
            )}
          </button>
        </div>

        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <ResultView result={result} />
          ) : (
            <Panel>
              <p className="text-[15px] leading-7 text-[#4A4658]">
                Fill in the left side and press the button. You will see the cover your family needs by two methods, and how each part adds
                up.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </ToolShell>
  );
}

function ResultView({ result }: { result: AssessmentResult }) {
  const { net_needs: needs, hlv } = result;
  return (
    <div className="space-y-5 ls-pop">
      <Panel>
        <Figure label="Cover to add" sub="Your gap, rounded up to a standard cover amount" tone="good">
          {formatINR(needs.recommended_cover ?? needs.net_coverage_gap, { compact: true })}
        </Figure>
        {result.recommendation_summary && <p className="mt-4 text-[15px] leading-7 text-[#4A4658]">{result.recommendation_summary}</p>}
      </Panel>

      <Panel title="Method 1: Net Needs">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-[15px]">
          <Line label="Income your family needs" value={needs.income_replacement_pv} />
          <Line label="Future goals" value={needs.future_goals_pv} />
          <Line label="Loans to clear" value={needs.outstanding_liabilities} />
          <Line label="Emergency buffer" value={needs.immediate_expenses} />
          <Line label="Total need" value={needs.total_gross_need} strong />
          <Line label="Savings and existing cover" value={-(needs.eligible_assets_deducted + needs.existing_cover_deducted)} />
          <Line label="Gap" value={needs.net_coverage_gap} strong />
        </dl>
      </Panel>

      <Panel title="Method 2: Human Life Value">
        <p className="text-[15px] leading-7 text-[#4A4658]">
          Your income over the {hlv.earning_horizon_years} years you are expected to keep earning, after your own share of spending, is
          worth {formatINR(hlv.hlv_gross, { compact: true })} today. After your savings and existing cover, the gap by this method is{" "}
          <span className="font-bold text-[#24212B]">{formatINR(hlv.hlv_net_gap, { compact: true })}</span>.
        </p>
      </Panel>

      <Verdict tone="info">
        <span className="flex flex-wrap items-center justify-between gap-3">
          <span>To see Saffron Life plans matched to this number, with exact premiums, start the Needs Finder.</span>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7957FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#6444E6]"
          >
            Start the Needs Finder <ArrowRight className="w-4 h-4" />
          </Link>
        </span>
      </Verdict>
      <Assumption>
        Inflation, return on the payout and the other assumptions are the Saffron Life reference values (a fictional insurer, with synthetic
        data). The Needs Finder lets you change them and add goals.
      </Assumption>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#D9D3E8]/60 pb-2">
      <dt className="text-[#4A4658]">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-extrabold text-[#24212B]" : "font-semibold text-[#24212B]"}`}>
        {value < 0 ? "-" : ""}
        {formatINR(Math.abs(value), { compact: true })}
      </dd>
    </div>
  );
}
