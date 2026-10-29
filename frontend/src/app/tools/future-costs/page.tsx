"use client";

import React, { useState } from "react";
import { Calendar, TrendingUp, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function FutureCostsRealityCheckPage() {
  const [currentCost, setCurrentCost] = useState(2500000); // 25 Lakhs
  const [yearsAway, setYearsAway] = useState(14); // 14 years
  const [inflationRate, setInflationRate] = useState(0.08); // 8% education inflation

  const futureCost = currentCost * Math.pow(1 + inflationRate, yearsAway);
  const multiplier = futureCost / currentCost;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" />
          <span>Compound Inflation Reality</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Future Cost Reality Check
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Education and healthcare inflation in India historically runs at 8-10% annually. 
          See the real future capital your family will need for milestone goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Cost in Today&apos;s Rupees:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{formatINR(currentCost, { compact: true })}</span>
            </div>
            <input
              type="range"
              min="500000"
              max="10000000"
              step="500000"
              value={currentCost}
              onChange={(e) => setCurrentCost(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Years Until Expenditure:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{yearsAway} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={yearsAway}
              onChange={(e) => setYearsAway(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Expected Annual Inflation:</span>
              <span className="font-bold text-[#24212B] dark:text-white">{(inflationRate * 100).toFixed(1)}% p.a.</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.12"
              step="0.005"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full accent-[#7957FF]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase text-[#6F6A7C] dark:text-[#A59FB5]">
              Projected Cost in {2026 + yearsAway}
            </span>
            <div className="text-4xl font-black text-[#24212B] dark:text-white">
              {formatINR(futureCost, { compact: true })}
            </div>
            <div className="text-xs text-[#7957FF] font-bold">
              Inflation Multiplier: {multiplier.toFixed(2)}x of today&apos;s cost
            </div>
            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed pt-2 border-t border-[#D9D3E8] dark:border-[#1E2D4A]">
              Under an { (inflationRate * 100).toFixed(1) }% inflation rate, an undergraduate or higher education degree costing {formatINR(currentCost, { compact: true })} today will require {formatINR(futureCost, { compact: true })} in {yearsAway} years.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
