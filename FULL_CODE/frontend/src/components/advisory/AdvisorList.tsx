"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useTagLabels } from "@/components/advisory/useTagLabels";
import type { AdvisorOut } from "@/types/api";
import { initialsOf, offeredModes } from "@/components/advisory/advisory-helpers";
import { modeDetails } from "@/components/advisory/consultation-modes";

interface AdvisorListProps {
  advisors: AdvisorOut[];
  selectedId: string;
  onSelect: (advisor: AdvisorOut) => void;
  /** The customer's own advisor, if they have one: listed first and marked. */
  myAdvisorId?: string;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[12.5px]">{children}</span>;
}

function AdvisorOption({
  advisor,
  selected,
  mine,
  onSelect,
}: {
  advisor: AdvisorOut;
  selected: boolean;
  mine: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const { tagLabel, languageLabel } = useTagLabels();
  const slotCount = advisor.slots.length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={!advisor.has_availability}
      className={`w-full text-start p-3.5 sm:p-5 rounded-2xl border flex gap-3 sm:gap-4 items-start transition-all disabled:opacity-55 disabled:cursor-not-allowed ${selected ? "border-[#7957FF] bg-[#F7F4FF] shadow-[0_3px_0_#7957FF]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}
    >
      <span
        className={`flex-none w-12 h-12 rounded-full grid place-items-center font-extrabold ${selected ? "bg-[#7957FF] text-white" : "bg-[#E9E4FF] text-[#7957FF]"}`}
      >
        {initialsOf(advisor.advisor_name)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <span className="font-extrabold text-[17px]">{advisor.advisor_name}</span>
          {mine && (
            <span className="rounded-full bg-[#7957FF] px-2 py-0.5 text-[11px] font-bold text-white">{t("advisory.list.yourAdvisor")}</span>
          )}
          <span className="text-[13px] text-[#6F6A7C]">{t("advisory.list.years", { count: advisor.years_experience })}</span>
          <span className="inline-flex items-center gap-1 text-[13px] text-[#6F6A7C]">
            <Star className="w-3.5 h-3.5 fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
            {t("advisory.list.rating", { rating: advisor.rating.toFixed(1), count: advisor.review_count })}
          </span>
        </span>
        <span className="block text-[14px] text-[#5A5566] mt-1">
          {t("advisory.list.speaks", { languages: advisor.languages.map(languageLabel).join(", ") })}
        </span>
        {advisor.bio && <span className="mt-2 block text-[14px] leading-relaxed text-[#24212B]">{advisor.bio}</span>}
        <span className="flex flex-wrap gap-1.5 mt-2.5">
          {advisor.specialisations.map((tag) => (
            <Tag key={tag}>{tagLabel(tag)}</Tag>
          ))}
          {offeredModes(advisor).map((mode) => (
            <Tag key={mode}>{t(modeDetails(mode).labelKey)}</Tag>
          ))}
        </span>
      </span>
      <span
        className={`flex-none text-[13px] font-bold px-2.5 py-1 rounded-md ${advisor.has_availability ? "bg-[#E9E4FF] text-[#7957FF]" : "bg-[#F1EEF8] text-[#6F6A7C]"}`}
      >
        {advisor.has_availability
          ? slotCount === 1
            ? t("advisory.list.slotOne")
            : t("advisory.list.slotMany", { count: slotCount })
          : t("advisory.list.fullyBooked")}
      </span>
    </button>
  );
}

export function AdvisorList({ advisors, selectedId, onSelect, myAdvisorId }: AdvisorListProps) {
  const { t } = useI18n();
  const ordered = [...advisors].sort((a, b) => Number(b.advisor_id === myAdvisorId) - Number(a.advisor_id === myAdvisorId));
  if (advisors.length === 0) return <p className="m-0 text-[15px] text-[#6F6A7C]">{t("advisory.list.empty")}</p>;
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label={t("advisory.list.aria")}>
      {ordered.map((advisor) => (
        <AdvisorOption
          key={advisor.advisor_id}
          advisor={advisor}
          mine={advisor.advisor_id === myAdvisorId}
          selected={advisor.advisor_id === selectedId}
          onSelect={() => onSelect(advisor)}
        />
      ))}
    </div>
  );
}
