import React from "react";
import Link from "next/link";
import { 
  Calculator, 
  Layers, 
  Activity, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw, 
  AlertOctagon, 
  Calendar, 
  Radar, 
  ShieldAlert, 
  CheckSquare,
  ArrowRight
} from "lucide-react";

export const metadata = {
  title: "Smart Insurance Tools | LifeSure AI",
  description: "Explore all 12 intelligent actuarial calculators, simulators, and policy analysis tools."
};

export default function SmartToolsHubPage() {
  const allTools = [
    {
      code: "TOOL-01",
      name: "AI Life-Cover Calculator",
      desc: "Comprehensive Capital Needs Assessment and Human Life Value (HLV) analysis with dual-method explainability.",
      href: "/tools/life-cover-calculator",
      icon: Calculator,
      tag: "Flagship"
    },
    {
      code: "TOOL-02",
      name: "Scenario Studio",
      desc: "Simulate major life transitions (new child, early retirement, loan clearance) with dynamic before-and-after diffs.",
      href: "/tools/scenario-studio",
      icon: Layers,
      tag: "Differentiator"
    },
    {
      code: "TOOL-03",
      name: "Family Survival Simulator",
      desc: "Time-based actuarial cashflow projection showing how many years your family corpus survives with and without insurance.",
      href: "/tools/family-survival-simulator",
      icon: Activity,
      tag: "Visual Runway"
    },
    {
      code: "TOOL-04",
      name: "Policy X-Ray",
      desc: "Extract schedule details, sum assured, suicide exclusion waiting periods, and critical gaps with page citations.",
      href: "/tools/policy-xray",
      icon: FileText,
      tag: "AI Document"
    },
    {
      code: "TOOL-05",
      name: "Premium & Affordability",
      desc: "Assess how term premiums fit into monthly household budgets and plan step-up protection as earnings grow.",
      href: "/tools/affordability-calculator",
      icon: ShieldCheck,
      tag: "Budget"
    },
    {
      code: "TOOL-06",
      name: "EMI & Debt Shield Calculator",
      desc: "Calculate loan installments and verify that your family mortgage is 100% immunized against premature demise.",
      href: "/tools/emi-calculator",
      icon: TrendingUp,
      tag: "Amortization"
    },
    {
      code: "TOOL-07",
      name: "Policy Replacement Checker",
      desc: "Objective evaluation between existing endowment plans and low-cost pure term alternatives before surrendering.",
      href: "/tools/policy-replacement",
      icon: RefreshCw,
      tag: "Objective"
    },
    {
      code: "TOOL-08",
      name: "Premium Shock Simulator",
      desc: "Model how unexpected inflation, health rate hikes, or medical crises impact recurring household solvency.",
      href: "/tools/premium-shock",
      icon: AlertOctagon,
      tag: "Stress-Test"
    },
    {
      code: "TOOL-09",
      name: "Future Cost Reality Check",
      desc: "Project Indian higher education and healthcare inflation over 10-25 years with realistic compound rates.",
      href: "/tools/future-costs",
      icon: Calendar,
      tag: "Inflation"
    },
    {
      code: "TOOL-10",
      name: "Protection Gap Radar",
      desc: "Multidimensional radar chart visualizing your coverage strength across income, debts, goals, and emergency funds.",
      href: "/tools/protection-gap",
      icon: Radar,
      tag: "Visual Health"
    },
    {
      code: "TOOL-11",
      name: "Insurance Scam Shield",
      desc: "Verify fraudulent calls, unauthorized bonus promises, and fake IRDAI official impersonation attempts.",
      href: "/tools/scam-shield",
      icon: ShieldAlert,
      tag: "Consumer Defense"
    },
    {
      code: "TOOL-12",
      name: "Application Readiness Checker",
      desc: "Pre-underwriting checklist for medical tests, income documentation, and disclosure accuracy before applying.",
      href: "/tools/application-readiness",
      icon: CheckSquare,
      tag: "Underwriting"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
          COMPLETE TOOL REGISTRY
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          All 12 Smart Insurance Tools
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
          Engineered with deterministic mathematics, verified IRDAI industry data, and transparent formulas. 
          Select any tool below to begin your evaluation.
        </p>
      </div>

      {/* Grid of All 12 Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.code}
              href={t.href}
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] hover:border-[#7957FF] dark:hover:border-[#7957FF] transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] flex items-center justify-center text-[#7957FF] group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF]">
                    {t.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#24212B] dark:text-white group-hover:text-[#7957FF]">
                  {t.name}
                </h3>
                <p className="text-xs leading-relaxed text-[#6F6A7C] dark:text-[#A59FB5]">
                  {t.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs font-semibold text-[#7957FF]">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
