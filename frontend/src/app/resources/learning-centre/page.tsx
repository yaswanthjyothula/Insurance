import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Insurance Learning Centre | LifeSure AI",
  description: "Educational articles and practical guidance on insurance planning, term vs endowment, riders, and tax exemptions."
};

export default function LearningCentrePage() {
  const articles = [
    {
      title: "Why 10X Income Rule of Thumb Causes Severe Underinsurance in India",
      cat: "Actuarial Methodology",
      time: "6 min read",
      desc: "Traditional agents recommend an arbitrary 10x annual income multiple. Learn why Capital Needs Analysis accounts for true loan liabilities and education inflation."
    },
    {
      title: "Understanding Section 45: Why the 3-Year Incontestable Clause Protects Your Family",
      cat: "Legal Protections",
      time: "4 min read",
      desc: "A detailed breakdown of Section 45 of the Insurance Act 1938 and why full disclosure ensures claims cannot be rejected after 36 months."
    },
    {
      title: "The Mathematical Truth About 'Return of Premium' (TROP) Term Plans",
      cat: "Product Evaluation",
      time: "5 min read",
      desc: "Insurers charge 2x to 3x higher premiums to return nominal money decades later. Discover why investing the difference generates superior family wealth."
    },
    {
      title: "Critical Illness vs Accidental Disability: Which Riders Actually Deserve Budget?",
      cat: "Riders & Benefits",
      time: "7 min read",
      desc: "An objective evaluation of riders that provide genuine life-saving emergency liquidity versus low-probability decorative add-ons."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Fiduciary Financial Education</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Insurance Learning Centre
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Rigorous, jargon-free editorial guides to help you make informed insurance decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] hover:border-[#7957FF] transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#7957FF] uppercase">{art.cat}</span>
                <span className="text-[#7F8FA4]">{art.time}</span>
              </div>
              <h2 className="text-base font-bold text-[#24212B] dark:text-white">
                {art.title}
              </h2>
              <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                {art.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs font-semibold text-[#7957FF]">
              <span>Read Full Article</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
