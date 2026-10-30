"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SavedAssessment } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { CARD_CLASS, PRIMARY_LINK_CLASS, SECONDARY_LINK_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { formatDate } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";

export function CoverNeedCard({ assessment }: { assessment: SavedAssessment | undefined }) {
  const { t, lang } = useI18n();
  return (
    <section className={CARD_CLASS} aria-label={t("account.need.label")}>
      <h2 className={SECTION_HEADING_CLASS}>{t("account.need.heading")}</h2>
      {assessment ? (
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[13px] text-[#6F6A7C]">{t("account.need.recommended")}</div>
            <div className="text-[34px] font-extrabold tracking-[-0.03em] text-[#24212B]">
              {formatINR(assessment.recommended_cover, { compact: true })}
            </div>
            <div className="text-[13px] text-[#6F6A7C]">
              {assessment.dependents != null
                ? t("account.need.workedOutDependents", { date: formatDate(lang, assessment.saved_at), count: assessment.dependents })
                : t("account.need.workedOut", { date: formatDate(lang, assessment.saved_at) })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/results" className={SECONDARY_LINK_CLASS}>
              {t("account.need.seeResults")}
            </Link>
            <Link href="/assessment" className={SECONDARY_LINK_CLASS}>
              {t("account.need.update")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[16px] text-[#5A5566]">{t("account.need.empty")}</p>
          <Link href="/assessment" className={PRIMARY_LINK_CLASS}>
            {t("account.need.start")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
