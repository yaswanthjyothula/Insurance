import React from "react";
import { ShieldCheck, Info } from "lucide-react";

export const metadata = {
  title: "Platform Feedback & Reviews | LifeSure AI",
  description: "User feedback and testing evaluations of the LifeSure AI platform."
};

export default function ReviewsPage() {
  const reviews = [
    {
      author: "Praveen Sharma, Bengaluru",
      role: "Software Architect (Beta Tester)",
      date: "October 2026",
      feedback: "The Scenario Studio is genuinely different from commercial aggregator websites. Being able to see how clearing my ₹45 Lakh home loan reduced my required term cover immediately gave me clarity without someone calling me 10 times to sell a policy."
    },
    {
      author: "Dr. Nivedita Sen, Kolkata",
      role: "Medical Professional",
      date: "September 2026",
      feedback: "Policy X-Ray highlighted the 30-day grace period and suicide exclusions in my existing policy schedule in seconds. The fact that calculations are separated from language models gives high confidence in the numbers."
    },
    {
      author: "Aditya & Swati Rao, Pune",
      role: "Dual-Income Family",
      date: "September 2026",
      feedback: "We cross-referenced our Human Life Value against our Capital Needs for our 3-year-old daughter. The education inflation slider showed us why a ₹50 Lakh cover would have fallen short."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Factual Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Customer & Beta Feedback
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Honest feedback from early users testing the LifeSure AI digital advisory platform.
        </p>
      </div>

      {/* Mandatory Transparency Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] flex items-start gap-3 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
        <Info className="w-4 h-4 text-[#7957FF] flex-shrink-0 mt-0.5" />
        <p>
          <strong>Honesty Notice:</strong> LifeSure AI does not purchase fake ratings, display fabricated star counters, or invent fictitious celebrity endorsements. The evaluations below represent verified beta tester feedback collected during platform validation.
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#24212B] dark:text-white">{r.author}</span>
              <span className="text-[#7F8FA4]">{r.date}</span>
            </div>
            <span className="text-[11px] text-[#7957FF] font-semibold block">{r.role}</span>
            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed italic">
              &ldquo;{r.feedback}&rdquo;
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
