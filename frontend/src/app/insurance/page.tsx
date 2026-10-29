import React from "react";
import Link from "next/link";
import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Insurance Disciplines Directory | LifeSure AI",
  description: "Explore all 7 insurance categories in India: Term, Traditional Life, Health, General, Investment-Linked, Business, and Cyber."
};

export default function InsuranceHubPage() {
  const categories = [
    {
      title: "Term Insurance",
      tag: "Pure Income Replacement",
      desc: "Pure protection life cover with maximum sum assured at minimal annual premium. Built to clear debts and replace lifetime earnings.",
      href: "/insurance/term",
      metric: "99.3% Average CSR",
      features: ["Accelerated Terminal Illness", "Waiver of Premium on Disability", "Discounted Non-Smoker Rates"]
    },
    {
      title: "Life Insurance (Traditional)",
      tag: "Guaranteed Savings & Bonuses",
      desc: "Endowment, money-back, and whole-life policies providing disciplined capital preservation with sovereign backing.",
      href: "/insurance/life",
      metric: "Lifelong Cover up to 100 yrs",
      features: ["Guaranteed Annual Payouts", "Simple Reversionary Bonuses", "Section 37 Sovereign Guarantee"]
    },
    {
      title: "Health Insurance",
      tag: "Hospitalization & Critical Care",
      desc: "Cashless in-patient medical treatments, day-care surgeries, unlimited restoration benefits, and zero room-rent sublimits.",
      href: "/insurance/health",
      metric: "10,000+ Network Hospitals",
      features: ["Zero Consumables Deduction", "Cumulative Bonus Boosters", "34+ Critical Illness Riders"]
    },
    {
      title: "General & Property Insurance",
      tag: "Asset & Structural Shield",
      desc: "Bharat Griha Raksha standardized homeowner protection shielding building structures, home contents, vehicles, and travel.",
      href: "/insurance/general",
      metric: "All-Perils Natural Disaster",
      features: ["Earthquake & Flood Damage", "Alternative Accommodation Rent", "Third-Party Motor Liability"]
    },
    {
      title: "Investment-Linked (ULIP)",
      tag: "Market Equity & Debt Creation",
      desc: "Integrated life insurance and professionally managed mutual fund portfolios with automated asset allocation and tax exemptions.",
      href: "/insurance/investment-linked",
      metric: "Section 10(10D) Tax-Free",
      features: ["Automated Asset Rebalancing", "Zero Allocation Charges", "Loyalty Fund Additions"]
    },
    {
      title: "Business Insurance",
      tag: "Keyman & Corporate Liability",
      desc: "Shield enterprise continuity, shareholder buyout agreements, and bank loan covenants against the loss of key executives.",
      href: "/insurance/business",
      metric: "Section 37(1) Deductible",
      features: ["Keyman Executive Cover", "Group Term Employee Protection", "Directors & Officers (D&O) Liability"]
    },
    {
      title: "Other Insurance",
      tag: "Cyber & Personal Sachet",
      desc: "Low-cost specialized protection against digital UPI fraud, online identity theft, cyber extortion, and accidental injuries.",
      href: "/insurance/other",
      metric: "Instant Online Sachet",
      features: ["UPI Phishing Reimbursement", "Legal Defence Fee Coverage", "Specialist Cyber Forensics Support"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
          PRODUCT DISCOVERY MATRIX
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#24212B] dark:text-white">
          7 Insurance Categories
        </h1>
        <p className="text-base text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
          Different risks require dedicated financial instruments. Understand the purpose, trade-offs, 
          and verified regulatory product choices across the Indian insurance market.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] hover:border-[#7957FF] dark:hover:border-[#7957FF] transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#7957FF] uppercase">
                {c.tag}
              </span>
              <h2 className="text-xl font-bold text-[#24212B] dark:text-white group-hover:text-[#7957FF]">
                {c.title}
              </h2>
              <p className="text-xs leading-relaxed text-[#6F6A7C] dark:text-[#A59FB5]">
                {c.desc}
              </p>

              <div className="pt-2 space-y-1.5 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60">
                {c.features.map((f, i) => (
                  <div key={i} className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] flex items-center gap-1.5">
                    <span className="text-[#0E9F7E] font-bold">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-[#24212B] dark:text-white">{c.metric}</span>
              <span className="text-[#7957FF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Detailed Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
