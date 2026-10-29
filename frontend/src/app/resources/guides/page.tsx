import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Financial Protection Guides | LifeSure AI",
  description: "Step-by-step guides for choosing term insurance, claim readiness, and estate planning."
};

export default function ProtectionGuidesPage() {
  const guides = [
    {
      title: "First-Time Insurance Buyer's Blueprint (Age 21 - 35)",
      desc: "Step-by-step roadmap to calculate coverage, select riders, complete medical tests, and lock in the lowest rates before age 35.",
      steps: ["Income Multiple vs Capital Needs", "Choosing Between Regular vs Limited Pay", "Medical Disclosures to Prevent Repudiation"]
    },
    {
      title: "Family Debt & Mortgage Immunization Guide",
      desc: "How to structure term life insurance alongside home loans so your spouse and children never face bank foreclosure.",
      steps: ["Linking Term Cover to Amortisation Schedules", "Assignment vs Nominee Structuring", "Married Women's Property Act (MWPA)"]
    },
    {
      title: "Nominee Preparedness & Emergency Instructions Guide",
      desc: "How to organize insurance bonds, bank details, and municipal checklists so your family is prepared for an emergency.",
      steps: ["Setting Up an Emergency Insurance Vault", "Designating Primary and Successive Nominees", "Claim Companion Filing Workflow"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Actionable Roadmaps</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Financial Protection Guides
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Practical, step-by-step handbooks designed to help you execute insurance decisions with confidence.
        </p>
      </div>

      <div className="space-y-6">
        {guides.map((g, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-3"
          >
            <h2 className="text-lg font-bold text-[#24212B] dark:text-white">
              {g.title}
            </h2>
            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
              {g.desc}
            </p>

            <div className="pt-2 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 space-y-1.5 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
              {g.steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#7957FF] font-bold">✓</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
