"use client";

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
  Info
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function ScenarioStudioPage() {
  const [loading, setLoading] = useState(false);
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>("another_child");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    } catch (err) {
      console.error("Scenario simulation error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScenarioSimulation("another_child");
    loadSavedScenarios();
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF] text-[#24212B]">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFFFFF] border border-[#7957FF]/40 text-[#7957FF] text-xs font-extrabold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-[#7957FF]" />
          <span>Interactive What-If Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B]">
          Scenario Studio™
        </h1>
        <p className="text-sm text-[#4A4553] max-w-2xl mx-auto leading-relaxed font-medium">
          Simulate life transitions without modifying your permanent baseline. Inspect exact delta shifts 
          in required coverage and indicative annual premiums.
        </p>
      </div>

      <img
        src="/scenario-studio-hero.svg"
        alt="One baseline branching into three life scenarios, each showing the change in required cover"
        className="w-full h-auto rounded-[32px] border border-[#D9D3E8]"
        width={1200}
        height={480}
      />

      {/* One-Tap Scenario Selector Bar */}
      <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D3E8] px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
            Select One-Tap Scenario:
          </span>
          <span className="text-xs text-[#24212B] font-bold">
            Baseline: Age {baselineInput.age} | Income {formatINR(baselineInput.annual_income, { compact: true })} | Debt {formatINR(baselineInput.outstanding_liabilities, { compact: true })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
              <div className="font-bold text-xs text-[#24212B] mb-1">{p.title}</div>
              <div className="text-[10px] text-[#6F6A7C] line-clamp-2 font-medium">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Diff Display Area */}
      {comparisonResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Side-by-Side Comparison */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-6 sm:p-8 shadow-sm space-y-6 text-[#24212B]">
              
              <div className="flex items-center justify-between border-b border-[#D9D3E8] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
                    Dynamic Comparison Diff
                  </span>
                  <h2 className="text-xl font-extrabold text-[#24212B]">
                    {comparisonResult.title}
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

              {/* High Level Diff Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cover Shift Card */}
                <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-2">
                  <span className="text-xs font-bold text-[#6F6A7C] uppercase">
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
                      <TrendingDown className="w-5 h-5 text-[#24212B]" />
                    )}
                  </div>
                  <div className="text-xs text-[#4A4553] flex justify-between pt-1 border-t border-[#D9D3E8] font-medium">
                    <span>Baseline: {formatINR(comparisonResult.baseline_result.net_needs.net_coverage_gap, { compact: true })}</span>
                    <span>Scenario: {formatINR(comparisonResult.scenario_result.net_needs.net_coverage_gap, { compact: true })}</span>
                  </div>
                </div>

                {/* Premium Shift Card */}
                <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-2">
                  <span className="text-xs font-bold text-[#6F6A7C] uppercase">
                    Indicative Annual Term Premium Shift
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#24212B]">
                      {comparisonResult.estimated_premium_difference > 0 ? "+" : ""}
                      {formatINR(comparisonResult.estimated_premium_difference)}/yr
                    </span>
                  </div>
                  <div className="text-xs text-[#4A4553] flex justify-between pt-1 border-t border-[#D9D3E8] font-medium">
                    <span>Baseline: ~{formatINR(comparisonResult.baseline_result.net_needs.net_coverage_gap / 100000 * 115 * 1.3)}</span>
                    <span className="text-[#7957FF] font-extrabold">Supported Model</span>
                  </div>
                </div>

              </div>

              {/* Traceable Mathematical Diff Table */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#24212B]">
                  Modified Input Variables (Rupee-for-Rupee Audit)
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#D9D3E8]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FFFFFF] border-b border-[#D9D3E8] text-[#7957FF] font-bold">
                      <tr>
                        <th className="p-3">Variable</th>
                        <th className="p-3">Original Baseline</th>
                        <th className="p-3">Scenario Value</th>
                        <th className="p-3">Net Modification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#000000] bg-[#FFFFFF]/40">
                      {comparisonResult.diffs.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#FFFFFF] transition-colors">
                          <td className="p-3 font-semibold text-[#24212B]">{d.label}</td>
                          <td className="p-3 text-[#4A4553]">{String(d.baseline_value)}</td>
                          <td className="p-3 font-extrabold text-[#24212B]">{String(d.scenario_value)}</td>
                          <td className="p-3 font-medium text-[#7957FF]">{d.difference_str}</td>
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
            
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4 text-[#24212B]">
              <h3 className="text-sm font-extrabold text-[#24212B] border-b border-[#D9D3E8] pb-3">
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
                  onClick={() => runScenarioSimulation(selectedScenarioType)}
                  className="w-full py-2.5 bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] font-extrabold border border-[#7957FF] rounded-lg mt-2 transition-colors"
                >
                  Recalculate Diff
                </button>
              </div>
            </div>

            {/* Saved Scenarios List */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4 text-[#24212B]">
              <h3 className="text-sm font-extrabold text-[#24212B] border-b border-[#D9D3E8] pb-3">
                Saved Scenarios ({savedScenarios.length})
              </h3>
              {savedScenarios.length === 0 ? (
                <p className="text-xs text-[#A59FB5]">No scenarios saved in this session yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedScenarios.slice(0, 5).map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] text-xs space-y-1">
                      <div className="font-bold text-[#24212B]">{s.title}</div>
                      <div className="text-[11px] text-[#7957FF] font-extrabold">
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

    </div>
  );
}
