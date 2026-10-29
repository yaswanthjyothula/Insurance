"use client";

import React, { useState } from "react";
import { CheckSquare, CheckCircle2, ShieldCheck, FileCheck } from "lucide-react";

export default function ApplicationReadinessCheckerPage() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const checklist = [
    {
      id: "itr_docs",
      category: "Income Proof",
      title: "Latest 2-3 Years Income Tax Returns (ITR-V) with Computation of Income",
      desc: "Mandatory for term life sum assured exceeding ₹1 Crore to substantiate your insurable interest."
    },
    {
      id: "salary_slips",
      category: "Income Proof",
      title: "Last 3 Months Salary Slips & 6 Months Bank Statement",
      desc: "Verifies current salary credits, employer legitimacy, and disposable income."
    },
    {
      id: "pan_aadhaar",
      category: "KYC Compliance",
      title: "Valid PAN Card and Aadhaar Card with active mobile link for e-KYC",
      desc: "Statutory requirement under IRDAI Master KYC Direction for policy issuance."
    },
    {
      id: "medical_disclosure",
      category: "Medical Honesty",
      title: "Complete disclosure of pre-existing health history, surgeries, and family medical pedigree",
      desc: "Full disclosure protects your claim from repudiation under Section 45 after the 3-year contestability period."
    },
    {
      id: "fasting_prep",
      category: "Medical Underwriting",
      title: "Fasting preparation for Full Medical Examination (MER), Blood Sugar (HbA1c) and Lipid Profile",
      desc: "Insurers provide home-visit phlebotomists free of charge for pure term life underwriting."
    }
  ];

  const toggle = (id: string) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter(i => i !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  const readinessPercent = Math.round((checkedItems.length / checklist.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Pre-Underwriting Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Application Readiness Checker
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Ensure you have all mandatory financial, KYC, and medical disclosures prepared 
          before submitting an insurance proposal form.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
          <span className="text-xs font-bold uppercase text-[#24212B] dark:text-white">
            Pre-Application Checklist ({checkedItems.length}/{checklist.length} Completed)
          </span>
          <span className="text-xs font-bold text-[#7957FF]">
            {readinessPercent}% Ready
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-[#7957FF] transition-all duration-300" style={{ width: `${readinessPercent}%` }} />
        </div>

        <div className="space-y-3 pt-2">
          {checklist.map((item) => {
            const isChecked = checkedItems.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-[#D9D3E8] dark:border-[#1E2D4A] hover:bg-[#FAF9F6] dark:hover:bg-[#142447]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 mt-0.5 accent-emerald-500 rounded"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7957FF] block mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-[#24212B] dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
