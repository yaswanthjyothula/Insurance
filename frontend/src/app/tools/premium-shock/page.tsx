"use client";

import React, { useState } from "react";
import { AlertOctagon, TrendingUp, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function PremiumShockSimulatorPage() {
  const [currentLivingExpenses, setCurrentLivingExpenses] = useState(60000); // 60k/mo
  const [medicalInflationRate, setMedicalInflationRate] = useState(0.12); // 12% health inflation
  const [yearsProjected, setYearsProjected] = useState(10);

  const futureLivingExpenses = currentLivingExpenses * Math.pow(1.06, yearsProjected);
  const healthCostMultiplier = Math.pow(1 + medicalInflationRate, yearsProjected);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Macroeconomic Stress Testing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Premium Shock Simulator
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Simulate how escalating healthcare costs and inflation shock household solvency 
          if adequate fixed-rate protection is not established early.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Current Monthly Living Expenses:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(currentLivingExpenses)}/mo</span>
            </div>
            <input
              type="range"
              min="25000"
              max="250000"
              step="5000"
              value={currentLivingExpenses}
              onChange={(e) => setCurrentLivingExpenses(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Medical & Hospital Inflation:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{(medicalInflationRate * 100).toFixed(0)}% p.a.</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.18"
              step="0.01"
              value={medicalInflationRate}
              onChange={(e) => setMedicalInflationRate(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Projection Window: {yearsProjected} Years</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              value={yearsProjected}
              onChange={(e) => setYearsProjected(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase text-[#6F6A7C] dark:text-[#A59FB5]">
              Projected Monthly Cost Shock
            </span>
            <div className="text-3xl font-black text-[#24212B] dark:text-white">
              {formatINR(futureLivingExpenses)}<span className="text-sm font-normal text-[#6F6A7C]">/month</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <strong>Medical Treatment Multiplier:</strong> A hospital procedure costing ₹5 Lakhs today will surge to <strong>{formatINR(500000 * healthCostMultiplier, { compact: true })}</strong> in {yearsProjected} years ({healthCostMultiplier.toFixed(2)}x increase).
            </div>

            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
              Term insurance premiums locked in at a young age remain fixed for your entire multi-decade policy tenure, acting as an unyielding firewall against living cost inflation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
