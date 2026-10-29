"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Layers, 
  Calculator, 
  Shield,
  Activity, 
  HelpCircle,
  IndianRupee,
  ListChecks,
  Headset,
  ArrowRight
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function HomePage() {
  const [heroAge, setHeroAge] = useState(32);
  const [heroIncome, setHeroIncome] = useState(1500000);
  const [heroDependents, setHeroDependents] = useState(2);
  const [heroLiabilities, setHeroLiabilities] = useState(4000000);

  const [activeScenario, setActiveScenario] = useState<"another_child" | "retire_55" | "loan_cleared">("another_child");

  const heroExpenses = heroIncome * 0.55;
  const heroIncomePV = heroExpenses * Math.max(5, 60 - heroAge) * 0.72;
  const heroImmediate = Math.max(300000, heroExpenses * 0.5);
  const heroGoals = heroDependents * 2500000;
  const heroGrossNeed = heroIncomePV + heroLiabilities + heroGoals + heroImmediate;
  const heroEligibleAssets = heroIncome * 1.5;
  const heroExistingCover = 2500000;
  const heroNetGap = Math.max(0, heroGrossNeed - heroEligibleAssets - heroExistingCover);

  const scenarioDiffs = {
    another_child: {
      title: "Welcoming Another Child",
      desc: "Adds a dedicated ₹25 Lakh higher education milestone and increases recurring living costs by 15%.",
      deltaCover: 3750000,
      deltaPremium: 3800,
      tag: "+1 Dependent"
    },
    retire_55: {
      title: "Retire Early at Age 55",
      desc: "Shortens earning window by 5 years, compressing debt liquidation and accelerating target retirement corpus.",
      deltaCover: -1800000,
      deltaPremium: -1850,
      tag: "5 Years Shorter Horizon"
    },
    loan_cleared: {
      title: "Home Loan Cleared Early",
      desc: "Retiring your mortgage reduces your gross debt burden rupee-for-rupee with zero collateral liability.",
      deltaCover: -heroLiabilities,
      deltaPremium: -4200,
      tag: "Liabilities -> ₹0"
    }
  };

  const categories = [
    {
      title: "Term Insurance",
      tag: "Pure Protection",
      desc: "High sum-assured life cover to protect dependents from financial hardship and clear debts.",
      href: "/insurance/term",
      metric: "99.3% Avg CSR"
    },
    {
      title: "Life Insurance",
      tag: "Savings & Guarantee",
      desc: "Traditional endowment and whole life plans offering sovereign guarantee and regular bonus returns.",
      href: "/insurance/life",
      metric: "Lifelong Cover"
    },
    {
      title: "Health Insurance",
      tag: "Comprehensive Medical",
      desc: "Cashless in-patient care, critical illness riders, and restoration benefits with zero room rent limits.",
      href: "/insurance/health",
      metric: "10,000+ Hospitals"
    },
    {
      title: "General Insurance",
      tag: "Property & Asset Shield",
      desc: "Bharat Griha Raksha standardized cover for home structures, contents, vehicle and travel risks.",
      href: "/insurance/general",
      metric: "All-Perils Fire & Flood"
    },
    {
      title: "Investment-Linked",
      tag: "Market Wealth (ULIP)",
      desc: "Combines life protection with market-linked debt and equity funds under Section 10(10D) tax benefits.",
      href: "/insurance/investment-linked",
      metric: "Tax-Exempt Maturity"
    },
    {
      title: "Business Insurance",
      tag: "Keyman & Corporate",
      desc: "Protects enterprise continuity, shareholder agreements, and lender covenants if a founder is lost.",
      href: "/insurance/business",
      metric: "Sec 37(1) Deductible"
    },
    {
      title: "Other Insurance",
      tag: "Cyber & Accident Sachet",
      desc: "Guards against UPI phishing scams, digital identity theft, and accidental disablement expenses.",
      href: "/insurance/other",
      metric: "Instant Issuance"
    }
  ];

  const tools = [
    {
      name: "Stage 1: Needs Assessment",
      desc: "Calculate your estimated life insurance coverage requirement with transparent mathematical breakdowns.",
      icon: Calculator,
      href: "/assessment"
    },
    {
      name: "Stage 2: Coverage Results",
      desc: "Understand your coverage gap through transparent Net Needs and Human Life Value (HLV) analysis.",
      icon: Shield,
      href: "/results"
    },
    {
      name: "Stage 3: Product Selection",
      desc: "Real term plans are filtered by eligibility and scored on five published factors, with sources, sliders and comparisons.",
      icon: Layers,
      href: "/products"
    },
    {
      name: "Stage 4: Digital Advisory",
      desc: "Book a consultation with certified fiduciary advisors and simulate an interactive review session.",
      icon: Activity,
      href: "/advisory"
    },
    {
      name: "Scenario Studio",
      desc: "Test what happens if you have another child, retire early, or take a home loan with dynamic diffs.",
      icon: Layers,
      href: "/tools/scenario-studio"
    },
    {
      name: "Family Survival Simulator",
      desc: "Time-based cashflow projection demonstrating how many years your family corpus survives.",
      icon: Activity,
      href: "/tools/family-survival-simulator"
    }
  ];

  const faqs = [
    {
      q: "How is my coverage gap calculated?",
      a: "LifeSure AI employs the Net Needs Method. We project your family's future living expenses across your declared support horizon (using 7% inflation and 8% discounting), add outstanding liabilities and future milestones (e.g. child education), and deduct eligible liquid assets and existing life cover."
    },
    {
      q: "How does Scenario Studio work?",
      a: "Scenario Studio lets you run one-tap financial 'what-ifs' (such as having another child or clearing a loan). It modifies only the relevant scenario inputs, recalculates your financial requirement, and displays a dynamic diff showing exactly how your recommended cover and estimated premium shift."
    },
    {
      q: "Is LifeSure AI an insurance broker?",
      a: "No. LifeSure AI is an independent financial technology and digital advisory platform. We do not underwrite policies or earn hidden commissions from insurer partnerships. All data is sourced from public IRDAI disclosures."
    }
  ];

  const eyebrow = "text-[13px] font-semibold tracking-[0.24em] uppercase text-[#7957FF]";
  const h2 = "m-0 font-extrabold tracking-[-0.04em] leading-[1.02] text-[clamp(30px,3.4vw,50px)]";
  const label = "text-[13px] font-bold tracking-[0.12em] uppercase";

  const howSteps = [
    { n: "01", href: "/assessment", t: "Assess Needs", d: "Provide baseline living expenses, dependents, debts, and existing insurance without invasive personal questions." },
    { n: "02", href: "/results", t: "Deterministic Engine", d: "Calculates Net Capital Needs and Human Life Value (HLV) with disclosed inflation and discount rate assumptions." },
    { n: "03", href: "/products", t: "Plan Matching", d: "Real term plans are filtered by eligibility, then scored on claims record, financial strength, fit, affordability and features, with every source shown." },
    { n: "04", href: "/advisory", t: "Digital Advisory", d: "Book a consultation session with a certified fiduciary CFP® advisor and simulate your review room." },
  ];

  const heroFeatures = [
    { k: IndianRupee, t: "Accurate Coverage Calculation" },
    { k: ListChecks, t: "Personalised Product Recommendations" },
    { k: Headset, t: "Expert Advisory Support" },
  ];

  const premium = (heroNetGap / 100000) * 115 * (1 + (heroAge - 25) * 0.045);

  return (
    <div className="overflow-x-hidden text-[#24212B]">

      {/* 1. HERO */}
      <section data-no-reveal className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse 55% 65% at 78% 45%,#E9E4FF 0%,rgba(233,228,255,0) 70%)" }}>
        <div className="max-w-[1360px] mx-auto relative lg:min-h-[560px] flex items-center">
          <div className="w-full lg:w-[42%] px-6 sm:px-10 py-12 flex flex-col gap-6 relative z-[3] min-w-0">
            <span className={eyebrow}>Intelligent Life Insurance Planning</span>
            <h1 className="m-0 font-extrabold text-[clamp(36px,3.9vw,58px)] leading-[1] tracking-[-0.04em]" style={{ color: "#24212B" }}>
              <span className="block">Protect your</span>
              <span className="block">loved ones.</span>
              <span className="block ls-extrude">Plan with clarity.</span>
            </h1>
            <p className="m-0 max-w-[440px] text-base leading-[1.55] text-[#5A5566]">
              Calculate your estimated life insurance coverage requirement, understand your coverage gap,
              receive recommendations from real, sourced term plans, and book a certified advisory consultation.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/assessment" className="h-[52px] px-6 bg-[#7957FF] text-white rounded-md flex items-center gap-3 font-semibold text-[15px]">
                Start Needs Assessment <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
              <Link href="/dashboard" className="h-[52px] px-5 bg-white text-[#7957FF] border border-[#D9D3E8] rounded-md flex items-center gap-3 font-semibold text-[15px] shadow-[0_4px_0_#D9D3E8,0_16px_30px_-14px_rgba(36,33,43,0.25)] hover:-translate-y-0.5 active:translate-y-[3px] transition-transform">
                <span className="w-6 h-6 border-2 border-[#7957FF] rounded-full grid place-items-center">
                  <span className="w-0 h-0 border-l-[7px] border-l-[#7957FF] border-y-[4px] border-y-transparent ml-0.5" />
                </span>
                Go to Dashboard
              </Link>
            </div>
          </div>
          <HeroScene features={heroFeatures} />
        </div>
        <HeroScene features={heroFeatures} mobile />
      </section>

      {/* 2. TRUST STRIP */}
      <section className="max-w-[1280px] mx-auto px-6 sm:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            ["Deterministic", "Net Needs + HLV Engine"],
            ["Explainable", "Five published scoring factors"],
            ["0% Sales Hype", "Sourced from insurer filings"],
          ].map(([a, b], i) => (
            <div key={a} className="bg-white border border-[#D9D3E8] rounded-2xl px-7 py-6 flex flex-col gap-1">
              <span className={`text-2xl font-extrabold tracking-[-0.03em] ${i === 2 ? "text-[#7957FF]" : ""}`}>{a}</span>
              <span className="text-sm text-[#5A5566]">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="px-6 sm:px-10 pt-16 pb-28">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-4 text-center items-center">
            <span className={eyebrow}>Transparent Process</span>
            <h2 className={h2}>How LifeSure AI Works</h2>
            <p className="m-0 max-w-[560px] text-lg leading-[1.55] text-[#5A5566]">From initial financial inventory to verified policy understanding, without dark patterns.</p>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ls-persp">
            {howSteps.map((x) => (
              <Link key={x.n} href={x.href} className="ls-lip ls-tilt-card bg-white border border-[#D9D3E8] rounded-[20px] px-[30px] pt-9 pb-[34px] flex flex-col gap-4">
                <span className="ls-extrude-num font-black text-[56px] leading-none tracking-[-0.05em]">{x.n}</span>
                <h3 className="mt-2 text-[23px] font-bold tracking-[-0.02em]">{x.t}</h3>
                <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566]">{x.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE NEEDS PREVIEW */}
      <section className="px-6 sm:px-10 pb-28">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-16 items-center">
          <div className="flex-[1_1_420px] flex flex-col gap-6 min-w-0">
            <span className={eyebrow}>Interactive Needs Preview</span>
            <h2 className={h2}>Drag. Watch your gap move.</h2>
            <p className="m-0 max-w-[520px] text-lg leading-[1.6] text-[#5A5566]">
              A verified-formula estimate of your estimated protection gap. Run the full assessment for custom
              assumptions, liabilities and goals.
            </p>
            <Link href="/assessment" className="self-start h-14 px-7 bg-[#7957FF] text-white rounded-md flex items-center gap-3 font-semibold text-base">
              Run Detailed Assessment With Custom Assumptions <ArrowRight className="w-[18px] h-[18px]" />
            </Link>
          </div>
          <div className="flex-[1_1_460px] min-w-0 ls-persp">
            <div data-scroll-tilt="10" className="ls-lip bg-white border border-[#D9D3E8] rounded-3xl p-9 flex flex-col gap-7 [rotate:x_4deg]">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="text-xl font-bold tracking-[-0.01em]">Estimated Protection Gap</span>
                <span className="text-sm font-bold text-white bg-[#7957FF] px-3 py-1.5 rounded-md shadow-[0_3px_0_#5B3BE6]">Verified Formula</span>
              </div>
              <div className="flex flex-col gap-3">
                <label className={label} htmlFor="hero-age">Your age: <span className="text-[#7957FF]">{heroAge} yrs</span> <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">· Target retirement 60</span></label>
                <input id="hero-age" type="range" min="21" max="55" value={heroAge} onChange={(e) => setHeroAge(Number(e.target.value))} className="w-full cursor-pointer" />
              </div>
              <div className="flex flex-col gap-3">
                <label className={label} htmlFor="hero-income">Annual income: <span className="text-[#7957FF]">{formatINR(heroIncome, { compact: true })}</span> <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">· {heroDependents} dependents</span></label>
                <input id="hero-income" type="range" min="500000" max="5000000" step="100000" value={heroIncome} onChange={(e) => setHeroIncome(Number(e.target.value))} className="w-full cursor-pointer" />
              </div>
              <div className="rounded-[18px] p-7 text-white flex flex-col gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_8px_0_#5B3BE6,0_30px_50px_-24px_rgba(121,87,255,0.6)]" style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#E9E4FF]">Recommended Coverage Gap</span>
                <span className="ls-extrude-on-violet font-black text-[clamp(44px,5vw,64px)] tracking-[-0.045em] leading-none tabular-nums text-white">{formatINR(heroNetGap, { compact: true })}</span>
                <span className="text-sm text-[#F1EEFF] tabular-nums">Gross Need {formatINR(heroGrossNeed, { compact: true })} − Assets &amp; Cover {formatINR(heroEligibleAssets + heroExistingCover, { compact: true })}</span>
              </div>
              <div className="flex justify-between text-[15px] pt-1">
                <span className="text-[#5A5566]">Indicative Term Premium:</span>
                <span className="font-bold tabular-nums">~{formatINR(premium, { compact: true })}/year</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SMART TOOLS */}
      <section className="px-6 sm:px-10 pb-28">
        <div className="max-w-[1280px] mx-auto bg-[#E9E4FF] rounded-[32px] px-6 sm:px-16 py-16 sm:py-20 flex flex-col gap-12 ls-lip-lilac">
          <div className="flex flex-wrap gap-5 justify-between items-end">
            <div className="flex flex-col gap-4 max-w-[760px]">
              <span className={eyebrow}>Engineering Rigor</span>
              <h2 className={h2}>Intelligent Financial Planning Tools</h2>
            </div>
            <p className="m-0 max-w-[400px] text-[17px] leading-[1.55] text-[#5A5566]">Built with tested actuarial mathematics, present-value calculations, and zero hidden assumptions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px] ls-persp">
            {tools.map((t, i) => {
              const Icon = t.icon;
              return (
                <Link key={t.name} href={t.href} className="ls-lift bg-white rounded-[18px] px-[30px] py-8 flex flex-col gap-3.5 shadow-[inset_0_1px_0_#fff,0_5px_0_#D9D3E8,0_24px_40px_-22px_rgba(36,33,43,0.3)]">
                  <div className="flex justify-between items-center">
                    <span className="w-[52px] h-[52px] rounded-[14px] grid place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_12px_20px_-8px_rgba(121,87,255,0.7)]" style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}><Icon className="w-5 h-5" /></span>
                    <span className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7957FF]">{i < 4 ? `Stage ${i + 1}` : "Tool"}</span>
                  </div>
                  <h3 className="mt-3.5 text-[22px] font-bold tracking-[-0.02em]">{t.name}</h3>
                  <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566]">{t.desc}</p>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 justify-between items-center pt-7 border-t border-[#D9D3E8]">
            <span className="text-base font-semibold">Looking for specialized calculators like Policy Replacement or Scam Shield?</span>
            <Link href="/tools" className="font-bold text-base text-[#7957FF]">View All 12 Smart Tools →</Link>
          </div>
        </div>
      </section>

      {/* 6. SCENARIO STUDIO */}
      <section className="px-6 sm:px-10 pb-32">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-16 items-center">
          <div className="flex-[1_1_460px] flex flex-col gap-7 min-w-0">
            <span className="self-start text-[12.5px] font-bold tracking-[0.2em] uppercase text-[#7957FF] bg-[#E9E4FF] px-3.5 py-2.5 rounded-md shadow-[0_3px_0_#D9D3E8]">Primary Differentiator</span>
            <h2 className="m-0 font-extrabold text-[clamp(30px,3.4vw,50px)] leading-[1.02] tracking-[-0.04em]">Scenario Studio™:<span className="block text-[#7957FF]">Stress-Test Life&apos;s Pivots</span></h2>
            <p className="m-0 max-w-[540px] text-lg leading-[1.6] text-[#5A5566]">Life doesn&apos;t remain static. Test how major family transitions impact your insurance requirement before committing to multi-decade policies.</p>
            <div className="flex flex-col gap-3.5">
              <span className="text-[13px] font-bold tracking-[0.16em] uppercase">Select a one-tap scenario:</span>
              <div className="flex flex-wrap gap-3">
                {([["another_child", "Another Child"], ["retire_55", "Retire at 55"], ["loan_cleared", "Clear Home Loan Early"]] as const).map(([k, l]) => {
                  const on = activeScenario === k;
                  return (
                    <button key={k} onClick={() => setActiveScenario(k)} className={`h-[50px] px-[22px] rounded-lg font-semibold text-base cursor-pointer transition-all border ${on ? "bg-[#7957FF] text-white border-[#7957FF]" : "bg-white text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8,0_12px_20px_-12px_rgba(36,33,43,0.25)] hover:-translate-y-0.5"}`}>{l}</button>
                  );
                })}
              </div>
            </div>
            <Link href="/tools/scenario-studio" className="self-start font-bold text-base text-[#7957FF]">Launch Full Scenario Studio →</Link>
          </div>
          <div className="flex-[1_1_500px] min-w-0 ls-persp">
            <div className="bg-white border border-[#D9D3E8] rounded-3xl [rotate:y_-10deg_x_4deg] [transform-style:preserve-3d] transition-[rotate] duration-500 hover:[rotate:y_-3deg_x_1deg] shadow-[inset_0_1px_0_#fff,-10px_10px_0_#E9E4FF,-11px_11px_0_#D9D3E8,-40px_50px_80px_-30px_rgba(121,87,255,0.45)]">
              <div className="px-8 py-7 flex justify-between items-center gap-4 border-b border-[#D9D3E8] flex-wrap">
                <span className="font-bold text-[21px] tracking-[-0.01em]">{scenarioDiffs[activeScenario].title}</span>
                <span className="text-sm font-bold text-white bg-[#7957FF] px-3 py-[7px] rounded-md shadow-[0_3px_0_#5B3BE6]">{scenarioDiffs[activeScenario].tag}</span>
              </div>
              <p className="m-0 px-8 pt-6 pb-2 text-base leading-[1.6] text-[#5A5566] min-h-[100px]">{scenarioDiffs[activeScenario].desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-8 pt-4 pb-7">
                <div className="bg-[#FAF9F6] border border-[#D9D3E8] rounded-[14px] px-6 py-[22px] flex flex-col gap-2.5 shadow-[0_4px_0_#D9D3E8]">
                  <span className="text-sm font-semibold text-[#5A5566]">Estimated Cover Shift</span>
                  <span className="font-extrabold text-[34px] tracking-[-0.03em] tabular-nums">{scenarioDiffs[activeScenario].deltaCover > 0 ? "+" : ""}{formatINR(scenarioDiffs[activeScenario].deltaCover, { compact: true })}</span>
                </div>
                <div className="bg-[#E9E4FF] border border-[#D9D3E8] rounded-[14px] px-6 py-[22px] flex flex-col gap-2.5 shadow-[0_4px_0_#CFC5F5]">
                  <span className="text-sm font-semibold text-[#5A5566]">Annual Premium Shift</span>
                  <span className="font-extrabold text-[34px] tracking-[-0.03em] text-[#7957FF] tabular-nums">{scenarioDiffs[activeScenario].deltaPremium > 0 ? "+" : ""}{formatINR(scenarioDiffs[activeScenario].deltaPremium)}/yr</span>
                </div>
              </div>
              <div className="px-8 py-5 flex justify-between gap-3 flex-wrap border-t border-[#D9D3E8] text-[15px]">
                <span className="text-[#5A5566] font-medium">Baseline stays protected</span>
                <span className="font-bold">Deterministic Recalculation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSURANCE DISCIPLINES */}
      <section className="px-6 sm:px-10 pb-32">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-14">
          <div className="flex flex-wrap gap-5 items-end justify-between">
            <div className="flex flex-col gap-4">
              <span className={eyebrow}>Comprehensive Coverage</span>
              <h2 className={h2}>7 Core Insurance Disciplines</h2>
            </div>
            <p className="m-0 max-w-[460px] text-[17px] leading-[1.55] text-[#5A5566]">Each insurance category serves a distinct financial purpose. Explore purpose-built guides, exclusions, and verified market choices.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ls-persp">
            {categories.map((c) => (
              <Link key={c.title} href={c.href} className="ls-lift bg-white border border-[#D9D3E8] rounded-[20px] px-7 py-[30px] flex flex-col gap-3.5 shadow-[inset_0_1px_0_#fff,0_5px_0_#D9D3E8,0_26px_40px_-24px_rgba(36,33,43,0.28)]">
                <span className="self-start text-[11.5px] font-bold tracking-[0.16em] uppercase text-[#7957FF] bg-[#E9E4FF] px-2.5 py-1.5 rounded-[5px]">{c.tag}</span>
                <span className="mt-1.5 font-extrabold text-[27px] tracking-[-0.035em]">{c.title}</span>
                <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566] flex-1">{c.desc}</p>
                <div className="flex justify-between gap-3 pt-[18px] border-t border-[#D9D3E8] text-[15px] font-bold"><span>{c.metric}</span><span className="text-[#7957FF]">Explore →</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-32">
        <div className="text-center flex flex-col gap-4 items-center mb-12">
          <span className={eyebrow}>Frequently Asked Questions</span>
          <h2 className={h2}>Clear Answers. Zero Jargon.</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-7 rounded-[18px] bg-white border border-[#D9D3E8] space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#7957FF] flex-shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-[15px] leading-[1.65] text-[#5A5566] pl-[30px]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="px-6 sm:px-10 pb-32 ls-persp" data-no-reveal>
        <div data-scroll-tilt="8" className="max-w-[1280px] mx-auto rounded-[32px] px-6 sm:px-12 py-24 flex flex-col items-center text-center gap-7 text-white [transform-origin:top_center] shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_12px_0_#5B3BE6,0_60px_90px_-30px_rgba(121,87,255,0.6)]" style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}>
          <h2 className="m-0 font-extrabold text-[clamp(30px,3.8vw,56px)] leading-[1.05] tracking-[-0.04em] max-w-[760px]" style={{ color: "#FFFFFF" }}>Know exactly how much cover your family needs.</h2>
          <p className="m-0 max-w-[600px] text-[19px] leading-[1.55] text-[#F1EEFF]">Take 3 minutes to calculate your exact protection requirements with full mathematical explainability.</p>
          <Link href="/assessment" className="mt-3 h-[66px] px-9 bg-white text-[#7957FF] rounded-lg flex items-center gap-3.5 font-bold text-lg shadow-[0_6px_0_#D9D3E8,0_24px_40px_-14px_rgba(36,33,43,0.45)] hover:-translate-y-[3px] active:translate-y-[5px] active:shadow-[0_1px_0_#D9D3E8] transition-all">
            Start Needs Assessment Now <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ k: Icon, t }: { k: React.ComponentType<{ className?: string; strokeWidth?: number }>; t: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[rgba(255,255,255,0.86)] backdrop-blur-md border border-[#D9D3E8] px-4 py-3 shadow-[inset_0_1px_0_#fff,0_4px_0_#E9E4FF,0_5px_0_#D9D3E8,0_22px_36px_-18px_rgba(121,87,255,0.5)]">
      <span className="flex-none w-11 h-11 rounded-xl grid place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_3px_0_#5B3BE6]" style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}><Icon className="w-5 h-5" strokeWidth={1.9} /></span>
      <span className="text-[13.5px] leading-[1.3] font-semibold text-[#24212B]">{t}</span>
    </div>
  );
}

/** Hero scene: the banner image (features and copy are part of the artwork) tilts toward the cursor. */
function HeroScene({ features, mobile }: { features: { k: React.ComponentType<{ className?: string; strokeWidth?: number }>; t: string }[]; mobile?: boolean }) {
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (mobile) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      if (imgRef.current) {
        imgRef.current.style.transform = `perspective(1400px) rotateY(${(cur.x * 9).toFixed(2)}deg) rotateX(${(cur.y * -6).toFixed(2)}deg) translate3d(${(cur.x * -26).toFixed(1)}px, ${(cur.y * -14).toFixed(1)}px, 0)`;
      }
    };
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mobile]);

  const fade = {
    WebkitMaskImage: "linear-gradient(90deg,transparent 0%,#000 3%),linear-gradient(270deg,transparent 0%,#000 3%),linear-gradient(0deg,transparent 0%,#000 5%),linear-gradient(180deg,transparent 0%,#000 3%)",
    WebkitMaskComposite: "source-in",
    maskImage: "linear-gradient(90deg,transparent 0%,#000 3%),linear-gradient(270deg,transparent 0%,#000 3%),linear-gradient(0deg,transparent 0%,#000 5%),linear-gradient(180deg,transparent 0%,#000 3%)",
    maskComposite: "intersect",
  } as React.CSSProperties;

  const alt = "Family reviewing their LifeSure coverage, with accurate coverage calculation, personalised product recommendations and expert advisory support";

  if (mobile)
    return (
      <div className="lg:hidden px-4 pb-12 flex flex-col gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-banner-final.webp" alt={alt} width={1672} height={941} className="w-full h-auto" style={fade} />
        <div className="grid gap-3 sm:grid-cols-3 px-2">{features.map((f) => <FeatureCard key={f.t} {...f} />)}</div>
      </div>
    );

  return (
    <div className="hidden lg:block absolute right-0 top-1/2 w-[64%] [translate:0_-50%]" style={{ perspective: "1400px" }}>
      <div ref={imgRef} className="relative [transform-style:preserve-3d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-banner-final.webp" alt={alt} width={1672} height={941} decoding="async" className="block w-full h-auto select-none" style={fade} draggable={false} />
      </div>
    </div>
  );
}
