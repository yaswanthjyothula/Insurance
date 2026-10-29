import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, CheckSquare, FileSearch, Home, Layers, Radar, RefreshCw, ShieldAlert, TrendingUp, Users, Wallet } from "lucide-react";

export const metadata = {
  title: "Tools | LifeSure AI",
  description: "Twelve calculators and checkers for sizing cover, reading policies and staying safe.",
};

const GROUPS = [
  { title: "Size your cover", tools: [
    { name: "Life Cover Calculator", desc: "How much life cover your family needs, with real plans matched to it.", href: "/tools/life-cover-calculator", icon: Calculator },
    { name: "Protection Gap Radar", desc: "Which needs are covered and which are not.", href: "/tools/protection-gap", icon: Radar },
    { name: "Scenario Studio", desc: "How a new child, home or job change shifts your need.", href: "/tools/scenario-studio", icon: Layers },
    { name: "Family Survival Simulator", desc: "How many years your family's money would last.", href: "/tools/family-survival-simulator", icon: Users },
  ] },
  { title: "Plan the money", tools: [
    { name: "Premium Affordability", desc: "Whether a plan fits your monthly budget.", href: "/tools/affordability-calculator", icon: Wallet },
    { name: "Loan EMI and Cover", desc: "Your EMI, and the cover that clears the loan.", href: "/tools/emi-calculator", icon: Home },
    { name: "Future Goal Cost", desc: "What a goal costs later and what to save monthly.", href: "/tools/future-costs", icon: CalendarClock },
    { name: "Cost Inflation Projector", desc: "How living costs and health premiums may grow.", href: "/tools/premium-shock", icon: TrendingUp },
  ] },
  { title: "Check before you act", tools: [
    { name: "Policy X-Ray", desc: "Pull the key terms out of your policy text.", href: "/tools/policy-xray", icon: FileSearch },
    { name: "Policy Replacement Check", desc: "Keep an old policy or switch to term.", href: "/tools/policy-replacement", icon: RefreshCw },
    { name: "Application Readiness", desc: "Documents and answers to have ready.", href: "/tools/application-readiness", icon: CheckSquare },
    { name: "Scam Shield", desc: "Spot insurance fraud calls and messages.", href: "/tools/scam-shield", icon: ShieldAlert },
  ] },
];

export default function ToolsHubPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">Tools</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#24212B]">Twelve tools, grouped by what you need to do</h1>
        <p className="mt-3 text-base leading-7 text-[#4A4658]">Each tool says what it assumes and where it stops. Estimates are labelled as estimates.</p>
      </header>
      <div className="mt-10 space-y-10">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-4 text-lg font-extrabold text-[#24212B]">{g.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.tools.map((t) => (
                <Link key={t.href} href={t.href} className="ls-spot group flex flex-col rounded-2xl border border-[#D9D3E8] bg-white p-5 transition-colors hover:border-[#7957FF]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9E4FF] text-[#7957FF] transition-transform group-hover:scale-110"><t.icon className="w-5 h-5" /></span>
                  <h3 className="mt-4 text-[17px] font-bold text-[#24212B]">{t.name}</h3>
                  <p className="mt-1 flex-1 text-[15px] leading-6 text-[#4A4658]">{t.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#7957FF]">Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
