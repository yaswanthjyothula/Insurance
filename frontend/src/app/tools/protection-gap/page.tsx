"use client";

import React, { useState } from "react";
import { Radar, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

export default function ProtectionGapRadarPage() {
  const [incomeScore, setIncomeScore] = useState(70);
  const [debtScore, setDebtScore] = useState(50);
  const [goalsScore, setGoalsScore] = useState(40);
  const [emergencyScore, setEmergencyScore] = useState(85);

  const overallScore = Math.round((incomeScore * 0.4 + debtScore * 0.3 + goalsScore * 0.2 + emergencyScore * 0.1));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <Radar className="w-3.5 h-3.5" />
          <span>Multidimensional Financial Resilience</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Protection Gap Radar™
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Audit your protection strength across all four critical financial pillars: 
          Income Replacement, Debt Shielding, Milestone Goals, and Emergency Cash Buffer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Sliders */}
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-2">
            Pillar Coverage Proportions
          </h2>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Income Replacement Covered:</span>
              <span className="font-bold text-[#7957FF]">{incomeScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={incomeScore}
              onChange={(e) => setIncomeScore(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Outstanding Debt Immunized:</span>
              <span className="font-bold text-[#7957FF]">{debtScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={debtScore}
              onChange={(e) => setDebtScore(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Milestone Goals Funded:</span>
              <span className="font-bold text-[#7957FF]">{goalsScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={goalsScore}
              onChange={(e) => setGoalsScore(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Emergency Liquidity (6 Mos):</span>
              <span className="font-bold text-[#7957FF]">{emergencyScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={emergencyScore}
              onChange={(e) => setEmergencyScore(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>
        </div>

        {/* Visual Score Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase text-[#6F6A7C] dark:text-[#A59FB5]">
              Overall Protection Health Index
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-[#24212B] dark:text-white">
                {overallScore}/100
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                overallScore >= 75
                  ? "bg-emerald-100 text-emerald-800"
                  : overallScore >= 50
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}>
                {overallScore >= 75 ? "Resilient" : overallScore >= 50 ? "Moderate Gaps" : "High Risk Exposure"}
              </span>
            </div>

            {/* Pillar Breakdown Progress Bars */}
            <div className="space-y-2 pt-2 border-t border-[#D9D3E8] dark:border-[#1E2D4A] text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Income Replacement</span>
                  <span>{incomeScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-[#7957FF]" style={{ width: `${incomeScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Debt Obligation Shield</span>
                  <span>{debtScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${debtScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Future Milestone Goals</span>
                  <span>{goalsScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${goalsScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Emergency Fund Buffer</span>
                  <span>{emergencyScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${emergencyScore}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/tools/life-cover-calculator"
                className="block text-center py-2.5 px-4 text-xs font-bold text-white bg-[#7957FF] rounded-xl hover:bg-[#6444E6]"
              >
                Close These Gaps With Accurate Assessment →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
