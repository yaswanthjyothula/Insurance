"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calculator, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Layers, 
  Sparkles,
  Info,
  Save,
  RotateCcw
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function LifeCoverCalculatorPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [age, setAge] = useState<number>(32);
  const [annualIncome, setAnnualIncome] = useState<number>(1800000);
  const [annualExpenses, setAnnualExpenses] = useState<number>(720000);
  const [dependents, setDependents] = useState<number>(2);
  const [supportHorizon, setSupportHorizon] = useState<number>(25);
  const [liabilities, setLiabilities] = useState<number>(3500000);
  const [existingCover, setExistingCover] = useState<number>(5000000);
  const [eligibleAssets, setEligibleAssets] = useState<number>(2000000);
  const [smoker, setSmoker] = useState<boolean>(false);
  
  // Assumptions
  const [inflationRate, setInflationRate] = useState<number>(0.06);
  const [discountRate, setDiscountRate] = useState<number>(0.075);
  const [retirementAge, setRetirementAge] = useState<number>(60);

  // Future Goals
  const [futureGoals, setFutureGoals] = useState([
    { name: "Child Higher Education", cost_today: 2500000, years_away: 14, category: "education" }
  ]);

  // Results State
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  const handleAddGoal = () => {
    setFutureGoals([
      ...futureGoals,
      { name: "Future Milestone Goal", cost_today: 1500000, years_away: 10, category: "education" }
    ]);
  };

  const handleRemoveGoal = (index: number) => {
    setFutureGoals(futureGoals.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age,
        annual_income: annualIncome,
        annual_expenses: annualExpenses,
        dependents_count: dependents,
        support_horizon_years: supportHorizon,
        outstanding_liabilities: liabilities,
        existing_cover: existingCover,
        eligible_assets: eligibleAssets,
        future_goals: futureGoals,
        inflation_rate: inflationRate,
        discount_rate: discountRate,
        retirement_age: retirementAge,
        smoker_status: smoker
      };

      const result = await fetchFromAPI("/assessments", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setAssessmentResult(result);

      // Fetch plan matches for this coverage gap
      const recPayload = {
        age,
        annual_income: annualIncome,
        coverage_gap: result.net_needs.net_coverage_gap,
        dependents_count: dependents,
        desired_tenure_years: Math.max(10, retirementAge - age),
        smoker_status: smoker,
        preferred_category: "term"
      };
      const recs = await fetchFromAPI("/recommendations", {
        method: "POST",
        body: JSON.stringify(recPayload)
      });
      setRecommendedProducts(recs.recommendations || []);

      setStep(4); // Move to results step
    } catch (err: any) {
      setError(err.message || "Failed to calculate assessment. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-3.5 h-3.5" />
          <span>Actuarial Precision</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          AI Life-Cover Calculator
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Calculate your family&apos;s true protection gap using Capital Needs Analysis and Human Life Value (HLV).
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-3 mb-10 text-xs font-bold">
        {[
          { num: 1, label: "Family Profile" },
          { num: 2, label: "Liabilities & Assets" },
          { num: 3, label: "Future Goals & Assumptions" },
          { num: 4, label: "Calculated Results" }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                step === s.num
                  ? "bg-[#7957FF] text-white"
                  : step > s.num
                  ? "bg-[#0E9F7E] text-white"
                  : "bg-[#D9D3E8] dark:bg-[#1E2D4A] text-[#6F6A7C] dark:text-[#A59FB5]"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`hidden sm:inline ${step === s.num ? "text-[#7957FF]" : "text-[#6F6A7C] dark:text-[#A59FB5]"}`}>
              {s.label}
            </span>
            {s.num < 4 && <div className="w-6 h-0.5 bg-[#D9D3E8] dark:bg-[#1E2D4A] hidden sm:block" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* STEP 1: FAMILY PROFILE */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Step 1: Household Earning & Expense Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Your Current Age: {age} Years
              </label>
              <input
                type="range"
                min="18"
                max="65"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Entry age defines insurance tenure eligibility</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Annual Take-Home Income (₹)
              </label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white focus:outline-[#7957FF]"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">e.g. ₹18,00,000 (₹18 Lakhs)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Annual Household Expenses (₹)
              </label>
              <input
                type="number"
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white focus:outline-[#7957FF]"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Living expenses your family depends on</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Financial Dependents: {dependents}
              </label>
              <input
                type="range"
                min="0"
                max="6"
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Spouse, children, or dependent parents</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl shadow transition-colors"
            >
              <span>Next: Liabilities & Assets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LIABILITIES & ASSETS */}
      {step === 2 && (
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Step 2: Balance Sheet & Existing Protection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Outstanding Debt / Loans (₹)
              </label>
              <input
                type="number"
                value={liabilities}
                onChange={(e) => setLiabilities(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Home mortgages, personal loans, car loans</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Existing Active Life Cover (₹)
              </label>
              <input
                type="number"
                value={existingCover}
                onChange={(e) => setExistingCover(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Current active term or endowment sum assured</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Eligible Liquid Financial Assets (₹)
              </label>
              <input
                type="number"
                value={eligibleAssets}
                onChange={(e) => setEligibleAssets(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">FDs, Mutual Funds, Stocks (Excluding primary home)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] dark:text-white mb-1">
                Support Horizon: {supportHorizon} Years
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={supportHorizon}
                onChange={(e) => setSupportHorizon(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
              <span className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5]">Years until youngest dependent is self-sufficient</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#6F6A7C] dark:text-[#A59FB5] hover:text-[#24212B] rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl shadow transition-colors"
            >
              <span>Next: Goals & Assumptions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GOALS & ASSUMPTIONS */}
      {step === 3 && (
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Step 3: Milestone Commitments & Disclosed Assumptions
          </h2>

          {/* Goals List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C] dark:text-[#A59FB5]">
                Future Family Milestones (e.g. Higher Education, Marriage)
              </span>
              <button
                type="button"
                onClick={handleAddGoal}
                className="text-xs font-bold text-[#7957FF] hover:underline"
              >
                + Add Another Goal
              </button>
            </div>

            {futureGoals.map((g, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => {
                    const updated = [...futureGoals];
                    updated[idx].name = e.target.value;
                    setFutureGoals(updated);
                  }}
                  className="p-2 text-xs rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-white dark:bg-[#0E1A33]"
                  placeholder="Goal Title"
                />
                <input
                  type="number"
                  value={g.cost_today}
                  onChange={(e) => {
                    const updated = [...futureGoals];
                    updated[idx].cost_today = Number(e.target.value);
                    setFutureGoals(updated);
                  }}
                  className="p-2 text-xs rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-white dark:bg-[#0E1A33]"
                  placeholder="Cost in Today's ₹"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={g.years_away}
                    onChange={(e) => {
                      const updated = [...futureGoals];
                      updated[idx].years_away = Number(e.target.value);
                      setFutureGoals(updated);
                    }}
                    className="p-2 text-xs rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-white dark:bg-[#0E1A33] w-20"
                    placeholder="Yrs"
                  />
                  <span className="text-xs text-[#6F6A7C]">Yrs away</span>
                  {futureGoals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-xs text-red-500 hover:underline ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actuarial Disclosed Assumptions */}
          <div className="pt-4 border-t border-[#D9D3E8] dark:border-[#1E2D4A] space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C] dark:text-[#A59FB5]">
              Disclosed Economic Assumptions (India)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">General Inflation: {(inflationRate * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0.04"
                  max="0.10"
                  step="0.005"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full accent-[#7957FF]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Discount Yield: {(discountRate * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.11"
                  step="0.005"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full accent-[#7957FF]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="smoker"
                  checked={smoker}
                  onChange={(e) => setSmoker(e.target.checked)}
                  className="w-4 h-4 accent-[#7957FF] rounded"
                />
                <label htmlFor="smoker" className="font-bold text-[#24212B] dark:text-white cursor-pointer">
                  Tobacco / Nicotine User (in last 3 yrs)
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-[#D9D3E8] dark:border-[#1E2D4A]">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#6F6A7C] dark:text-[#A59FB5]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl shadow-lg transition-all"
            >
              {loading ? (
                <span>Calculating Actuarial Needs...</span>
              ) : (
                <>
                  <span>Calculate Protection Gap</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CALCULATED RESULTS */}
      {step === 4 && assessmentResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Main Gap Highlight Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#24212B] via-[#24212B] to-[#6444E6] text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
                  Net Coverage Gap Required
                </span>
                <div className="text-4xl sm:text-5xl font-black mt-1">
                  {formatINR(assessmentResult.net_needs.net_coverage_gap, { compact: true })}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300">Total Gross Need:</span>
                <div className="text-xl font-bold text-slate-100">
                  {formatINR(assessmentResult.net_needs.total_gross_need, { compact: true })}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
              {assessmentResult.recommendation_summary}
            </p>
          </div>

          {/* Capital Needs Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
              <span className="text-[11px] font-bold text-[#6F6A7C] dark:text-[#A59FB5] uppercase">Income Replacement</span>
              <div className="text-xl font-extrabold text-[#24212B] dark:text-white">
                {formatINR(assessmentResult.net_needs.income_replacement_pv, { compact: true })}
              </div>
              <span className="text-[10px] text-[#7F8FA4]">Discounted living costs for {supportHorizon} yrs</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
              <span className="text-[11px] font-bold text-[#6F6A7C] dark:text-[#A59FB5] uppercase">Future Milestone Goals</span>
              <div className="text-xl font-extrabold text-[#24212B] dark:text-white">
                {formatINR(assessmentResult.net_needs.future_goals_pv, { compact: true })}
              </div>
              <span className="text-[10px] text-[#7F8FA4]">Present value of education/marriage milestones</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
              <span className="text-[11px] font-bold text-[#6F6A7C] dark:text-[#A59FB5] uppercase">Outstanding Liabilities</span>
              <div className="text-xl font-extrabold text-rose-500">
                {formatINR(assessmentResult.net_needs.outstanding_liabilities, { compact: true })}
              </div>
              <span className="text-[10px] text-[#7F8FA4]">Immediate debt retirement obligation</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
              <span className="text-[11px] font-bold text-[#6F6A7C] dark:text-[#A59FB5] uppercase">Deducted Assets & Cover</span>
              <div className="text-xl font-extrabold text-[#0E9F7E]">
                -{formatINR(assessmentResult.net_needs.eligible_assets_deducted + assessmentResult.net_needs.existing_cover_deducted, { compact: true })}
              </div>
              <span className="text-[10px] text-[#7F8FA4]">Existing wealth and active life policies</span>
            </div>
          </div>

          {/* HLV Cross-Reference Comparison */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#7957FF]" />
                <h3 className="text-base font-bold text-[#24212B] dark:text-white">
                  Human Life Value (HLV) Cross-Reference
                </h3>
              </div>
              <span className="text-xs font-bold text-[#7957FF] px-2.5 py-1 bg-[#E9E4FF] dark:bg-[#1B2B4D] rounded-md">
                Gross HLV: {formatINR(assessmentResult.hlv.hlv_gross, { compact: true })}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#6F6A7C] dark:text-[#A59FB5]">
              Your Human Life Value represents your economic value to your family based on your future working horizon of{" "}
              {assessmentResult.hlv.earning_horizon_years} years until age {retirementAge}. Net HLV gap is estimated at{" "}
              <strong>{formatINR(assessmentResult.hlv.hlv_net_gap, { compact: true })}</strong>.
            </p>
          </div>

          {/* Plan matching */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">PLAN MATCHING ENGINE</span>
                <h3 className="text-2xl font-bold text-[#24212B] dark:text-white">
                  Ranked Insurance Candidates for Your Gap
                </h3>
              </div>
              <Link href="/tools/scenario-studio" className="text-xs font-bold text-[#7957FF] hover:underline flex items-center gap-1">
                <span>Test in Scenario Studio</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedProducts.slice(0, 4).map((rec: any) => (
                <div
                  key={rec.product.id}
                  className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] hover:border-[#7957FF] transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#7957FF] uppercase">
                        Rank #{rec.rank} Match
                      </span>
                      <h4 className="text-base font-bold text-[#24212B] dark:text-white">
                        {rec.product.name}
                      </h4>
                      <span className="text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                        {rec.product.insurer}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#7F8FA4]">Indicative Premium</span>
                      <div className="text-lg font-black text-[#24212B] dark:text-white">
                        {formatINR(rec.estimated_annual_premium)}/yr
                      </div>
                      <span className="text-[10px] text-[#0E9F7E] font-bold">~{formatINR(rec.estimated_monthly_premium)}/mo</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                    {rec.grounded_explanation}
                  </p>

                  <div className="pt-2 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#24212B] dark:text-white">
                      CSR: {rec.product.claim_settlement_ratio != null ? `${rec.product.claim_settlement_ratio}%` : "not confirmed"} | Solvency: {rec.product.solvency_ratio != null ? `${rec.product.solvency_ratio}x` : "not confirmed"}
                    </span>
                    <Link
                      href={`/insurance/term`}
                      className="text-[#7957FF] hover:underline"
                    >
                      Compare Features →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#D9D3E8] dark:border-[#1E2D4A]">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#6F6A7C] dark:text-[#A59FB5] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-xl hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Modify Inputs</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/tools/scenario-studio"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#24212B] rounded-xl hover:opacity-95"
              >
                Simulate Scenarios with this Cover →
              </Link>
              <Link
                href="/dashboard/protection-passport"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#7957FF] rounded-xl hover:bg-[#6444E6]"
              >
                Save to Protection Passport
              </Link>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
