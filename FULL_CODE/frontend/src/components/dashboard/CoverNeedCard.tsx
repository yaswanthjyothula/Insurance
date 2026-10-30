import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SavedAssessment } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { CARD_CLASS, PRIMARY_LINK_CLASS, SECONDARY_LINK_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { formatSavedDate } from "@/components/dashboard/dashboard-helpers";

export function CoverNeedCard({ assessment }: { assessment: SavedAssessment | undefined }) {
  return (
    <section className={CARD_CLASS} aria-label="Cover need">
      <h2 className={SECTION_HEADING_CLASS}>1. Your cover need</h2>
      {assessment ? (
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[13px] text-[#6F6A7C]">Recommended life cover</div>
            <div className="text-[34px] font-extrabold tracking-[-0.03em] text-[#24212B]">
              {formatINR(assessment.recommended_cover, { compact: true })}
            </div>
            <div className="text-[13px] text-[#6F6A7C]">
              Worked out on {formatSavedDate(assessment.saved_at)}
              {assessment.dependents != null ? ` · ${assessment.dependents} dependents` : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/results" className={SECONDARY_LINK_CLASS}>
              See full results
            </Link>
            <Link href="/assessment" className={SECONDARY_LINK_CLASS}>
              Update my answers
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[16px] text-[#5A5566]">You haven&apos;t worked out your cover need yet. It takes about two minutes.</p>
          <Link href="/assessment" className={PRIMARY_LINK_CLASS}>
            Start the assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
