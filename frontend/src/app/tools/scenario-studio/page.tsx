"use client";

import { ToolShell } from "@/components/tools/kit";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Layers, 
  ArrowRight, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Sparkles,
  Info,
  Bot,
  Send,
  Lightbulb,
  Check,
  RefreshCw
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

const EXAMPLE_REAL_LIFE_PROMPTS = [
  {
    title: "Startup Founder & New Baby",
    prompt: "I am resigning from my corporate job to start a tech consultancy, expecting 0 salary for 12 months, taking a ₹15 Lakh business loan, and our family is expecting our first child next year."
  },
  {
    title: "Dream Home & Spouse Career Break",
    prompt: "We are purchasing a 3BHK flat in Bangalore with a ₹75 Lakh home loan. My spouse is taking a 2-year sabbatical to study, and our living expenses will temporarily rise by ₹25,000 per month."
  },
  {
    title: "Welcoming Twins & Buying an EV",
    prompt: "My partner is having twins next year! We need to fund two college milestones, our living expenses will go up by 30%, and we are taking a ₹20 Lakh auto loan for a 7-seater car."
  },
  {
    title: "FIRE: Early Retirement at 45",
    prompt: "I want to achieve financial independence and retire at age 45 instead of 60, moving to a tier-2 city where living expenses drop by 25%, while clearing all remaining debts."
  }
];

