"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Users, Landmark, Target, FileCheck2, ArrowRight, ArrowLeft, Plus, Trash2, Info, CheckCircle2, AlertCircle, RotateCcw, Check } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import {
  ASSUMPTIONS, BLANK_FORM, BLANK_GOAL, DEMO_FORM, GOAL_TYPES,
  digitsOnly, fromInput, groupIN, toInput, validate, validateAll,
  type Errors, type FormState, type GoalForm,
} from "@/lib/assessment-form";

const DRAFT_KEY = "lifesure_assessment_draft";
const STEPS = [
  { label: "Profile", icon: User },
  { label: "Family", icon: Users },
  { label: "Liabilities", icon: Landmark },
  { label: "Goals", icon: Target },
  { label: "Review", icon: FileCheck2 },
];

const labelCls = "block text-[13.5px] font-bold text-[#24212B] uppercase tracking-[0.12em] mb-3";
const hintCls = "text-[14.5px] text-[#5A5566] font-medium mt-2.5 block";
const errCls = "flex items-center gap-1.5 text-[14px] font-semibold text-[#C23B3B] mt-2.5";
const inputBase = "w-full h-[60px] rounded-[10px] border bg-[#FFFFFF] text-[18px] font-semibold text-[#24212B] placeholder:text-[#A59FB5] placeholder:font-medium focus:outline-none";

function Field({ id, label, optional, hint, error, children }: { id: string; label: string; optional?: boolean; hint?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div data-field={id}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal font-medium text-[#6F6A7C]">optional</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-err`} role="alert" className={errCls}><AlertCircle className="w-4 h-4 shrink-0" />{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className={hintCls}>{hint}</span>
      ) : null}
    </div>
  );
}

function TextInput({ id, value, onChange, placeholder, error, prefix, suffix, money, max }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string; prefix?: string; suffix?: string; money?: boolean; max?: number;
}) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#7957FF] font-bold pointer-events-none">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={money ? groupIN(value) : value}
        placeholder={placeholder}
        onChange={(e) => onChange(digitsOnly(e.target.value, money ? 12 : max ?? 3))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        className={`${inputBase} ${prefix ? "pl-9" : "pl-4"} ${suffix ? "pr-20" : "pr-4"} ${error ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`}
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6F6A7C] font-medium pointer-events-none">{suffix}</span>}
    </div>
  );
}

