"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function AffordabilityCalculatorPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(125000); // 1.25L / mo
  const [sumAssured, setSumAssured] = useState(15000000); // 1.5 Cr
  const [age, setAge] = useState(30);

  // Actuarial estimate
  const ratePerLakh = 110;
  const ageFactor = 1.0 + (age - 25) * 0.045;
  const annualPremium = (sumAssured / 100000) * ratePerLakh * ageFactor;
  const monthlyPremium = annualPremium / 12;
  const budgetRatio = (monthlyPremium / monthlyIncome) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Household Solvency Check</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Premium & Affordability Calculator
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Verify that term insurance premiums remain comfortably below 2-4% of your monthly earnings, 
          preventing premature policy lapsation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Monthly In-Hand Salary:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(monthlyIncome)}/mo</span>
            </div>
            <input
              type="range"
              min="30000"
              max="500000"
              step="5000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Desired Term Cover:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(sumAssured, { compact: true })}</span>
            </div>
            <input
              type="range"
              min="2500000"
              max="50000000"
              step="2500000"
              value={sumAssured}
              onChange={(e) => setSumAssured(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Current Age: {age} Years</span>
            </div>
            <input
              type="range"
              min="18"
              max="60"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase text-[#6F6A7C] dark:text-[#A59FB5]">
              Estimated Premium Outflow
            </span>
            <div className="text-3xl font-black text-[#24212B] dark:text-white">
              {formatINR(annualPremium)}<span className="text-sm font-normal text-[#6F6A7C]">/year</span>
            </div>
            <div className="text-sm font-semibold text-[#0E9F7E]">
              ~{formatINR(monthlyPremium)} / month ({budgetRatio.toFixed(1)}% of in-hand salary)
            </div>

            <div className={`p-3 rounded-xl text-xs font-medium ${
              budgetRatio <= 3.0
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
            }`}>
              {budgetRatio <= 3.0 ? (
                <span>✓ High Affordability: Premium is within the recommended 2-3% safety buffer.</span>
              ) : (
                <span>⚠ Moderate Strain: Consider starting with a lower initial tenure or pure protection variant.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