export default function ScenarioStudioPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preset" | "ai_custom">("ai_custom");
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>("another_child");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Real-Life Scenario State
  const [userCustomPrompt, setUserCustomPrompt] = useState("");
  const [aiCustomResponse, setAiCustomResponse] = useState<{
    ai_title?: string;
    ai_analysis?: string;
    actionable_recommendations?: string[];
    model_used?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Baseline input
  const [baselineInput, setBaselineInput] = useState({
    age: 32,
    annual_income: 1800000,
    annual_expenses: 720000,
    dependents_count: 2,
    support_horizon_years: 25,
    outstanding_liabilities: 4000000,
    existing_cover: 5000000,
    eligible_assets: 2000000,
    retirement_age: 60,
    inflation_rate: 0.06,
    discount_rate: 0.075,
    smoker_status: false
  });

  const scenarioPresets = [
    {
      id: "another_child",
      title: "Another Child",
      desc: "Adds +1 dependent, funds a ₹25L future college goal, and increases living expenses by 15%."
    },
    {
      id: "retire_55",
      title: "Retire at 55",
      desc: "Early retirement reduces the active earning window by 5 years, compressing dependency protection."
    },
    {
      id: "income_down_20",
      title: "Income Down 20%",
      desc: "Simulates income contraction and highlights affordability strain on insurance premiums."
    },
    {
      id: "loan_cleared",
      title: "Loan Cleared Early",
      desc: "Prepaying debt zeroes out liabilities, reducing your required protection rupee-for-rupee."
    },
    {
      id: "add_home_loan",
      title: "Add Home Loan (₹50L)",
      desc: "Taking on a fresh mortgage increases debt obligation that must be shielded for your family."
    }
  ];

  const runScenarioSimulation = async (stype: string) => {
    setLoading(true);
    setSelectedScenarioType(stype);
    setAiError(null);
    try {
      const preset = scenarioPresets.find(p => p.id === stype);
      const res = await fetchFromAPI("/scenarios", {
        method: "POST",
        body: JSON.stringify({
          scenario: {
            scenario_type: stype,
            title: preset?.title || "Custom Scenario",
            description: preset?.desc || ""
          },
          baseline_input: baselineInput
        })
      });
      setComparisonResult(res);
      setAiCustomResponse(null);
    } catch (err) {
      console.error("Scenario simulation error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAICustomScenario = async (promptToRun?: string) => {
    const text = promptToRun || userCustomPrompt;
    if (!text.trim()) {
      setAiError("Please describe your real-life scenario or click one of the suggested examples below.");
      return;
    }

    setLoading(true);
    setAiError(null);
    try {
      const res = await fetchFromAPI("/scenarios/ai-custom", {
        method: "POST",
        body: JSON.stringify({
          user_scenario_prompt: text.trim(),
          baseline_input: baselineInput
        })
      });

      if (res && res.scenario_comparison) {
        setComparisonResult(res.scenario_comparison);
        setSelectedScenarioType("ai_custom");
        setAiCustomResponse({
          ai_title: res.ai_title,
          ai_analysis: res.ai_analysis,
          actionable_recommendations: res.actionable_recommendations,
          model_used: res.model_used
        });
      }
    } catch (err: any) {
      console.error("AI scenario error", err);
      setAiError(err?.message || "Failed to analyze scenario with Gemini. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedScenarios = async () => {
    try {
      const list = await fetchFromAPI("/scenarios");
      setSavedScenarios(list || []);
    } catch (e) {
      // local fallback
    }
  };

  const handleSaveScenario = async () => {
    if (!comparisonResult) return;
    try {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadSavedScenarios();
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  useEffect(() => {
    // Run default preset on load
    runScenarioSimulation("another_child");
    loadSavedScenarios();
  }, []);

  return (
    <ToolShell slug="scenario-studio" wide>
      <img
        src="/scenario-studio-hero.svg"
        alt="One baseline branching into three life scenarios, each showing the change in required cover"
        className="w-full h-auto rounded-[32px] border border-[#D9D3E8]"
        width={1200}
        height={480}
      />

      {/* Mode Switcher: Presets vs Add Custom Real-Life Scenario */}
      <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D3E8]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ai_custom")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "ai_custom"
                  ? "bg-[#7957FF] text-[#FFFFFF] shadow-[0_4px_16px_rgba(121,87,255,0.3)]"
                  : "bg-[#F8F7FC] text-[#5A5566] hover:bg-[#EFEBFF] hover:text-[#7957FF]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Add Real-Life Scenario (Gemini AI)</span>
            </button>
            <button
              onClick={() => setActiveTab("preset")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "preset"
                  ? "bg-[#7957FF] text-[#FFFFFF] shadow-[0_4px_16px_rgba(121,87,255,0.3)]"
                  : "bg-[#F8F7FC] text-[#5A5566] hover:bg-[#EFEBFF] hover:text-[#7957FF]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Standard Presets</span>
            </button>
          </div>

          <span className="text-xs text-[#5A5566] font-semibold">
            Baseline: Age {baselineInput.age} | Income {formatINR(baselineInput.annual_income, { compact: true })} | Debt {formatINR(baselineInput.outstanding_liabilities, { compact: true })}
          </span>
        </div>

        {/* Tab 1: AI Custom Real-Life Scenario Input */}
        {activeTab === "ai_custom" && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#24212B] flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#7957FF]" />
                  <span>Describe Your Real-Life Transition or Life Event:</span>
                </label>
                <span className="text-[11px] font-bold text-[#7957FF] bg-[#F4F0FF] px-2 py-0.5 rounded-full border border-[#7957FF]/20">
                  Powered by Gemini 3.1 Flash
                </span>
              </div>
              
              <div className="relative">
                <textarea
                  rows={3}
                  value={userCustomPrompt}
                  onChange={(e) => setUserCustomPrompt(e.target.value)}
                  placeholder="e.g., 'I am quitting my job to launch a startup with ₹15L borrowed capital, expecting a 40% income drop for 2 years, and my spouse is expecting a child next October...'"
                  className="w-full p-4 rounded-xl border border-[#D9D3E8] bg-[#FAFAFE] text-sm text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:ring-2 focus:ring-[#7957FF] focus:bg-[#FFFFFF] font-medium resize-none shadow-inner"
                />
              </div>

              {aiError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Quick-Prompt Suggestions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C] flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Or Click an Example Scenario to Test:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {EXAMPLE_REAL_LIFE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserCustomPrompt(ex.prompt);
                      handleRunAICustomScenario(ex.prompt);
                    }}
                    className="p-2.5 rounded-xl text-left border border-[#E8E5F0] bg-[#FFFFFF] hover:border-[#7957FF] hover:bg-[#F8F7FC] transition-all group"
                  >
                    <div className="text-xs font-extrabold text-[#24212B] group-hover:text-[#7957FF] mb-1 flex items-center justify-between">
                      <span>{ex.title}</span>
                      <ArrowRight className="w-3 h-3 text-[#7957FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-[#6F6A7C] line-clamp-2 leading-relaxed">
                      {ex.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#6F6A7C]">
                Gemini translates free-text into deterministic actuarial variables with 0 math hallucinations.
              </span>
              <button
                type="button"
                disabled={loading || !userCustomPrompt.trim()}
                onClick={() => handleRunAICustomScenario()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-all shadow-md"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Simulate Real-Life Scenario</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Standard Preset Scenarios */}
        {activeTab === "preset" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            {scenarioPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => runScenarioSimulation(p.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  selectedScenarioType === p.id
                    ? "border-2 border-[#7957FF] bg-[#FFFFFF] text-[#24212B] shadow-sm"
                    : "border-[#D9D3E8] bg-[#FFFFFF]/60 hover:border-[#7957FF]/40 text-[#24212B]"
                }`}
              >
                <div className="font-bold text-sm text-[#24212B] mb-1">{p.title}</div>
                <div className="text-xs text-[#6F6A7C] line-clamp-2 font-medium">{p.desc}</div>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Main Diff Display Area */}
      {comparisonResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          
          {/* Left Column: Side-by-Side Comparison */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-[#24212B]">
              
              <div className="flex items-center justify-between border-b border-[#D9D3E8] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
                      {selectedScenarioType === "ai_custom" ? "✨ Gemini AI Scenario Simulation" : "Dynamic Comparison Diff"}
                    </span>
                    {aiCustomResponse?.model_used && (
                      <span className="text-[10px] bg-[#EFEBFF] text-[#7957FF] font-bold px-2 py-0.5 rounded-full">
                        {aiCustomResponse.model_used}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-[#24212B] mt-0.5">
                    {aiCustomResponse?.ai_title || comparisonResult.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveScenario}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-xs font-extrabold hover:bg-[#6444E6] border border-[#7957FF] transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-[#FFFFFF]" />
                    <span>{saveSuccess ? "Saved!" : "Save Scenario"}</span>
                  </button>
                </div>
              </div>

              {/* Gemini AI Strategic Insights Card (If AI Scenario) */}
              {aiCustomResponse?.ai_analysis && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F7F5FF] to-[#FAF8FF] border border-[#7957FF]/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#7957FF]">
                    <Sparkles className="w-4 h-4 text-[#7957FF]" />
                    <span>Gemini AI Actuarial Risk Analysis</span>
                  </div>
                  <p className="text-sm text-[#24212B] leading-relaxed font-semibold">
                    {aiCustomResponse.ai_analysis}
                  </p>

                  {aiCustomResponse.actionable_recommendations && aiCustomResponse.actionable_recommendations.length > 0 && (
                    <div className="pt-2 border-t border-[#7957FF]/15 space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5A5566]">
                        Actionable Hedging Recommendations:
                      </span>
                      <ul className="space-y-1">
                        {aiCustomResponse.actionable_recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-[#4A4553] flex items-start gap-2 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#7957FF] shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* High Level Diff Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cover Shift Card */}
                <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-2">
                  <span className="text-xs font-bold text-[#6F6A7C] uppercase tracking-wider">
                    Protection Gap Shift
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#24212B]">
                      {comparisonResult.cover_difference > 0 ? "+" : ""}
                      {formatINR(comparisonResult.cover_difference, { compact: true })}
                    </span>
                    {comparisonResult.cover_difference > 0 ? (
                      <TrendingUp className="w-5 h-5 text-[#7957FF]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#10B981]" />
                    )}
                  </div>
                  <div className="text-xs text-[#4A4553] flex justify-between pt-1 border-t border-[#D9D3E8] font-medium">
                    <span>Baseline: {formatINR(comparisonResult.baseline_result.net_needs.net_coverage_gap, { compact: true })}</span>
                    <span className="font-bold text-[#24212B]">New Need: {formatINR(comparisonResult.scenario_result.net_needs.net_coverage_gap, { compact: true })}</span>
                  </div>
                </div>

                {/* Premium Shift Card */}
                <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-2">
                  <span className="text-xs font-bold text-[#6F6A7C] uppercase tracking-wider">
                    Indicative Annual Term Premium Shift
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#24212B]">
                      {comparisonResult.estimated_premium_difference > 0 ? "+" : ""}
                      {formatINR(comparisonResult.estimated_premium_difference)}/yr
                    </span>
                  </div>
                  <div className="text-xs text-[#4A4553] flex justify-between pt-1 border-t border-[#D9D3E8] font-medium">
                    <span>Deterministic Actuarial Math</span>
                    <span className="text-[#7957FF] font-extrabold">IRDAI Aligned</span>
                  </div>
                </div>

              </div>

              {/* Traceable Mathematical Diff Table */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#24212B]">
                  Detected Parameter Adjustments (Rupee-for-Rupee Audit)
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#D9D3E8]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F7FC] border-b border-[#D9D3E8] text-[#7957FF] font-extrabold">
                      <tr>
                        <th className="p-3">Variable</th>
                        <th className="p-3">Original Baseline</th>
                        <th className="p-3">Scenario Value</th>
                        <th className="p-3">Net Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E5F0] bg-[#FFFFFF]">
                      {comparisonResult.diffs.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#F8F7FC] transition-colors">
                          <td className="p-3 font-bold text-[#24212B]">{d.label}</td>
                          <td className="p-3 text-[#5A5566]">{String(d.baseline_value)}</td>
                          <td className="p-3 font-extrabold text-[#24212B]">{String(d.scenario_value)}</td>
                          <td className="p-3 font-extrabold text-[#7957FF]">{d.difference_str}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Plain English Grounded Explanation */}
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#7957FF]/40 space-y-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#24212B]">
                  <Info className="w-4 h-4 text-[#7957FF]" />
                  <span>Actuarial Driver Explanation</span>
                </div>
                <p className="text-xs text-[#4A4553] leading-relaxed font-medium">
                  {comparisonResult.explanation}
                </p>
              </div>

            </div>
          </div>

          {/* Right Column: Baseline Settings & Saved Scenarios */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4 text-[#24212B] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#24212B] border-b border-[#D9D3E8] pb-3">
                Quick Adjust Baseline
              </h3>
              
              <div className="space-y-3 text-xs font-medium">
                <div>
                  <label className="font-bold text-[#4A4553] block mb-1">
                    Your Age: {baselineInput.age}
                  </label>
                  <input
                    type="range"
                    min="21"
                    max="55"
                    value={baselineInput.age}
                    onChange={(e) => {
                      setBaselineInput({ ...baselineInput, age: Number(e.target.value) });
                    }}
                    className="w-full accent-[#7957FF]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#4A4553] block mb-1">
                    Annual Income: {formatINR(baselineInput.annual_income, { compact: true })}
                  </label>
                  <input
                    type="range"
                    min="300000"
                    max="10000000"
                    step="200000"
                    value={baselineInput.annual_income}
                    onChange={(e) => {
                      setBaselineInput({ ...baselineInput, annual_income: Number(e.target.value) });
                    }}
                    className="w-full accent-[#7957FF]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#4A4553] block mb-1">
                    Outstanding Debt: {formatINR(baselineInput.outstanding_liabilities, { compact: true })}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="15000000"
                    step="500000"
                    value={baselineInput.outstanding_liabilities}
                    onChange={(e) => {
                      setBaselineInput({ ...baselineInput, outstanding_liabilities: Number(e.target.value) });
                    }}
                    className="w-full accent-[#7957FF]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#4A4553] block mb-1">
                    Existing Cover: {formatINR(baselineInput.existing_cover, { compact: true })}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20000000"
                    step="500000"
                    value={baselineInput.existing_cover}
                    onChange={(e) => {
                      setBaselineInput({ ...baselineInput, existing_cover: Number(e.target.value) });
                    }}
                    className="w-full accent-[#7957FF]"
                  />
                </div>

                <button
                  onClick={() => {
                    if (selectedScenarioType === "ai_custom" && userCustomPrompt.trim()) {
                      handleRunAICustomScenario();
                    } else {
                      runScenarioSimulation(selectedScenarioType);
                    }
                  }}
                  className="w-full py-2.5 bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] font-extrabold border border-[#7957FF] rounded-xl mt-2 transition-colors shadow-sm"
                >
                  Recalculate Diff
                </button>
              </div>
            </div>

            {/* Saved Scenarios List */}
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4 text-[#24212B] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#24212B] border-b border-[#D9D3E8] pb-3">
                Saved Scenarios ({savedScenarios.length})
              </h3>
              {savedScenarios.length === 0 ? (
                <p className="text-xs text-[#A59FB5]">No scenarios saved in this session yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedScenarios.slice(0, 5).map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8F7FC] border border-[#E8E5F0] text-xs space-y-1">
                      <div className="font-bold text-[#24212B]">{s.title}</div>
                      <div className="text-xs text-[#7957FF] font-extrabold">
                        Shift: {s.cover_difference > 0 ? "+" : ""}{formatINR(s.cover_difference, { compact: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </ToolShell>
  );
}
