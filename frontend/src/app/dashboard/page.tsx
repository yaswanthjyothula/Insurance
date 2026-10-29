"use client";

import Link from "next/link";
import { BadgeCheck, SlidersHorizontal, FileText, Vault, CalendarClock, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";

const shortcuts = [
  { ic: BadgeCheck, title: "My Protection Passport", desc: "Verified safety record, gap and readiness score", href: "/dashboard/protection-passport" },
  { ic: SlidersHorizontal, title: "Saved Scenarios", desc: "New child, early retirement, loan clearance what-ifs", href: "/tools/scenario-studio" },
  { ic: FileText, title: "Insurance Safety Net", desc: "Declared policies, renewals and nominees", href: "/dashboard/policies" },
  { ic: Vault, title: "Emergency Insurance Vault", desc: "Encrypted policy schedules and family letters", href: "/dashboard/insurance-vault" },
  { ic: CalendarClock, title: "Book Fiduciary Advisor", desc: "Fee-only CFP consultation", href: "/dashboard/appointments" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardHubPage() {
  const { user } = useAuth();
  const { result, input, selectedProduct, booking, isHydrated } = useAssessmentStore();
  const first = ((user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "there").split(" ")[0];

  const need = result?.net_needs.total_gross_need ?? 0;
  const gap = result?.net_needs.net_coverage_gap ?? 0;
  const covered = Math.min(100, need > 0 ? Math.round(((need - gap) / need) * 100) : 0);

  const stages = [
    { label: "Needs assessment", done: Boolean(result), href: "/assessment" },
    { label: "Coverage results", done: Boolean(result), href: "/results" },
    { label: "Product selection", done: Boolean(selectedProduct), href: "/products" },
    { label: "Advisor consultation", done: Boolean(booking), href: "/advisory" },
  ];
  const next = stages.find((s) => !s.done);

  const stat = "px-[clamp(18px,2.4vw,36px)] py-[clamp(18px,2.4vw,32px)] flex flex-col gap-3";
  const big = "font-black text-[clamp(26px,3.2vw,48px)] tracking-[-0.045em] leading-none tabular-nums";

  return (
    <div className="flex flex-col gap-10 w-full min-w-0">
      <header className="flex flex-wrap gap-5 items-end justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg text-[#5A5566]">{greeting()}, {first}</span>
          <h1 className="m-0 font-extrabold text-[clamp(34px,3.6vw,48px)] leading-none tracking-[-0.045em]" style={{ color: "#24212B" }}>Your protection</h1>
        </div>
        <Link href={next ? next.href : "/assessment"} className="h-14 px-7 bg-[#7957FF] text-white rounded-lg flex items-center gap-3.5 font-bold text-base">
          {next ? `Continue: ${next.label}` : "Re-run assessment"} <ArrowRight className="w-5 h-5" />
        </Link>
      </header>

      <section className="ls-persp" aria-label="Cover summary">
        <div data-scroll-tilt="5" className="ls-lip bg-white border border-[#D9D3E8] rounded-3xl overflow-hidden [transform-origin:bottom_center]">
          {!isHydrated ? (
            <div className="p-9 text-[#5A5566]">Loading your numbers…</div>
          ) : result ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3">
                <div className={`${stat} sm:border-r border-b border-[#D9D3E8]`}>
                  <span className="text-[15px] font-semibold text-[#5A5566]">Cover you need</span>
                  <span className={big}>{formatINR(need, { compact: true })}</span>
                  <span className="text-sm text-[#5A5566]">from your needs assessment</span>
                </div>
                <div className={`${stat} sm:border-r border-b border-[#D9D3E8]`}>
                  <span className="text-[15px] font-semibold text-[#5A5566]">Cover you have</span>
                  <span className={big}>{formatINR(input.existing_cover + input.eligible_assets, { compact: true })}</span>
                  <span className="text-sm text-[#5A5566]">policies and liquid assets</span>
                </div>
                <div className={`${stat} border-b border-[#D9D3E8] bg-[#E9E4FF]`}>
                  <span className="text-[15px] font-semibold text-[#5A5566]">Gap to close</span>
                  <span className={`${big} ls-extrude`}>{formatINR(gap, { compact: true })}</span>
                  <span className="text-sm text-[#5A5566]">recommended additional term cover</span>
                </div>
              </div>
              <div className="px-9 pt-7 pb-8 flex flex-col gap-3.5">
                <div className="flex justify-between gap-3 text-[15.5px]">
                  <span className="text-[#5A5566]"><strong className="text-[#24212B]">{covered}%</strong> of your need is covered</span>
                  <span className="font-semibold text-[#7957FF]">{100 - covered}% open</span>
                </div>
                <div className="h-[18px] rounded-[9px] bg-[#F1EEF8] shadow-[inset_0_2px_4px_rgba(36,33,43,0.1)] overflow-hidden" role="progressbar" aria-valuenow={covered} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-[9px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_3px_8px_rgba(121,87,255,0.4)]" style={{ width: `${covered}%`, background: "linear-gradient(180deg,#9A80FF,#7957FF 60%,#6A47F5)" }} />
                </div>
                {typeof result.protection_health_score === "number" && Number.isFinite(result.protection_health_score) && (
                  <span className="text-sm text-[#5A5566]">Protection score {Math.round(result.protection_health_score)}/100</span>
                )}
              </div>
            </>
          ) : (
            <div className="p-9 flex flex-wrap items-center justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold">No assessment yet</h2>
                <p className="text-[#5A5566] mt-1">Answer a few questions to see how much cover your family needs.</p>
              </div>
              <Link href="/assessment" className="h-[52px] px-6 bg-[#7957FF] text-white rounded-lg flex items-center gap-3 font-semibold">Start assessment <ArrowRight className="w-5 h-5" /></Link>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-9 items-start">
        <section className="flex-[1_1_320px] min-w-0 flex flex-col gap-4" aria-label="Your journey">
          <span className="text-[13px] font-bold tracking-[0.2em] uppercase">Your Journey</span>
          <div className="flex flex-col gap-3 ls-persp">
            {stages.map((j) => {
              const isNext = j === next;
              return (
                <Link
                  key={j.label}
                  href={j.href}
                  className={`flex items-center gap-4 px-[22px] py-5 rounded-[14px] border transition-transform hover:-translate-y-0.5 ${
                    isNext
                      ? "bg-[#E9E4FF] border-[#7957FF] shadow-[0_5px_0_#7957FF,0_18px_28px_-16px_rgba(121,87,255,0.6)]"
                      : "bg-white border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8]"
                  }`}
                >
                  <span className={`flex-none w-8 h-8 rounded-full grid place-items-center text-[15px] font-extrabold border-2 border-[#7957FF] ${j.done ? "bg-[#7957FF] text-white" : "bg-white text-white"}`}>{j.done ? <Check className="w-4 h-4" strokeWidth={3} /> : null}</span>
                  <span className={`flex-1 text-[17px] font-semibold ${j.done ? "text-[#5A5566]" : "text-[#24212B]"}`}>{j.label}</span>
                  {isNext && <span className="text-sm font-bold text-[#7957FF]">Next</span>}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex-[1.4_1_400px] min-w-0 flex flex-col gap-4" aria-label="Your tools">
          <span className="text-[13px] font-bold tracking-[0.2em] uppercase">Your Tools</span>
          <div className="flex flex-col gap-3 ls-persp">
            {shortcuts.map((t) => (
              <Link key={t.href} href={t.href} className="ls-lift flex items-center gap-[18px] px-[22px] py-5 bg-white border border-[#D9D3E8] rounded-[14px] text-[#24212B] shadow-[0_4px_0_#D9D3E8,0_18px_30px_-20px_rgba(36,33,43,0.3)]">
                <span className="flex-none w-[46px] h-[46px] rounded-xl grid place-items-center text-[#7957FF] shadow-[inset_0_1px_0_#fff,0_3px_0_#D9D3E8]" style={{ background: "linear-gradient(160deg,#FFFFFF,#E9E4FF)" }}><t.ic className="w-5 h-5" strokeWidth={1.8} /></span>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="font-bold text-[17px]">{t.title}</span>
                  <span className="text-[14.5px] text-[#5A5566]">{t.desc}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-[#7957FF]" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
