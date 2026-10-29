import React from "react";
import Link from "next/link";
import { BookOpen, Building2, FileText, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Resources Hub | LifeSure AI",
  description: "Insurance Learning Centre, Searchable Glossary, Insurer Directory, and Nominee Claim Companion."
};

export default function ResourcesHubPage() {
  const hubs = [
    {
      title: "Insurance Learning Centre",
      desc: "Editorial articles covering why 10X income rules fail, Section 45 protections, and rider evaluation.",
      href: "/resources/learning-centre",
      icon: BookOpen
    },
    {
      title: "Insurance Glossary",
      desc: "Instant plain-English definitions and real examples for terms like CSR, Solvency Ratio, and HLV.",
      href: "/resources/glossary",
      icon: BookOpen
    },
    {
      title: "Insurer Directory (IRDAI)",
      desc: "Verified solvency ratios and 3-year claim settlement track records of leading Indian insurance companies.",
      href: "/resources/insurance-companies",
      icon: Building2
    },
    {
      title: "Claim Companion Guide",
      desc: "A master checklist for nominees on documents needed, hospital certificates, and the statutory 30-day mandate.",
      href: "/resources/claims",
      icon: FileText
    },
    {
      title: "Customer Reviews",
      desc: "Authentic beta tester reviews and evaluations with full transparency disclosures.",
      href: "/resources/reviews",
      icon: ShieldCheck
    },
    {
      title: "Financial Protection Guides",
      desc: "Step-by-step handbooks for first-time buyers, mortgage immunization, and nominee readiness.",
      href: "/resources/guides",
      icon: BookOpen
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
          KNOWLEDGE BASE & ADVISORY ASSETS
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#24212B] dark:text-white">
          Insurance Resources
        </h1>
        <p className="text-base text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
          Arm yourself with factual data from regulatory filings, clear statutory explanations, 
          and actionable claim preparation checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((h) => {
          const Icon = h.icon;
          return (
            <Link
              key={h.title}
              href={h.href}
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] hover:border-[#7957FF] dark:hover:border-[#7957FF] transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] flex items-center justify-center text-[#7957FF] group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#24212B] dark:text-white group-hover:text-[#7957FF]">
                  {h.title}
                </h2>
                <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                  {h.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs font-semibold text-[#7957FF]">
                <span>Explore Resource</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
