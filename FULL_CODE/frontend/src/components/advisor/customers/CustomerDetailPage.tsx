"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { m } from "motion/react";
import { initials } from "@/components/advisor/format";
import { Reveal, rise, stagger } from "@/components/advisor/motion";
import { Skeleton } from "@/components/advisor/dashboard/parts";
import { ProtectionAnalysis } from "@/components/advisor/customers/ProtectionAnalysis";
import { SectionNav, type Section } from "@/components/advisor/customers/SectionNav";
import { FinancialSection, OverviewSection, TimelineSection } from "@/components/advisor/customers/Sections";
import { useCustomerDetail } from "@/components/advisor/customers/useCustomerDetail";

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "financial", label: "Financial profile" },
  { id: "protection", label: "Protection analysis" },
  { id: "activity", label: "Activity" },
];

function BackLink() {
  return (
    <Link
      href="/advisor/customers"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6F6A7C] transition-colors hover:text-[#7957FF]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All customers
    </Link>
  );
}

export function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, notFound, reload } = useCustomerDetail(params.id);

  if (loading && !data) {
    return (
      <div role="status" aria-label="Loading customer" className="space-y-6">
        <Skeleton className="h-16 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto mt-6 max-w-md space-y-4">
        <BackLink />
        <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
          <p className="m-0 text-sm font-semibold text-rose-800">{notFound ? "This customer isn't in your list." : error}</p>
          {!notFound && (
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const { overview } = data;
  return (
    <div className="space-y-6">
      <m.header variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <m.div variants={rise}>
          <BackLink />
        </m.div>
        <m.div variants={rise} className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#171B3D] text-lg font-bold text-white"
            aria-hidden="true"
          >
            {initials(overview.full_name)}
          </span>
          <div className="min-w-0">
            <h1 className="m-0 truncate text-2xl font-extrabold tracking-tight text-[#171B3D]">{overview.full_name}</h1>
            <p className="m-0 text-sm text-[#6F6A7C]">
              {overview.age} · {overview.city} · {overview.occupation}
            </p>
            <Link
              href={`/advisor/follow-ups?customer=${encodeURIComponent(overview.profile_id)}`}
              className="mt-1 inline-block text-sm font-bold text-[#7957FF] hover:underline"
            >
              Add a follow-up
            </Link>
          </div>
        </m.div>
      </m.header>

      <SectionNav sections={SECTIONS} />

      <section id="overview" aria-label="Overview" className="scroll-mt-36">
        <Reveal>
          <OverviewSection o={overview} />
        </Reveal>
      </section>
      <section id="financial" aria-label="Financial profile" className="scroll-mt-36 space-y-3">
        <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#171B3D]">Financial profile</h2>
        <Reveal>
          <FinancialSection f={data.financial} />
        </Reveal>
      </section>
      <section id="protection" aria-label="Protection analysis" className="scroll-mt-36 space-y-3">
        <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#171B3D]">Protection analysis</h2>
        <Reveal>
          <ProtectionAnalysis analysis={data.analysis} />
        </Reveal>
      </section>
      <section id="activity" aria-label="Activity" className="scroll-mt-36">
        <Reveal>
          <TimelineSection events={data.timeline} />
        </Reveal>
      </section>
    </div>
  );
}
