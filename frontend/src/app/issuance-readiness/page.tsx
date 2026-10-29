"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  ShieldCheck,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Lock,
  BadgeCheck,
  Search,
  HeartPulse,
  Activity,
  FileText,
  Printer,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  UserCheck,
  Sliders,
  Info
} from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR, shortInsurerName } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import type {
  CKYCLookupResponse,
  MedicalTriageInput,
  UnderwritingDecision,
  PolicyIssuanceResponse,
} from "@/types/underwriting";

const PRESET_PANS = [
  { pan: "ABCPS1234A", name: "Praveen Sharma", bank: "HDFC Salary", profile: "Salaried IT Executive" },
  { pan: "XYZAS5678B", name: "Ananya Sen", bank: "ICICI Wealth", profile: "Senior Vice President" },
  { pan: "DEFPR9012C", name: "Rahul Verma", bank: "SBI Package", profile: "Government / PSU" },
  { pan: "GHIJM3456D", name: "Meera Nair", bank: "Axis Burgundy", profile: "Healthcare Specialist" },
];

const fmt = (n: number) => formatINR(n, { compact: true });

export default function IssuanceReadinessPage() {
  const router = useRouter();
  const { result, selectedProduct, customization, isHydrated, setStage, currentStage } = useAssessmentStore();

  useEffect(() => {
    if (currentStage !== 5) {
      setStage(5);
    }
  }, [currentStage, setStage]);

  // Plan fallback details if visitor navigated directly
  const planName = selectedProduct ? `${shortInsurerName(selectedProduct.insurer)} ${selectedProduct.name}` : "HDFC Life Click 2 Protect 3D Plus";
  const insurerName = selectedProduct?.insurer ?? "HDFC Life Insurance Co. Ltd.";
  const productId = selectedProduct?.id ?? "hdfc-c2p-3d-plus";
  const sumAssured = customization?.sum_assured ?? result?.net_needs?.net_coverage_gap ?? 15000000;
  const tenureYears = customization?.tenure_years ?? 30;
  const baseAnnualPremium = customization?.estimated_annual_premium ?? 17400;
  const baseMonthlyPremium = customization?.estimated_monthly_premium ?? Math.round(baseAnnualPremium / 12);

  // --- 1. CKYC State ---
  const [panNumber, setPanNumber] = useState("ABCPS1234A");
  const [proposerName, setProposerName] = useState("Praveen Sharma");
  const [dob, setDob] = useState("1992-05-14");
  const [isVerifyingKYC, setIsVerifyingKYC] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycData, setKycData] = useState<CKYCLookupResponse | null>(null);

  // Auto-verify preset on first render
  useEffect(() => {
    let cancelled = false;
    const verifyInitial = async () => {
      try {
        const res: CKYCLookupResponse = await fetchFromAPI("/underwriting/ckyc-lookup", {
          method: "POST",
          body: JSON.stringify({ pan_number: "ABCPS1234A", full_name: "Praveen Sharma", date_of_birth: "1992-05-14" }),
        });
        if (!cancelled) setKycData(res);
      } catch {
        // Silently allow manual trigger
      }
    };
    verifyInitial();
    return () => { cancelled = true; };
  }, []);

  const handleVerifyKYC = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!panNumber.trim()) {
      setKycError("Please enter a valid 10-character PAN number.");
      return;
    }
    setIsVerifyingKYC(true);
    setKycError(null);
    try {
      const res: CKYCLookupResponse = await fetchFromAPI("/underwriting/ckyc-lookup", {
        method: "POST",
        body: JSON.stringify({
          pan_number: panNumber.trim().toUpperCase(),
          full_name: proposerName.trim() || undefined,
          date_of_birth: dob || undefined,
        }),
      });
      setKycData(res);
      setProposerName(res.full_name);
    } catch (err: unknown) {
      setKycError(err instanceof Error ? err.message : "CKYC verification failed. Please check PAN format.");
    } finally {
      setIsVerifyingKYC(false);
    }
  };

  const selectPresetPAN = (preset: typeof PRESET_PANS[0]) => {
    setPanNumber(preset.pan);
    setProposerName(preset.name);
    setKycError(null);
    setIsVerifyingKYC(true);
    fetchFromAPI("/underwriting/ckyc-lookup", {
      method: "POST",
      body: JSON.stringify({ pan_number: preset.pan, full_name: preset.name }),
    })
      .then((res: CKYCLookupResponse) => {
        setKycData(res);
        setProposerName(res.full_name);
      })
      .catch((err: unknown) => setKycError(err instanceof Error ? err.message : "Verification error"))
      .finally(() => setIsVerifyingKYC(false));
  };

  // --- 2. Medical Triage State ---
  const [tobaccoUse, setTobaccoUse] = useState<"never" | "occasional" | "regular">("never");
  const [conditions, setConditions] = useState<string[]>(["none"]);
  const [familyLongevity, setFamilyLongevity] = useState<"both_parents_above_70" | "no_major_family_illness" | "one_parent_cardiac_cancer_before_60">("both_parents_above_70");

  const toggleCondition = (cond: string) => {
    if (cond === "none") {
      setConditions(["none"]);
      return;
    }
    setConditions((prev) => {
      const withoutNone = prev.filter((c) => c !== "none");
      if (withoutNone.includes(cond)) {
        const next = withoutNone.filter((c) => c !== cond);
        return next.length === 0 ? ["none"] : next;
      } else {
        return [...withoutNone, cond];
      }
    });
  };

  // --- 3. Underwriting Decision State ---
  const [evaluating, setEvaluating] = useState(false);
  const [decision, setDecision] = useState<UnderwritingDecision | null>(null);

  useEffect(() => {
    let cancelled = false;
    const runEvaluation = async () => {
      setEvaluating(true);
      try {
        const payload: MedicalTriageInput = {
          tobacco_use: tobaccoUse,
          pre_existing_conditions: conditions,
          family_longevity: familyLongevity,
          base_annual_premium: baseAnnualPremium,
          base_monthly_premium: baseMonthlyPremium,
          sum_assured: sumAssured,
          age: 32,
        };
        const res: UnderwritingDecision = await fetchFromAPI("/underwriting/evaluate", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!cancelled) setDecision(res);
      } catch (err) {
        console.error("Underwriting evaluation error:", err);
      } finally {
        if (!cancelled) setEvaluating(false);
      }
    };

    const timer = setTimeout(runEvaluation, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tobaccoUse, conditions, familyLongevity, baseAnnualPremium, baseMonthlyPremium, sumAssured]);

  // --- 4. Policy Issuance State ---
  const [issuing, setIssuing] = useState(false);
  const [issuedPolicy, setIssuedPolicy] = useState<PolicyIssuanceResponse | null>(null);

  const handleIssuePolicy = async () => {
    if (!kycData || !decision) return;
    setIssuing(true);
    try {
      const res: PolicyIssuanceResponse = await fetchFromAPI("/underwriting/issue-policy", {
        method: "POST",
        body: JSON.stringify({
          ckyc_number: kycData.ckyc_number,
          pan_number: kycData.pan,
          proposer_name: kycData.full_name,
          product_id: productId,
          product_name: planName,
          insurer_name: insurerName,
          sum_assured: sumAssured,
          tenure_years: tenureYears,
          annual_premium: decision.adjusted_annual_premium,
          monthly_premium: decision.adjusted_monthly_premium,
          underwriting_decision: decision.underwriting_decision,
          payment_mode: "Instant NetBanking / UPI AutoPay",
        }),
      });
      setIssuedPolicy(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Policy issuance simulation encountered an issue. Please try again.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-[#24212B] bg-[#FBF9FE]">
      <JourneyProgress currentStage={5} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 flex flex-col gap-8">
        {/* Stage Header */}
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#E9E4FF] text-[#7957FF] border border-[#D9D3E8] text-[12px] font-extrabold uppercase tracking-[0.16em]">
            <FileCheck className="w-4 h-4 text-[#7957FF]" /> Stage 5 of 5 · Instant Policy Issuance Readiness
          </div>
          <h1 className="m-0 text-[clamp(28px,3.2vw,44px)] font-black tracking-[-0.03em] text-[#24212B]">
            Automated Underwriting &amp; Instant CKYC Verification
          </h1>
          <p className="m-0 text-[16px] sm:text-[17px] text-[#5A5566] max-w-[850px] leading-relaxed">
            Eliminate weeks of paper medical underwriting. Link your Central KYC Registry identifier (CERSAI) and answer 3 clinical triage questions to receive instant straight-through policy issuance readiness.
          </p>
        </header>

        {/* Issued Policy Hero Banner */}
        {issuedPolicy && (
          <div className="rounded-3xl p-6 sm:p-10 text-white flex flex-col gap-6 shadow-[0_20px_50px_-20px_rgba(14,122,95,0.4)] border border-[#0E7A5F]"
               style={{ background: "linear-gradient(135deg, #0E7A5F 0%, #0A5A46 100%)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.18)] text-[12.5px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> {issuedPolicy.issuance_status === "ISSUED_ACTIVE" ? "Policy Issued & Active" : "Conditional Acceptance Bound"}
              </span>
              <span className="text-xs text-[rgba(255,255,255,0.8)] font-mono">
                Digital Signature: {issuedPolicy.digital_signature_hash}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="m-0 text-[clamp(26px,3vw,38px)] font-black tracking-tight text-white">
                Congratulations, {issuedPolicy.proposer_name}!
              </h2>
              <p className="m-0 text-[16px] text-[rgba(255,255,255,0.9)] max-w-[780px]">
                {issuedPolicy.message}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[rgba(255,255,255,0.12)] backdrop-blur-sm border border-[rgba(255,255,255,0.15)]">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">Policy Number</span>
                <span className="text-[17px] font-extrabold text-white mt-1 block font-mono">{issuedPolicy.policy_number}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">Sum Assured</span>
                <span className="text-[17px] font-extrabold text-white mt-1 block">{fmt(issuedPolicy.sum_assured)}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">Underwritten Premium</span>
                <span className="text-[17px] font-extrabold text-white mt-1 block">{formatINR(issuedPolicy.monthly_premium)}/mo</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">Commencement Date</span>
                <span className="text-[17px] font-extrabold text-white mt-1 block">{issuedPolicy.commencement_date}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-12 px-6 rounded-xl bg-white text-[#0E7A5F] font-bold inline-flex items-center gap-2 shadow-lg hover:bg-[#F3FAF7] transition-all"
              >
                <Printer className="w-4 h-4" /> Print Policy Certificate
              </button>
              <Link
                href="/dashboard"
                className="h-12 px-6 rounded-xl bg-[rgba(255,255,255,0.15)] text-white font-bold inline-flex items-center gap-2 hover:bg-[rgba(255,255,255,0.25)] transition-all border border-[rgba(255,255,255,0.3)]"
              >
                Go to Insurance Vault <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Selected Plan Snapshot Bar */}
        <div className="rounded-2xl p-5 bg-white border border-[#D9D3E8] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E9E4FF] text-[#7957FF] grid place-items-center font-extrabold text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7957FF]">Target Insurance Plan</span>
              <h3 className="m-0 text-[18px] font-extrabold text-[#24212B]">{planName}</h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">Cover Need</span>
              <span className="text-[16px] font-black text-[#24212B]">{fmt(sumAssured)}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">Tenure</span>
              <span className="text-[16px] font-black text-[#24212B]">{tenureYears} Years</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">Standard Base Rate</span>
              <span className="text-[16px] font-black text-[#6F6A7C] line-through">{formatINR(baseMonthlyPremium)}/mo</span>
            </div>
            <div className="pl-3 border-l border-[#D9D3E8]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7957FF]">Underwritten Rate</span>
              <span className="text-[19px] font-black text-[#7957FF]">
                {decision ? formatINR(decision.adjusted_monthly_premium) : formatINR(baseMonthlyPremium)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Workflows */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: CKYC & Medical Questionnaire (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Step 1: Instant CKYC Simulation */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D3E8] shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#F1EEF8] pb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-extrabold ${kycData ? "bg-[#0E7A5F] text-white" : "bg-[#7957FF] text-white"}`}>
                    {kycData ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                  </span>
                  <div>
                    <h2 className="m-0 text-[20px] font-extrabold text-[#24212B]">Instant CKYC &amp; PAN Verification</h2>
                    <p className="m-0 text-[13px] text-[#6F6A7C]">Real-time integration with Central KYC Registry (CERSAI) &amp; NSDL</p>
                  </div>
                </div>
                {kycData && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F6F0] text-[#0E7A5F] text-[12px] font-bold">
                    <BadgeCheck className="w-4 h-4" /> KYC Verified
                  </span>
                )}
              </div>

              {/* Preset Quick Selectors */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#6F6A7C]">Simulate verified retail banking customer:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_PANS.map((p) => {
                    const isSelected = panNumber === p.pan;
                    return (
                      <button
                        key={p.pan}
                        type="button"
                        onClick={() => selectPresetPAN(p)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#F7F4FF] border-[#7957FF] shadow-[0_2px_0_#7957FF]"
                            : "bg-white border-[#D9D3E8] hover:border-[#7957FF]"
                        }`}
                      >
                        <span className="block text-[11px] font-extrabold text-[#7957FF]">{p.bank}</span>
                        <span className="block text-[13px] font-bold text-[#24212B] truncate">{p.name}</span>
                        <span className="block text-[11px] text-[#6F6A7C] font-mono">{p.pan}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PAN Form Input */}
              <form onSubmit={handleVerifyKYC} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pan" className="block text-[12px] font-bold uppercase tracking-wider text-[#6F6A7C] mb-1.5">
                    PAN Number (10 Alphanumeric)
                  </label>
                  <input
                    id="pan"
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full h-12 rounded-xl border border-[#D9D3E8] px-3.5 font-mono text-[16px] font-bold uppercase focus:outline-none focus:border-[#7957FF]"
                  />
                </div>
                <div>
                  <label htmlFor="pname" className="block text-[12px] font-bold uppercase tracking-wider text-[#6F6A7C] mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    id="pname"
                    type="text"
                    value={proposerName}
                    onChange={(e) => setProposerName(e.target.value)}
                    placeholder="Full name as on PAN card"
                    className="w-full h-12 rounded-xl border border-[#D9D3E8] px-3.5 text-[15px] font-semibold focus:outline-none focus:border-[#7957FF]"
                  />
                </div>

                {kycError && (
                  <div className="sm:col-span-2 text-sm text-[#C23B3B] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {kycError}
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isVerifyingKYC}
                    className="h-11 px-5 rounded-xl bg-[#7957FF] text-white font-bold inline-flex items-center gap-2 shadow-[0_3px_0_#5B3BE6] disabled:opacity-60"
                  >
                    {isVerifyingKYC ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isVerifyingKYC ? "Querying CERSAI Registry…" : "Verify CKYC Identifier"}
                  </button>
                </div>
              </form>

              {/* Verified CKYC Card Details */}
              {kycData && (
                <div className="rounded-2xl p-4 sm:p-5 bg-[#FAF9FE] border border-[#D9D3E8] flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9E4FF] pb-3">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#7957FF]">
                      <Lock className="w-4 h-4" /> CKYC Registry Record #{kycData.ckyc_number}
                    </div>
                    <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E7F6F0] text-[#0E7A5F]">
                      AML / Sanctions Cleared
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[13.5px]">
                    <div>
                      <span className="text-[#6F6A7C]">Name on Record:</span>{" "}
                      <strong className="text-[#24212B]">{kycData.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#6F6A7C]">Date of Birth:</span>{" "}
                      <strong className="text-[#24212B]">{kycData.dob}</strong>
                    </div>
                    <div>
                      <span className="text-[#6F6A7C]">Father/Spouse:</span>{" "}
                      <strong className="text-[#24212B]">{kycData.father_or_spouse_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#6F6A7C]">Gender / Pincode:</span>{" "}
                      <strong className="text-[#24212B]">{kycData.gender} · {kycData.pincode}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#6F6A7C]">Verified Bureau Address:</span>{" "}
                      <span className="font-medium text-[#24212B]">{kycData.address}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Step 2: Dynamic 3-Question Medical Triage */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D3E8] shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#F1EEF8] pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#7957FF] text-white grid place-items-center text-sm font-extrabold">
                    2
                  </span>
                  <div>
                    <h2 className="m-0 text-[20px] font-extrabold text-[#24212B]">Algorithmic Medical Underwriting Triage</h2>
                    <p className="m-0 text-[13px] text-[#6F6A7C]">3 clinical questions evaluated directly against actuarial tables</p>
                  </div>
                </div>
                {evaluating && (
                  <span className="text-[12px] font-bold text-[#7957FF] inline-flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalibrating…
                  </span>
                )}
              </div>

              {/* Triage Q1: Tobacco / Nicotine */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[14px] font-bold text-[#24212B]">
                  1. Tobacco or Nicotine Consumption
                  <span className="block text-[12.5px] font-medium text-[#6F6A7C]">
                    Cigarettes, beedis, chewing tobacco, or e-cigarettes/vaping in the past 24 months.
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "never", title: "Never Consumed", desc: "Preferred Non-Smoker · 0% Loading" },
                    { id: "occasional", title: "Occasional / Social", desc: "+15% Risk Loading" },
                    { id: "regular", title: "Regular Consumer", desc: "+35% Loading · Cotinine Test" },
                  ].map((t) => {
                    const on = tobaccoUse === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTobaccoUse(t.id as typeof tobaccoUse)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          on
                            ? "bg-[#F7F4FF] border-[#7957FF] shadow-[0_2px_0_#7957FF]"
                            : "bg-white border-[#D9D3E8] hover:border-[#7957FF]"
                        }`}
                      >
                        <span className="block text-[14px] font-extrabold text-[#24212B]">{t.title}</span>
                        <span className="block text-[11.5px] text-[#6F6A7C] mt-0.5">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Triage Q2: Chronic Health Conditions */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#F1EEF8]">
                <label className="text-[14px] font-bold text-[#24212B]">
                  2. Pre-Existing Medical History
                  <span className="block text-[12.5px] font-medium text-[#6F6A7C]">
                    Diagnosed chronic conditions under medication or surgical treatment (select all that apply).
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "none", title: "None (Clean Health Profile)", desc: "Zero pre-existing conditions · Standard Acceptance" },
                    { id: "hypertension", title: "Hypertension (Blood Pressure)", desc: "+15% Loading · Under physician control" },
                    { id: "diabetes", title: "Type 2 Diabetes Mellitus", desc: "+25% Loading · HbA1c & Fasting Sugar Report" },
                    { id: "cardiac_history", title: "Cardiovascular / Heart Event", desc: "+50% Loading · ECG & Cardiologist Workup" },
                  ].map((c) => {
                    const on = conditions.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCondition(c.id)}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          on
                            ? "bg-[#F7F4FF] border-[#7957FF] shadow-[0_2px_0_#7957FF]"
                            : "bg-white border-[#D9D3E8] hover:border-[#7957FF]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md border grid place-items-center text-xs font-bold shrink-0 ${
                            on ? "bg-[#7957FF] text-white border-[#7957FF]" : "bg-white border-[#D9D3E8]"
                          }`}
                        >
                          {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <div>
                          <span className="block text-[14px] font-extrabold text-[#24212B]">{c.title}</span>
                          <span className="block text-[11.5px] text-[#6F6A7C] mt-0.5">{c.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Triage Q3: Family Longevity */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#F1EEF8]">
                <label className="text-[14px] font-bold text-[#24212B]">
                  3. Family Longevity &amp; Hereditary History
                  <span className="block text-[12.5px] font-medium text-[#6F6A7C]">
                    Biological parents and siblings health and longevity history.
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "both_parents_above_70", title: "Both Parents 70+", desc: "-5% Longevity Bonus Discount" },
                    { id: "no_major_family_illness", title: "Standard History", desc: "No early cardiovascular/cancer · 0% Loading" },
                    { id: "one_parent_cardiac_cancer_before_60", title: "Early Hereditary Risk", desc: "Parent cardiac/cancer < 60 · +10% Loading" },
                  ].map((f) => {
                    const on = familyLongevity === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFamilyLongevity(f.id as typeof familyLongevity)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          on
                            ? "bg-[#F7F4FF] border-[#7957FF] shadow-[0_2px_0_#7957FF]"
                            : "bg-white border-[#D9D3E8] hover:border-[#7957FF]"
                        }`}
                      >
                        <span className="block text-[14px] font-extrabold text-[#24212B]">{f.title}</span>
                        <span className="block text-[11.5px] text-[#6F6A7C] mt-0.5">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Underwriting Decision & Policy Binding (5 cols) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-6">
            {decision && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9D3E8] shadow-md flex flex-col gap-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#7957FF]">
                      Actuarial Underwriting Decision
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                        decision.stp_eligible
                          ? "bg-[#E7F6F0] text-[#0E7A5F]"
                          : "bg-[#FFF4D6] text-[#8A6100]"
                      }`}
                    >
                      {decision.stp_eligible ? "✓ Straight-Through Processing" : "Requires Tele-Verification"}
                    </span>
                  </div>
                  <h3 className="m-0 text-[20px] font-black text-[#24212B] leading-snug">
                    {decision.decision_badge}
                  </h3>
                  <p className="m-0 text-[13.5px] text-[#5A5566] mt-2 leading-relaxed">
                    {decision.decision_summary}
                  </p>
                </div>

                {/* Premium Recalibration Display */}
                <div className="rounded-2xl p-4 sm:p-5 bg-[#F7F4FF] border border-[#D9D3E8] flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-bold text-[#6F6A7C]">Quoted Monthly Premium:</span>
                    <div className="text-right">
                      {decision.loading_percentage !== 0 && (
                        <span className="block text-xs line-through text-[#6F6A7C]">
                          {formatINR(decision.original_monthly_premium)}/mo
                        </span>
                      )}
                      <span className="text-2xl font-black text-[#7957FF]">
                        {formatINR(decision.adjusted_monthly_premium)}
                        <span className="text-xs font-semibold text-[#5A5566]">/mo</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#E9E4FF] text-xs">
                    <span className="font-semibold text-[#6F6A7C]">Annual Premium:</span>
                    <span className="font-bold text-[#24212B]">{formatINR(decision.adjusted_annual_premium)} / year</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#6F6A7C]">Underwriting Loading / Discount:</span>
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded ${
                        decision.loading_percentage > 0
                          ? "bg-[#FFE8E8] text-[#C23B3B]"
                          : decision.loading_percentage < 0
                          ? "bg-[#E7F6F0] text-[#0E7A5F]"
                          : "bg-white text-[#24212B]"
                      }`}
                    >
                      {decision.loading_percentage > 0 ? `+${decision.loading_percentage}%` : `${decision.loading_percentage}%`}
                    </span>
                  </div>
                </div>

                {/* Factor Breakdown */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">Risk Assessment Factors:</span>
                  <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-[12.5px] text-[#4A4553]">
                    {decision.underwriting_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 text-[#7957FF] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Medical Requirements */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#F1EEF8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">
                    Mandatory Diagnostic Requirements:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {decision.medical_requirements.map((req, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#FAF9FE] border border-[#E9E4FF] text-[12.5px] font-medium text-[#24212B] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#7957FF] shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleIssuePolicy}
                    disabled={issuing || !kycData}
                    className="w-full h-14 rounded-xl bg-[#7957FF] text-white font-extrabold text-[16px] inline-flex items-center justify-center gap-2 shadow-[0_4px_0_#5B3BE6] hover:bg-[#6A47F5] transition-all disabled:opacity-60"
                  >
                    {issuing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" /> Binding Policy Schedule…
                      </>
                    ) : decision.stp_eligible ? (
                      <>
                        <Sparkles className="w-5 h-5" /> Issue Policy Instantly (Zero-Touch STP)
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-5 h-5" /> Bind Conditional Policy Schedule
                      </>
                    )}
                  </button>

                  <p className="m-0 text-[11.5px] text-[#6F6A7C] text-center leading-relaxed">
                    Underwritten under Section 45 Insurance Act 1938 and IRDAI Non-Linked Life Guidelines. 30-day unconditional free-look guarantee.
                  </p>
                </div>
              </div>
            )}

            {/* Back link */}
            <div className="flex justify-between items-center text-sm font-semibold">
              <Link href="/advisory" className="text-[#5A5566] hover:text-[#7957FF] inline-flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Stage 4: Advisory
              </Link>
              <Link href="/products" className="text-[#5A5566] hover:text-[#7957FF] inline-flex items-center gap-1.5">
                Stage 3: Plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

