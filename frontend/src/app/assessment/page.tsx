"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Users,
  Landmark,
  Target,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  Zap,
  Lock,
  X,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import {
  ASSUMPTIONS,
  BLANK_FORM,
  BLANK_GOAL,
  DEMO_FORM,
  digitsOnly,
  fromInput,
  fromBankProfile,
  groupIN,
  toInput,
  validate,
  validateAll,
  type Errors,
  type FormState,
  type GoalForm
} from "@/lib/assessment-form";
import type { BankProfile } from "@/types/banking";

const DRAFT_KEY = "lifesure_assessment_draft";
const STEPS = [
  { label: "Profile", icon: User },
  { label: "Family", icon: Users },
  { label: "Liabilities", icon: Landmark },
  { label: "Goals", icon: Target },
  { label: "Review", icon: FileCheck2 },
];

const FALLBACK_BANK_PROFILES: BankProfile[] = [
  {
    id: "hdfc_corporate",
    bank_name: "HDFC Bank",
    bank_code: "HDFC",
    account_type: "Corporate Classic Salary Account",
    masked_account: "•••• 4819",
    holder_name: "Praveen Sharma",
    kyc_status: "Verified (CKYC Compliant)",
    cibil_score: 785,
    monthly_salary_credit: 150000,
    annual_income: 1800000,
    monthly_expenses_inferred: 60000,
    annual_expenses: 720000,
    age: 32,
    employment_type: "salaried",
    dependents_count: 2,
    active_home_loan_balance: 3500000,
    active_other_loans_balance: 0,
    liquid_savings_balance: 650000,
    existing_term_cover: 5000000,
    support_horizon_years: 20,
    buffer_months: 6,
    retirement_age: 60,
    smoker_status: "no",
    future_goals: [{ type: "education", name: "Child Higher Education Fund", cost: "2500000", years: "14" }],
    verification_badge: "RBI Account Aggregator (Anumati AA) Verified",
    consent_statement: "Consent ID: AA-HDFC-991204 granted via Anumati Account Aggregator for automated financial planning assessment."
  },
  {
    id: "icici_wealth",
    bank_name: "ICICI Bank",
    bank_code: "ICICI",
    account_type: "Wealth Management Executive Salary",
    masked_account: "•••• 8902",
    holder_name: "Ananya Sen",
    kyc_status: "Verified (CKYC Compliant)",
    cibil_score: 810,
    monthly_salary_credit: 250000,
    annual_income: 3000000,
    monthly_expenses_inferred: 100000,
    annual_expenses: 1200000,
    age: 38,
    employment_type: "salaried",
    dependents_count: 3,
    active_home_loan_balance: 6500000,
    active_other_loans_balance: 800000,
    liquid_savings_balance: 1500000,
    existing_term_cover: 10000000,
    support_horizon_years: 22,
    buffer_months: 9,
    retirement_age: 58,
    smoker_status: "no",
    future_goals: [{ type: "education", name: "Two Children Higher Education", cost: "5000000", years: "10" }],
    verification_badge: "ICICI iMobile Direct Bureau Sync (CIBIL 810)",
    consent_statement: "Direct net-banking API integration linked to verified PAN and salary statement."
  },
  {
    id: "sbi_csp",
    bank_name: "State Bank of India",
    bank_code: "SBI",
    account_type: "Corporate Salary Package (Gold)",
    masked_account: "•••• 3144",
    holder_name: "Rahul Verma",
    kyc_status: "Verified (CKYC Compliant)",
    cibil_score: 760,
    monthly_salary_credit: 95000,
    annual_income: 1140000,
    monthly_expenses_inferred: 40000,
    annual_expenses: 480000,
    age: 29,
    employment_type: "salaried",
    dependents_count: 1,
    active_home_loan_balance: 2200000,
    active_other_loans_balance: 200000,
    liquid_savings_balance: 350000,
    existing_term_cover: 2500000,
    support_horizon_years: 25,
    buffer_months: 6,
    retirement_age: 60,
    smoker_status: "no",
    future_goals: [{ type: "property", name: "Home Renovation & Expansion", cost: "1500000", years: "8" }],
    verification_badge: "YONO SBI Open Banking & Account Aggregator",
    consent_statement: "Consent authenticated via SBI YONO Open Banking secure token."
  },
  {
    id: "axis_burgundy",
    bank_name: "Axis Bank",
    bank_code: "AXIS",
    account_type: "Burgundy Corporate Salary Account",
    masked_account: "•••• 7261",
    holder_name: "Meera Nair",
    kyc_status: "Verified (CKYC Compliant)",
    cibil_score: 795,
    monthly_salary_credit: 185000,
    annual_income: 2220000,
    monthly_expenses_inferred: 75000,
    annual_expenses: 900000,
    age: 34,
    employment_type: "salaried",
    dependents_count: 2,
    active_home_loan_balance: 4500000,
    active_other_loans_balance: 450000,
    liquid_savings_balance: 800000,
    existing_term_cover: 5000000,
    support_horizon_years: 20,
    buffer_months: 6,
    retirement_age: 60,
    smoker_status: "no",
    future_goals: [{ type: "education", name: "International Master's Education", cost: "3500000", years: "12" }],
    verification_badge: "Axis Open Banking & Experian Bureau Link",
    consent_statement: "Verified payroll direct deposit history & Experian active credit lines."
  }
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
  verified,
  children 
}: { 
  id: string; 
  label: string; 
  optional?: boolean; 
  hint?: React.ReactNode; 
  error?: string; 
  verified?: boolean;
  children: React.ReactNode 
}) {
  return (
    <div data-field={id}>
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={id} className={`${labelCls} mb-0`}>
          {label}
          {optional && <span className="ml-2 normal-case tracking-normal font-medium text-[#6F6A7C]">optional</span>}
        </label>
        {verified && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#0F5132] border border-[#10B981]/30">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            NetBanking Verified
          </span>
        )}
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

  // Retail Banking 1-Click Pre-fill States
  const [bankProfiles, setBankProfiles] = useState<BankProfile[]>(FALLBACK_BANK_PROFILES);
  const [selectedBankModal, setSelectedBankModal] = useState<BankProfile | null>(null);
  const [connectedBank, setConnectedBank] = useState<BankProfile | null>(null);
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [preFillMessage, setPreFillMessage] = useState<string | null>(null);

  // Load verified banking profiles from API
  useEffect(() => {
    fetchFromAPI("/banking/profiles")
      .then((data: BankProfile[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBankProfiles(data);
        }
      })
      .catch(() => {
        // Fallback initialized by default
      });
  }, []);

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
    setConnectedBank(null);
    setPreFillMessage(null);
    setStep(0);
    setFormError(null);
    resetAll();
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const loadDemo = () => {
    setForm(DEMO_FORM);
    setErrors({});
    setRestored(false);
    setConnectedBank(null);
    setFormError(null);
  };

  // Perform 1-Click Pre-fill from selected bank
  const handleApplyBankPreFill = (profile: BankProfile) => {
    setIsPreFilling(true);
    setTimeout(() => {
      const newForm = fromBankProfile(profile);
      setForm(newForm);
      setConnectedBank(profile);
      setSelectedBankModal(null);
      setIsPreFilling(false);
      setErrors({});
      setFormError(null);
      setPreFillMessage(`Verified data successfully imported from ${profile.bank_name} (${profile.masked_account}) via RBI Account Aggregator.`);
    }, 700);
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

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-12 pb-28 flex flex-col gap-8">
        
        {/* Header */}
        <div className="ls-persp">
          <div data-scroll-tilt="5" className="ls-lip flex flex-col sm:flex-row sm:items-center justify-between gap-7 bg-[#FFFFFF] px-8 sm:px-11 py-10 rounded-3xl border border-[#D9D3E8] [transform-origin:bottom_center]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[13px] font-bold uppercase tracking-[0.14em] mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stage 1 of 4: Assessment Questionnaire
              </div>
              <h1 className="m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.04] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>
                Life Insurance Needs Assessment
              </h1>
              <p className="text-[17px] leading-[1.55] text-[#5A5566] mt-3 mb-0">
                Answer a few questions about your finances and family, or connect your retail bank account for instant 1-click pre-fill.
              </p>
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

        {/* ⚡ 1-Click Retail Banking Pre-Fill Bar */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8] p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5F0]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#E9E4FF] text-[#7957FF]">
                  <Zap className="w-3 h-3 fill-[#7957FF]" />
                  BFSI Banking Integration
                </span>
                <span className="text-[11px] font-bold text-[#10B981] bg-[#E8F8F0] px-2 py-0.5 rounded-full border border-[#10B981]/30">
                  RBI Account Aggregator (AA) Supported
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#24212B]">
                1-Click NetBanking Salary & Credit Bureau Pre-Fill
              </h3>
              <p className="text-xs text-[#5A5566] mt-0.5">
                Bypass manual data entry. Connect your salary bank account to import verified monthly payroll, active home loans, and savings balance.
              </p>
            </div>

            {connectedBank ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F5132] bg-[#E8F8F0] px-3 py-1.5 rounded-xl border border-[#10B981]/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  Connected: {connectedBank.bank_name}
                </span>
                <button
                  type="button"
                  onClick={clearForm}
                  className="text-xs text-[#6F6A7C] hover:text-[#C23B3B] font-semibold underline px-2 py-1"
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>

          {/* Bank Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bankProfiles.map((bank) => {
              const isSelected = connectedBank?.id === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBankModal(bank)}
                  className={`p-4 rounded-2xl text-left border transition-all relative group ${
                    isSelected
                      ? "border-2 border-[#7957FF] bg-[#F7F5FF] shadow-sm"
                      : "border-[#D9D3E8] bg-[#FAFAFE] hover:border-[#7957FF]/60 hover:bg-[#FFFFFF]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#7957FF] flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#7957FF]" />
                      {bank.bank_name}
                    </span>
                    <span className="text-[10px] font-bold text-[#5A5566] bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#E8E5F0]">
                      {bank.masked_account}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-[#24212B] truncate mb-0.5">
                    {bank.holder_name}
                  </div>
                  <div className="text-xs text-[#5A5566] mb-3">
                    Salary: <span className="font-bold text-[#24212B]">{formatINR(bank.monthly_salary_credit, { compact: true })}/mo</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E5F0] text-[11px]">
                    <span className="text-[#0F5132] font-extrabold bg-[#E8F8F0] px-1.5 py-0.5 rounded">
                      CIBIL {bank.cibil_score}
                    </span>
                    <span className="text-[#7957FF] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isSelected ? "Active" : "Pre-fill"} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pre-fill Notification Banner */}
        {preFillMessage && (
          <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#10B981]/40 text-[#0F5132] flex items-center justify-between gap-3 text-sm font-semibold animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
              <span>{preFillMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => goTo(4)}
              className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] text-xs font-bold shrink-0 transition-colors"
            >
              Review All Imported Values →
            </button>
          </div>
        )}

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

        {restored && !connectedBank && (
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
        <div ref={formRef} className="ls-lip bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8] p-7 sm:p-11 flex flex-col gap-9" data-no-reveal>
          {step === 0 && (
            <>
              <StepHeader icon={User} n={1} title="Personal & employment" desc="Your age and earning horizon set how long your family would need income support." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="age" label="Current age" error={e("age")} hint="Between 18 and 75" verified={Boolean(connectedBank)}>
                  <TextInput id="age" value={form.age} onChange={(v) => set("age", v)} placeholder="e.g. 32" suffix="years" error={e("age")} max={2} />
                </Field>
                <Field id="employment" label="Employment type" error={e("employment")} verified={Boolean(connectedBank)}>
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
                <Field id="income" label="Annual gross income" error={e("income")} hint={money(form.income, " per year") ?? "Total yearly income before tax"} verified={Boolean(connectedBank)}>
                  <TextInput id="income" money prefix="₹" value={form.income} onChange={(v) => set("income", v)} placeholder="e.g. 18,00,000" error={e("income")} />
                </Field>
                <Field id="expenses" label="Annual living expenses" error={e("expenses")} hint={money(form.expenses, " per year") ?? "Annual household expenditure excluding EMIs"} verified={Boolean(connectedBank)}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="dependents" label="Number of financial dependents" error={e("dependents")} hint="Children, non-earning spouse, or dependent parents" verified={Boolean(connectedBank)}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-9">
                <Field id="homeLoan" label="Outstanding Home Loan" optional error={e("homeLoan")} hint={money(form.homeLoan) ?? "Principal balance on mortgage"} verified={Boolean(connectedBank)}>
                  <TextInput id="homeLoan" money prefix="₹" value={form.homeLoan} onChange={(v) => set("homeLoan", v)} placeholder="e.g. 35,00,000" error={e("homeLoan")} />
                </Field>
                <Field id="otherLoans" label="Personal / Vehicle / Education Loans" optional error={e("otherLoans")} hint={money(form.otherLoans) ?? "Other outstanding liabilities"} verified={Boolean(connectedBank)}>
                  <TextInput id="otherLoans" money prefix="₹" value={form.otherLoans} onChange={(v) => set("otherLoans", v)} placeholder="e.g. 5,00,000" error={e("otherLoans")} />
                </Field>
                <Field id="existingCover" label="Existing Active Life Cover" optional error={e("existingCover")} hint={money(form.existingCover) ?? "Current sum assured across all active policies"} verified={Boolean(connectedBank)}>
                  <TextInput id="existingCover" money prefix="₹" value={form.existingCover} onChange={(v) => set("existingCover", v)} placeholder="e.g. 50,00,000" error={e("existingCover")} />
                </Field>
                <Field id="liquidAssets" label="Eligible Liquid Assets & FDs" optional error={e("liquidAssets")} hint={money(form.liquidAssets) ?? "Savings, mutual funds, FDs (exclude primary home)"} verified={Boolean(connectedBank)}>
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
              
              {connectedBank && (
                <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#10B981]/40 text-[#0F5132] text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>
                      Data Source: <strong>{connectedBank.bank_name}</strong> ({connectedBank.masked_account}) • CIBIL Score: <strong>{connectedBank.cibil_score}</strong> ({connectedBank.kyc_status})
                    </span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-[#10B981]/15 text-[#0F5132] px-2.5 py-0.5 rounded-full">
                    Account Aggregator Verified
                  </span>
                </div>
              )}

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

      {/* Account Aggregator Consent & Pre-Fill Modal */}
      {selectedBankModal && (
        <div className="fixed inset-0 z-50 bg-[#24212B]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setSelectedBankModal(null)}
              className="absolute top-5 right-5 text-[#6F6A7C] hover:text-[#24212B] p-1.5 rounded-full hover:bg-[#F4F0FF]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#7957FF] flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[#7957FF]" />
                  {selectedBankModal.bank_name}
                </span>
                <span className="text-[10px] font-bold text-[#0F5132] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                  CIBIL {selectedBankModal.cibil_score}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#24212B]">
                Authenticate & Pre-Fill Assessment
              </h2>
              <p className="text-xs text-[#5A5566]">
                Review the verified banking and credit bureau parameters that will be imported into your advisory assessment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E8E5F0] space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Account Holder:</span>
                <span className="font-extrabold text-[#24212B]">{selectedBankModal.holder_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Account:</span>
                <span className="font-bold text-[#24212B]">{selectedBankModal.account_type} ({selectedBankModal.masked_account})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Verified Monthly Salary Credit:</span>
                <span className="font-extrabold text-[#7957FF]">₹{selectedBankModal.monthly_salary_credit.toLocaleString("en-IN")}/mo (₹{selectedBankModal.annual_income.toLocaleString("en-IN")}/yr)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Inferred Living Debits:</span>
                <span className="font-bold text-[#24212B]">₹{selectedBankModal.annual_expenses.toLocaleString("en-IN")}/yr</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Active Debt (CIBIL Bureau):</span>
                <span className="font-extrabold text-[#24212B]">₹{selectedBankModal.active_home_loan_balance.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E8E5F0]">
                <span className="text-[#5A5566]">Liquid Savings & FDs:</span>
                <span className="font-bold text-[#24212B]">₹{selectedBankModal.liquid_savings_balance.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#5A5566]">Existing Life Cover:</span>
                <span className="font-bold text-[#24212B]">₹{selectedBankModal.existing_term_cover.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F0FF] border border-[#7957FF]/20 flex items-start gap-2.5 text-[11px] text-[#5A5566]">
              <Lock className="w-4 h-4 text-[#7957FF] shrink-0 mt-0.5" />
              <span>
                {selectedBankModal.consent_statement} Compliant with Indian DPDP Act, 2023. No credentials stored.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBankModal(null)}
                className="px-5 py-2.5 rounded-xl border border-[#D9D3E8] text-xs font-bold text-[#5A5566] hover:bg-[#F8F7FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPreFilling}
                onClick={() => handleApplyBankPreFill(selectedBankModal)}
                className="px-6 py-2.5 rounded-xl bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                {isPreFilling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFFFFF]" />
                    <span>Verifying AA Token...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-[#FFFFFF]" />
                    <span>Confirm & Pre-fill Form</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