function StepHeader({ icon: Icon, n, title, desc }: { icon: React.ComponentType<{ className?: string }>; n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start pb-7 border-b border-[#D9D3E8]">
      <span className="flex-none w-14 h-14 rounded-2xl grid place-items-center text-white bg-gradient-to-br from-[#9A80FF] to-[#7957FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_14px_22px_-8px_rgba(121,87,255,0.7)]"><Icon className="w-6 h-6" /></span>
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.03em] text-[#24212B]">Step {n}: {title}</h2>
        <p className="m-0 text-base leading-normal text-[#5A5566]">{desc}</p>
      </div>
    </div>
  );
}

const money = (v: string, suffix = "") => (v ? `${formatINR(Number(v), { compact: true })}${suffix}` : undefined);

export default function AssessmentPage() {
  const router = useRouter();
  const { input, result, setInput, setResult, setStage, resetAll, isHydrated } = useAssessmentStore();
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Restore the visitor's own earlier answers (never sample data). Client-only storage, so it runs after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isHydrated || ready) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setForm({ ...BLANK_FORM, ...JSON.parse(raw) });
        setRestored(true);
      } else if (result) {
        setForm(fromInput(input));
        setRestored(true);
      }
    } catch { /* ignore a corrupt draft */ }
    setReady(true);
  }, [isHydrated, ready, result, input]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Autosave the draft
  useEffect(() => {
    if (!ready) return;
    try {
      const empty = JSON.stringify(form) === JSON.stringify(BLANK_FORM);
      if (empty) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch { /* storage unavailable */ }
  }, [form, ready]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)));
    setFormError(null);
  };

  const setGoal = (i: number, patch: Partial<GoalForm>) => {
    setForm((f) => ({ ...f, goals: f.goals.map((g, idx) => (idx === i ? { ...g, ...patch } : g)) }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !Object.keys(patch).some((p) => k === `goal.${i}.${p === "years" ? "years" : p}`))));
  };

  const focusFirstError = (errs: Errors) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const id = first.startsWith("goal.") ? `goal-${first.split(".")[1]}-${first.split(".")[2]}` : first;
      const el = document.getElementById(id) ?? formRef.current?.querySelector<HTMLElement>(`[data-field="${id}"] input, [data-field="${id}"] select, [data-field="${id}"] button`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  const goTo = (target: number) => {
    // moving back is always allowed; moving forward needs the steps before to be valid
    if (target > step) {
      for (let s = step; s < target; s++) {
        const e = validate(form, s);
        if (Object.keys(e).length) {
          setStep(s);
          setErrors(e);
          setAttempted((a) => ({ ...a, [s]: true }));
          focusFirstError(e);
          return;
        }
      }
    }
    setErrors({});
    setStep(target);
    setVisited((v) => ({ ...v, [target]: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => goTo(step + 1);

  const handleSubmit = async () => {
    if (isLoading) return;
    const { errors: errs, firstStep } = validateAll(form);
    if (firstStep !== -1) {
      setStep(firstStep);
      setErrors(errs);
      setAttempted((a) => ({ ...a, [firstStep]: true }));
      setFormError("Some answers need fixing before we can calculate.");
      focusFirstError(errs);
      return;
    }
    setIsLoading(true);
    setFormError(null);
    const payload = toInput(form);
    try {
      const response = await fetchFromAPI("/assessments", { method: "POST", body: JSON.stringify(payload) });
      setInput(payload);
      setResult(response);
      setStage(2);
      router.push("/results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFormError(
        /failed to fetch|networkerror|load failed/i.test(msg) || !msg
          ? "We couldn't reach the calculation service. Please make sure it is running and try again."
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setForm(BLANK_FORM);
    setErrors({});
    setAttempted({});
    setVisited({ 0: true });
    setRestored(false);
    setStep(0);
    setFormError(null);
    resetAll();
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const loadDemo = () => {
    setForm(DEMO_FORM);
    setErrors({});
    setRestored(false);
    setFormError(null);
  };

  const stepHasErrors = (s: number) => attempted[s] && Object.keys(validate(form, s)).length > 0;
  const stepDone = (s: number) => visited[s] && s < step && Object.keys(validate(form, s)).length === 0;
  const errCount = Object.keys(errors).length;
  const isEmpty = JSON.stringify(form) === JSON.stringify(BLANK_FORM);
  const e = (k: string) => errors[k];

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={1} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-12 pb-28 flex flex-col gap-8">
        {/* Header */}
        <div className="ls-persp">
          <div data-scroll-tilt="5" className="ls-lip flex flex-col sm:flex-row sm:items-center justify-between gap-7 bg-[#FFFFFF] px-8 sm:px-11 py-10 rounded-3xl border border-[#D9D3E8] [transform-origin:bottom_center]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[13px] font-bold uppercase tracking-[0.14em] mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stage 1 of 4: Assessment Questionnaire
              </div>
              <h1 className="m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.04] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>Life Insurance Needs Assessment</h1>
              <p className="text-[17px] leading-[1.55] text-[#5A5566] mt-3 mb-0">Answer a few questions about your finances and family. It takes about 3 minutes, and nothing is sent until you calculate.</p>
            </div>
            <button
              onClick={loadDemo}
              type="button"
              className="inline-flex items-center justify-center gap-2 h-[54px] px-6 rounded-lg bg-[#FFFFFF] text-[#7957FF] text-base font-bold border border-[#D9D3E8] shrink-0 shadow-[0_4px_0_#D9D3E8,0_16px_28px_-14px_rgba(36,33,43,0.25)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all"
            >
              See a sample profile
            </button>
          </div>
        </div>

        {/* Step tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" role="tablist" aria-label="Assessment steps" data-no-reveal>
          {STEPS.map((s, i) => {
            const Icon = s.icon, active = step === i, bad = stepHasErrors(i), done = stepDone(i);
            return (
              <button
                key={s.label}
                role="tab"
                aria-selected={active}
                onClick={() => goTo(i)}
                type="button"
                className={`flex items-center justify-center gap-2.5 h-[60px] px-2 rounded-[10px] text-base font-semibold transition-all border ${
                  active
                    ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
                    : bad
                    ? "bg-[#FFFFFF] text-[#C23B3B] border-[#C23B3B] shadow-[0_4px_0_#F2C9C9]"
                    : done
                    ? "bg-[#E9E4FF] text-[#7957FF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]"
                    : "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5"
                }`}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : bad ? <AlertCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {restored && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] text-[15px]" data-no-reveal>
            <span className="flex items-center gap-2.5"><Info className="w-4 h-4 text-[#7957FF]" />We restored the answers you entered earlier.</span>
            <button type="button" onClick={clearForm} className="inline-flex items-center gap-1.5 font-bold text-[#7957FF] hover:underline"><RotateCcw className="w-4 h-4" />Start over</button>
          </div>
        )}

        {(formError || (errCount > 0 && attempted[step])) && (
          <div role="alert" className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C23B3B] text-[#C23B3B] flex items-center gap-3 text-[15px] font-semibold" data-no-reveal>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError ?? `Please fix ${errCount} ${errCount === 1 ? "field" : "fields"} below to continue.`}</span>
          </div>
        )}

        {/* Form */}
        <div ref={formRef} className="ls-lip bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8] p-7 sm:p-11 flex flex-col gap-9" data-no-reveal>
          {step === 0 && (
            <>
              <StepHeader icon={User} n={1} title="Personal & employment" desc="Your age and earning horizon set how long your family would need income support." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="age" label="Current age" error={e("age")} hint="Between 18 and 75">
                  <TextInput id="age" value={form.age} onChange={(v) => set("age", v)} placeholder="e.g. 32" suffix="years" error={e("age")} max={2} />
                </Field>
                <Field id="employment" label="Employment type" error={e("employment")}>
                  <select
                    id="employment"
                    value={form.employment}
                    onChange={(ev) => set("employment", ev.target.value as FormState["employment"])}
                    aria-invalid={Boolean(e("employment"))}
                    className={`${inputBase} px-4 ${form.employment ? "" : "text-[#A59FB5] font-medium"} ${e("employment") ? "border-[#C23B3B]" : "border-[#D9D3E8]"}`}
                  >
                    <option value="" disabled>Select employment type</option>
                    <option value="salaried">Salaried (Corporate / Govt)</option>
                    <option value="self_employed">Self-employed / Professional</option>
                    <option value="business">Business owner / Entrepreneur</option>
                    <option value="other">Other / Freelance</option>
                  </select>
                </Field>
                <Field id="income" label="Annual gross income" error={e("income")} hint={money(form.income, " per year") ?? "Total yearly income before tax"}>
                  <TextInput id="income" money prefix="₹" value={form.income} onChange={(v) => set("income", v)} placeholder="e.g. 18,00,000" error={e("income")} />
                </Field>
                <Field id="expenses" label="Annual household expenses" error={e("expenses")} hint={form.expenses ? `${money(form.expenses, " per year")} (about ${formatINR(Number(form.expenses) / 12, { compact: true })} a month)` : "Rent, food, bills, school fees — everything your family spends in a year"}>
                  <TextInput id="expenses" money prefix="₹" value={form.expenses} onChange={(v) => set("expenses", v)} placeholder="e.g. 7,20,000" error={e("expenses")} />
                </Field>
                <Field id="retire" label="Target retirement age" optional error={e("retire")} hint={`Between 45 and 75. We assume ${ASSUMPTIONS.defaultRetire} if you leave it blank`}>
                  <TextInput id="retire" value={form.retire} onChange={(v) => set("retire", v)} placeholder={`e.g. ${ASSUMPTIONS.defaultRetire}`} suffix="years" error={e("retire")} max={2} />
                </Field>
                <div data-field="smoker">
                  <span id="smoker-label" className={labelCls}>Tobacco / smoking status</span>
                  <div className="flex gap-3 flex-wrap" role="radiogroup" aria-labelledby="smoker-label" aria-invalid={Boolean(e("smoker"))}>
                    {([["no", "Non-smoker"], ["yes", "Tobacco user"]] as const).map(([v, l]) => {
                      const on = form.smoker === v;
                      return (
                        <button
                          key={v}
                          id={v === "no" ? "smoker" : undefined}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set("smoker", v)}
                          className={`h-14 px-5 rounded-[10px] flex items-center gap-3 text-base font-semibold border transition-all ${on ? "bg-[#E9E4FF] border-[#7957FF] shadow-[0_1px_0_#CFC5F5] translate-y-[3px]" : `bg-[#FFFFFF] ${e("smoker") ? "border-[#C23B3B]" : "border-[#D9D3E8]"} shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5`}`}
                        >
                          <span className="w-5 h-5 rounded-full border-2 border-[#7957FF] grid place-items-center"><span className={`w-2.5 h-2.5 rounded-full ${on ? "bg-[#7957FF]" : "bg-transparent"}`} /></span>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                  {e("smoker") ? <span role="alert" className={errCls}><AlertCircle className="w-4 h-4 shrink-0" />{e("smoker")}</span> : <span className={hintCls}>Used for the illustrative premium estimate</span>}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeader icon={Users} n={2} title="Family & dependents" desc="Who relies on your income, and for how long." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="dependents" label="Financial dependents" error={e("dependents")} hint="Spouse, children, parents who depend on your income. Enter 0 if none">
                  <TextInput id="dependents" value={form.dependents} onChange={(v) => set("dependents", v)} placeholder="e.g. 2" suffix="people" error={e("dependents")} max={2} />
                </Field>
                <Field id="supportYears" label="Years of income support" optional error={e("supportYears")} hint="How long your family would need support. Blank means until your retirement">
                  <TextInput id="supportYears" value={form.supportYears} onChange={(v) => set("supportYears", v)} placeholder="e.g. 20" suffix="years" error={e("supportYears")} max={2} />
                </Field>
                <Field id="bufferMonths" label="Emergency buffer" optional error={e("bufferMonths")} hint={form.bufferMonths && form.expenses ? `About ${formatINR((Number(form.expenses) / 12) * Number(form.bufferMonths), { compact: true })} set aside for immediate needs` : "Months of expenses to keep ready. We assume 6 months when blank"}>
                  <TextInput id="bufferMonths" value={form.bufferMonths} onChange={(v) => set("bufferMonths", v)} placeholder="e.g. 6" suffix="months" error={e("bufferMonths")} max={2} />
                </Field>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#D9D3E8] text-[15px] text-[#4A4553] flex items-start gap-3">
                <Info className="w-4 h-4 shrink-0 mt-1 text-[#7957FF]" />
                <div><strong className="font-bold text-[#24212B]">How we calculate:</strong> household expenses are projected across the support years at {ASSUMPTIONS.inflation * 100}% inflation and discounted to today&apos;s value at {ASSUMPTIONS.discount * 100}%.</div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader icon={Landmark} n={3} title="Liabilities & existing cover" desc="Debts add to the cover you need. Existing cover and liquid savings reduce it. Leave a field blank if it doesn't apply." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="homeLoan" label="Home loan outstanding" optional error={e("homeLoan")} hint={money(form.homeLoan) ?? "Principal still to be repaid"}>
                  <TextInput id="homeLoan" money prefix="₹" value={form.homeLoan} onChange={(v) => set("homeLoan", v)} placeholder="e.g. 35,00,000" error={e("homeLoan")} />
                </Field>
                <Field id="otherLoans" label="Personal, car & other loans" optional error={e("otherLoans")} hint={money(form.otherLoans) ?? "Combined outstanding balance"}>
                  <TextInput id="otherLoans" money prefix="₹" value={form.otherLoans} onChange={(v) => set("otherLoans", v)} placeholder="e.g. 4,00,000" error={e("otherLoans")} />
                </Field>
                <Field id="existingCover" label="Existing life insurance cover" optional error={e("existingCover")} hint={money(form.existingCover) ?? "Total sum assured across all your life policies"}>
                  <TextInput id="existingCover" money prefix="₹" value={form.existingCover} onChange={(v) => set("existingCover", v)} placeholder="e.g. 50,00,000" error={e("existingCover")} />
                </Field>
                <Field id="liquidAssets" label="Liquid savings & investments" optional error={e("liquidAssets")} hint={money(form.liquidAssets) ?? "FDs, mutual funds, EPF your family could use. Exclude your home"}>
                  <TextInput id="liquidAssets" money prefix="₹" value={form.liquidAssets} onChange={(v) => set("liquidAssets", v)} placeholder="e.g. 20,00,000" error={e("liquidAssets")} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[260px]">
                  <StepHeader icon={Target} n={4} title="Future goals" desc="Milestones your family should still be able to fund. Costs are in today's money and adjusted for inflation. This step is optional." />
                </div>
              </div>
              {form.goals.length === 0 ? (
                <div className="text-center py-10 px-6 text-[#5A5566] bg-[#FAF9F6] rounded-xl border border-dashed border-[#D9D3E8]">
                  <p className="m-0 mb-4">No goals added yet. Add one, or continue to review.</p>
                  <button type="button" onClick={() => set("goals", [{ ...BLANK_GOAL }])} className="inline-flex items-center gap-2 h-12 px-5 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-semibold"><Plus className="w-4 h-4" />Add a goal</button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {form.goals.map((g, i) => (
                    <fieldset key={i} className="p-5 rounded-2xl border border-[#D9D3E8] bg-[#FAF9F6] flex flex-col gap-5">
                      <legend className="sr-only">Goal {i + 1}</legend>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]">Goal {i + 1}</span>
                        <button type="button" onClick={() => set("goals", form.goals.filter((_, idx) => idx !== i))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6F6A7C] hover:text-[#C23B3B]" aria-label={`Remove goal ${i + 1}`}><Trash2 className="w-4 h-4" />Remove</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Field id={`goal-${i}-type`} label="Type" error={e(`goal.${i}.type`)}>
                          <select
                            id={`goal-${i}-type`}
                            value={g.type}
                            onChange={(ev) => setGoal(i, { type: ev.target.value as GoalForm["type"] })}
                            className={`${inputBase} px-4 ${g.type ? "" : "text-[#A59FB5] font-medium"} ${e(`goal.${i}.type`) ? "border-[#C23B3B]" : "border-[#D9D3E8]"}`}
                          >
                            <option value="" disabled>Select a goal type</option>
                            {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </Field>
                        <Field id={`goal-${i}-name`} label="Name" error={e(`goal.${i}.name`)}>
                          <input
                            id={`goal-${i}-name`}
                            type="text"
                            value={g.name}
                            maxLength={60}
                            placeholder="e.g. Daughter's higher education"
                            onChange={(ev) => setGoal(i, { name: ev.target.value })}
                            aria-invalid={Boolean(e(`goal.${i}.name`))}
                            className={`${inputBase} px-4 ${e(`goal.${i}.name`) ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`}
                          />
                        </Field>
                        <Field id={`goal-${i}-cost`} label="Cost in today's money" error={e(`goal.${i}.cost`)} hint={money(g.cost)}>
                          <TextInput id={`goal-${i}-cost`} money prefix="₹" value={g.cost} onChange={(v) => setGoal(i, { cost: v })} placeholder="e.g. 25,00,000" error={e(`goal.${i}.cost`)} />
                        </Field>
                        <Field id={`goal-${i}-years`} label="Years away" error={e(`goal.${i}.years`)} hint="Between 1 and 40">
                          <TextInput id={`goal-${i}-years`} value={g.years} onChange={(v) => setGoal(i, { years: v })} placeholder="e.g. 14" suffix="years" error={e(`goal.${i}.years`)} max={2} />
                        </Field>
                      </div>
                    </fieldset>
                  ))}
                  {form.goals.length < 6 && (
                    <button type="button" onClick={() => set("goals", [...form.goals, { ...BLANK_GOAL }])} className="self-start inline-flex items-center gap-2 h-12 px-5 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] text-[#7957FF] font-semibold shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[3px] transition-all"><Plus className="w-4 h-4" />Add another goal</button>
                  )}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <StepHeader icon={FileCheck2} n={5} title="Review your answers" desc="Check everything below. Use Edit to change a section, then calculate your coverage." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { title: "Profile", s: 0, rows: [["Age", form.age ? `${form.age} years` : "—"], ["Employment", GOAL_LABEL_EMP[form.employment] ?? "—"], ["Annual income", money(form.income) ?? "—"], ["Annual expenses", money(form.expenses) ?? "—"], ["Retirement age", `${form.retire || ASSUMPTIONS.defaultRetire} years${form.retire ? "" : " (assumed)"}`], ["Tobacco", form.smoker === "yes" ? "Tobacco user" : form.smoker === "no" ? "Non-smoker" : "—"]] },
                  { title: "Family & timeline", s: 1, rows: [["Dependents", form.dependents || "—"], ["Support years", form.supportYears ? `${form.supportYears} years` : "Until retirement"], ["Emergency buffer", form.bufferMonths ? `${form.bufferMonths} months` : "6 months (assumed)"]] },
                  { title: "Debts & assets", s: 2, rows: [["Home loan", money(form.homeLoan) ?? "None"], ["Other loans", money(form.otherLoans) ?? "None"], ["Existing cover", money(form.existingCover) ?? "None"], ["Liquid assets", money(form.liquidAssets) ?? "None"]] },
                  { title: "Goals", s: 3, rows: form.goals.length ? form.goals.map((g) => [`${g.name || "Unnamed"} (${g.years || "?"}y)`, money(g.cost) ?? "—"]) : [["No goals added", ""]] },
                ].map((card) => (
                  <div key={card.title} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D9D3E8]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]">{card.title}</span>
                      <button type="button" onClick={() => goTo(card.s)} className="text-sm text-[#7957FF] font-bold hover:underline">Edit</button>
                    </div>
                    <dl className="m-0 text-[15px]">
                      {card.rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-2 border-b border-[#D9D3E8] last:border-0">
                          <dt className="text-[#5A5566]">{k}</dt>
                          <dd className="m-0 font-bold text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] text-[15px] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#7957FF] shrink-0 mt-0.5" />
                <span>We calculate both <strong>Net Needs</strong> and <strong>Human Life Value</strong>, using {ASSUMPTIONS.inflation * 100}% inflation, {ASSUMPTIONS.discount * 100}% discount rate and {ASSUMPTIONS.eduInflation * 100}% education inflation. You can compare both on the next screen.</span>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="pt-7 border-t border-[#D9D3E8] flex items-center justify-between gap-4 flex-wrap">
            {step > 0 ? (
              <button type="button" onClick={() => goTo(step - 1)} className="inline-flex items-center gap-2 h-14 px-6 rounded-lg border border-[#D9D3E8] text-base font-semibold bg-[#FFFFFF] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all">
                <ArrowLeft className="w-4 h-4" />Back
              </button>
            ) : !isEmpty ? (
              <button type="button" onClick={clearForm} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6F6A7C] hover:text-[#24212B]"><RotateCcw className="w-4 h-4" />Clear form</button>
            ) : <span />}

            {step < 4 ? (
              <button type="button" onClick={next} className="inline-flex items-center gap-2 h-14 px-8 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold ml-auto">
                Continue to {STEPS[step + 1].label}<ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading} className="inline-flex items-center gap-2 h-14 px-8 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold ml-auto disabled:opacity-60">
                {isLoading ? <span>Calculating…</span> : <>Calculate coverage<ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const GOAL_LABEL_EMP: Record<string, string> = {
  salaried: "Salaried", self_employed: "Self-employed", business: "Business owner", other: "Other / Freelance",
};
