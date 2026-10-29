"use client";

import React, { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function PolicyReplacementCheckerPage() {
  const [existingPremium, setExistingPremium] = useState(50000); // 50k / yr in endowment
  const [existingSumAssured, setExistingSumAssured] = useState(1000000); // 10 Lakhs cover
  const [yearsPaid, setYearsPaid] = useState(4); // 4 yrs paid
  const [tenureYears, setTenureYears] = useState(20);

  // Term alternative: ₹1 Cr term cover costs ~₹12,000/yr.
  // The remaining ₹38,000/yr can be invested in PPF / Mutual Funds at ~10% p.a.
  const termAnnualCost = 12000;
  const surplusToInvest = Math.max(0, existingPremium - termAnnualCost);
  
  // Future projection of surplus invested at 10% for remaining 16 years
  const remainingYears = Math.max(1, tenureYears - yearsPaid);
  const r = 0.10;
  const futureInvestmentCorpus = surplusToInvest * ((Math.pow(1 + r, remainingYears) - 1) / r) * (1 + r);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Fiduciary Replacement Analysis</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Policy Replacement Checker
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Compare keeping your existing low-cover endowment plan versus switching to a pure term life shield 
          combined with disciplined mutual fund wealth creation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-2">
            Your Existing Policy Details
          </h2>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Annual Premium Paid:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(existingPremium)}/yr</span>
            </div>
            <input
              type="range"
              min="15000"
              max="200000"
              step="5000"
              value={existingPremium}
              onChange={(e) => setExistingPremium(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Current Life Cover (Sum Assured):</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(existingSumAssured, { compact: true })}</span>
            </div>
            <input
              type="range"
              min="200000"
              max="5000000"
              step="100000"
              value={existingSumAssured}
              onChange={(e) => setExistingSumAssured(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Years Already Paid: {yearsPaid} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={yearsPaid}
              onChange={(e) => setYearsPaid(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>
        </div>

        {/* Comparison Output */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase text-[#7957FF]">
              Buy Term & Invest the Difference Strategy
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A]">
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">10X Life Cover</span>
                <div className="text-lg font-black text-[#24212B] dark:text-white mt-1">₹1.00 Crore</div>
                <span className="text-[10px] text-emerald-600 font-bold">vs {formatINR(existingSumAssured, { compact: true })} current</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A]">
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">Invested Surplus</span>
                <div className="text-lg font-black text-[#24212B] dark:text-white mt-1">{formatINR(surplusToInvest)}/yr</div>
                <span className="text-[10px] text-[#7957FF] font-bold">In diversified funds</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
              <strong>Projected Surplus Wealth:</strong> By redirecting {formatINR(surplusToInvest)}/yr into index funds @ 10% p.a., your family would accumulate an estimated <strong>{formatINR(futureInvestmentCorpus, { compact: true })}</strong> over the remaining {remainingYears} years, while holding 10X higher life protection.
            </div>

            <div className="text-[11px] text-[#7F8FA4] italic pt-1 border-t border-[#D9D3E8] dark:border-[#1E2D4A]">
              Important: Check your current policy&apos;s Guaranteed Surrender Value before cancelling. If paid for less than 3 years, surrender penalties may be significant.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
