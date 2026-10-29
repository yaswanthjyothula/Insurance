"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users, Landmark, Target, FileCheck2, ArrowRight, ArrowLeft, Plus, Trash2, Info, CheckCircle2, AlertCircle, RotateCcw, Check } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveMyPlan, summariseAssessment } from "@/lib/my-plan";
import {
  ASSUMPTIONS,
  BLANK_FORM,
  BLANK_GOAL,
  DEMO_FORM,
  digitsOnly,
  fromInput,
  groupIN,
  toInput,
  validate,
  validateAll,
  type Errors,
  type FormState,
  type GoalForm
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

function Field({ 
  id, 
  label, 
  optional, 
  hint, 
  error, 
  children 
}: { 
  id: string; 
  label: string; 
  optional?: boolean; 
  hint?: React.ReactNode; 
  error?: string; 
  children: React.ReactNode 
}) {
  return (
    <div data-field={id}>
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={id} className={`${labelCls} mb-0`}>
          {label}
          {optional && <span className="ml-2 normal-case tracking-normal font-medium text-[#6F6A7C]">optional</span>}
        </label>
      </div>
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
    <div className="flex gap-4 items-start pb-5 border-b border-[#D9D3E8]">
      <span className="flex-none w-12 h-12 rounded-2xl grid place-items-center text-white bg-gradient-to-br from-[#9A80FF] to-[#7957FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_14px_22px_-8px_rgba(121,87,255,0.7)]"><Icon className="w-6 h-6" /></span>
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
  const { user } = useAuth();
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

  // Restore earlier answers
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
    } catch { /* ignore corrupt draft */ }
    setReady(true);
  }, [isHydrated, ready, result, input]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Autosave draft
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
      saveMyPlan(user?.email, { assessment: summariseAssessment(response) });
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

  const isEmpty = JSON.stringify(form) === JSON.stringify(BLANK_FORM);
  const curErrors = validate(form, step);
  const errCount = Object.keys(curErrors).length;
  const e = (k: string) => (attempted[step] ? curErrors[k] : undefined);
  const stepHasErrors = (s: number) => attempted[s] && Object.keys(validate(form, s)).length > 0;
  const stepDone = (s: number) => visited[s] && Object.keys(validate(form, s)).length === 0;

  const GOAL_LABEL_EMP: Record<string, string> = {
    salaried: "Salaried",
    self_employed: "Self-employed",
    business: "Business owner",
    other: "Other",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FC] text-[#24212B]">
      <JourneyProgress currentStage={1} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-6 pb-24 flex flex-col gap-5">
        
        {/* Header */}
        <div className="ls-persp">
          <div data-scroll-tilt="5" className="ls-lip flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] px-6 sm:px-8 py-6 rounded-3xl border border-[#D9D3E8] [transform-origin:bottom_center]">
            <div>
              <h1 className="m-0 text-[clamp(26px,2.8vw,36px)] leading-[1.1] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>
                Life Insurance Needs Assessment
              </h1>
              <p className="text-[16px] leading-[1.5] text-[#5A5566] mt-2 mb-0">
                Answer a few questions about your finances and family. It takes about two minutes.
              </p>
            </div>
            <button
              onClick={loadDemo}
              type="button"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#FFFFFF] text-[#7957FF] text-[15px] font-bold border border-[#D9D3E8] shrink-0 shadow-[0_4px_0_#D9D3E8,0_16px_28px_-14px_rgba(36,33,43,0.25)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all"
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
                className={`flex items-center justify-center gap-2.5 h-12 px-2 rounded-[10px] text-[15px] font-semibold transition-all border ${
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

        {/* Form Body */}
        <div ref={formRef} className="ls-lip bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8] p-6 sm:p-9 flex flex-col gap-7" data-no-reveal>
          {step === 0 && (
            <>
              <StepHeader icon={User} n={1} title="Personal & employment" desc="Your age and earning horizon set how long your family would need income support." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-7">
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
                <Field id="expenses" label="Annual living expenses" error={e("expenses")} hint={money(form.expenses, " per year") ?? "Annual household expenditure excluding EMIs"}>
                  <TextInput id="expenses" money prefix="₹" value={form.expenses} onChange={(v) => set("expenses", v)} placeholder="e.g. 7,20,000" error={e("expenses")} />
                </Field>
                <Field id="retire" label="Planned retirement age" optional error={e("retire")} hint="Defaults to 60 if left blank">
                  <TextInput id="retire" value={form.retire} onChange={(v) => set("retire", v)} placeholder="60" suffix="years" error={e("retire")} max={2} />
                </Field>
                <Field id="smoker" label="Tobacco / nicotine consumption" error={e("smoker")} hint="Smoker status influences term life underwriting rates">
                  <div className="grid grid-cols-2 gap-3 h-[60px]">
                    {[["no", "No / Non-smoker"], ["yes", "Yes / Tobacco user"]].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set("smoker", val as FormState["smoker"])}
                        className={`h-full rounded-[10px] text-[15px] font-bold border transition-all ${
                          form.smoker === val
                            ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
                            : "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] hover:border-[#7957FF]/40"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeader icon={Users} n={2} title="Family & financial dependents" desc="Calculate the horizon over which your family will require income replacement." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-7">
                <Field id="dependents" label="Number of financial dependents" error={e("dependents")} hint="Children, non-earning spouse, or dependent parents">
                  <TextInput id="dependents" value={form.dependents} onChange={(v) => set("dependents", v)} placeholder="e.g. 2" max={2} error={e("dependents")} />
                </Field>
                <Field id="supportYears" label="Years of dependency support" optional error={e("supportYears")} hint="Defaults to the window until retirement">
                  <TextInput id="supportYears" value={form.supportYears} onChange={(v) => set("supportYears", v)} placeholder="e.g. 20" suffix="years" error={e("supportYears")} max={2} />
                </Field>
                <Field id="bufferMonths" label="Emergency cash buffer" optional error={e("bufferMonths")} hint="Months of living expenses to hold in liquid reserves">
                  <TextInput id="bufferMonths" value={form.bufferMonths} onChange={(v) => set("bufferMonths", v)} placeholder="6" suffix="months" error={e("bufferMonths")} max={2} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader icon={Landmark} n={3} title="Debt liabilities & existing assets" desc="Existing loans must be shielded, while liquid assets reduce the net gap." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-7">
                <Field id="homeLoan" label="Outstanding Home Loan" optional error={e("homeLoan")} hint={money(form.homeLoan) ?? "Principal balance on mortgage"}>
                  <TextInput id="homeLoan" money prefix="₹" value={form.homeLoan} onChange={(v) => set("homeLoan", v)} placeholder="e.g. 35,00,000" error={e("homeLoan")} />
                </Field>
                <Field id="otherLoans" label="Personal / Vehicle / Education Loans" optional error={e("otherLoans")} hint={money(form.otherLoans) ?? "Other outstanding liabilities"}>
                  <TextInput id="otherLoans" money prefix="₹" value={form.otherLoans} onChange={(v) => set("otherLoans", v)} placeholder="e.g. 5,00,000" error={e("otherLoans")} />
                </Field>
                <Field id="existingCover" label="Existing Active Life Cover" optional error={e("existingCover")} hint={money(form.existingCover) ?? "Current sum assured across all active policies"}>
                  <TextInput id="existingCover" money prefix="₹" value={form.existingCover} onChange={(v) => set("existingCover", v)} placeholder="e.g. 50,00,000" error={e("existingCover")} />
                </Field>
                <Field id="liquidAssets" label="Eligible Liquid Assets & FDs" optional error={e("liquidAssets")} hint={money(form.liquidAssets) ?? "Savings, mutual funds, FDs (exclude primary home)"}>
                  <TextInput id="liquidAssets" money prefix="₹" value={form.liquidAssets} onChange={(v) => set("liquidAssets", v)} placeholder="e.g. 10,00,000" error={e("liquidAssets")} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeader icon={Target} n={4} title="Milestone financial goals" desc="Provide lump-sum funds for future commitments like child higher education or marriage." />
              <div className="space-y-6">
                {form.goals.map((goal, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-[#D9D3E8] bg-[#FAFAFE] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">Goal #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => set("goals", form.goals.filter((_, i) => i !== idx))}
                        className="text-xs text-[#C23B3B] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5A5566] mb-1">Goal Type</label>
                        <select
                          value={goal.type}
                          onChange={(e) => setGoal(idx, { type: e.target.value as GoalForm["type"] })}
                          className="w-full h-12 rounded-lg border border-[#D9D3E8] px-3 bg-[#FFFFFF] text-sm font-semibold text-[#24212B]"
                        >
                          <option value="education">Education</option>
                          <option value="marriage">Marriage</option>
                          <option value="property">Home / Property</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#5A5566] mb-1">Goal Description</label>
                        <input
                          type="text"
                          value={goal.name}
                          onChange={(e) => setGoal(idx, { name: e.target.value })}
                          placeholder="e.g. Child Higher Education"
                          className="w-full h-12 rounded-lg border border-[#D9D3E8] px-3 bg-[#FFFFFF] text-sm font-semibold text-[#24212B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5A5566] mb-1">Years Away</label>
                        <input
                          type="text"
                          value={goal.years}
                          onChange={(e) => setGoal(idx, { years: digitsOnly(e.target.value, 2) })}
                          placeholder="14"
                          className="w-full h-12 rounded-lg border border-[#D9D3E8] px-3 bg-[#FFFFFF] text-sm font-semibold text-[#24212B]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5A5566] mb-1">Estimated Cost Today (₹)</label>
                      <input
                        type="text"
                        value={groupIN(goal.cost)}
                        onChange={(e) => setGoal(idx, { cost: digitsOnly(e.target.value, 12) })}
                        placeholder="25,00,000"
                        className="w-full h-12 rounded-lg border border-[#D9D3E8] px-3 bg-[#FFFFFF] text-sm font-semibold text-[#24212B]"
                      />
                    </div>
                  </div>
                ))}

                {form.goals.length < 5 && (
                  <button
                    type="button"
                    onClick={() => set("goals", [...form.goals, { ...BLANK_GOAL, type: "education" }])}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#7957FF] text-[#7957FF] text-xs font-bold hover:bg-[#F4F0FF] transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Milestone Goal
                  </button>
                )}
              </div>
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
