"use client";

import React, { useState } from "react";
import { TrendingUp, Calculator, ShieldCheck, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function EMICalculatorPage() {
  const [principal, setPrincipal] = useState<number>(5000000); // ₹50 Lakhs
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years

  const tenureMonths = tenureYears * 12;
  const r = (interestRate / 100) / 12;
  const emi = r === 0 ? principal / tenureMonths : (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  // Indicative term life insurance cost to cover this mortgage:
  const mortgageShieldAnnualPremium = Math.round((principal / 100000) * 115 * 1.25);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Amortisation & Debt Immunization</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Loan EMI & Insurance Shield Calculator
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Calculate your monthly mortgage installments and see the exact low-cost term protection 
          needed to immunize your family home from foreclosure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Controls */}
        <div className="md:col-span-6 bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Loan Parameters
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Loan Principal Amount:</span>
                <span className="font-bold text-[#24212B] dark:text-white">{formatINR(principal, { compact: true })}</span>
              </div>
              <input
                type="range"
                min="500000"
                max="30000000"
                step="500000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Annual Interest Rate:</span>
                <span className="font-bold text-[#24212B] dark:text-white">{interestRate.toFixed(1)}% p.a.</span>
              </div>
              <input
                type="range"
                min="6.5"
                max="16.0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Tenure:</span>
                <span className="font-bold text-[#24212B] dark:text-white">{tenureYears} Years ({tenureMonths} Months)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-6 space-y-4">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C] dark:text-[#A59FB5]">
              Monthly Installment
            </span>
            <div className="text-3xl font-black text-[#24212B] dark:text-white">
              {formatINR(emi)}/month
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D9D3E8] dark:border-[#1E2D4A] text-xs">
              <div>
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">Total Interest:</span>
                <div className="font-bold text-[#24212B] dark:text-white">{formatINR(totalInterest, { compact: true })}</div>
              </div>
              <div>
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">Total Payment:</span>
                <div className="font-bold text-[#24212B] dark:text-white">{formatINR(totalPayment, { compact: true })}</div>
              </div>
            </div>
          </div>

          {/* Mortgage Protection Shield Card */}
          <div className="p-6 rounded-2xl bg-[#E9E4FF]/50 dark:bg-[#1B2B4D]/50 border border-[#7957FF]/20 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7957FF]" />
              <h3 className="text-sm font-bold text-[#24212B] dark:text-white">
                Family Debt Immunization Shield
              </h3>
            </div>
            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
              If an untimely demise occurs, banks demand immediate loan settlement. Covering this{" "}
              <strong>{formatINR(principal, { compact: true })}</strong> mortgage requires an indicative 
              term insurance cost of only <strong>~{formatINR(mortgageShieldAnnualPremium)}/year</strong> (~{formatINR(mortgageShieldAnnualPremium / 12)}/month).
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
