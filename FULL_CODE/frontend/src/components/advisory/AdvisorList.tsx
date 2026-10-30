import { Star } from "lucide-react";
import { humaniseTag } from "@/lib/text";
import type { AdvisorOut } from "@/types/api";
import { initialsOf, offeredModes } from "@/components/advisory/advisory-helpers";
import { modeDetails } from "@/components/advisory/consultation-modes";

interface AdvisorListProps {
  advisors: AdvisorOut[];
  selectedId: string;
  onSelect: (advisor: AdvisorOut) => void;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[12.5px]">{children}</span>;
}

function AdvisorOption({ advisor, selected, onSelect }: { advisor: AdvisorOut; selected: boolean; onSelect: () => void }) {
  const slotCount = advisor.slots.length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={!advisor.has_availability}
      className={`w-full text-left p-3.5 sm:p-5 rounded-2xl border flex gap-3 sm:gap-4 items-start transition-all disabled:opacity-55 disabled:cursor-not-allowed ${selected ? "border-[#7957FF] bg-[#F7F4FF] shadow-[0_3px_0_#7957FF]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}
    >
      <span
        className={`flex-none w-12 h-12 rounded-full grid place-items-center font-extrabold ${selected ? "bg-[#7957FF] text-white" : "bg-[#E9E4FF] text-[#7957FF]"}`}
      >
        {initialsOf(advisor.advisor_name)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <span className="font-extrabold text-[17px]">{advisor.advisor_name}</span>
          <span className="text-[13px] text-[#6F6A7C]">{advisor.years_experience} years</span>
          <span className="inline-flex items-center gap-1 text-[13px] text-[#6F6A7C]">
            <Star className="w-3.5 h-3.5 fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
            {advisor.rating.toFixed(1)} ({advisor.review_count} reviews)
          </span>
        </span>
        <span className="block text-[14px] text-[#5A5566] mt-1">Speaks {advisor.languages.join(", ")}</span>
        <span className="flex flex-wrap gap-1.5 mt-2.5">
          {advisor.specialisations.map((tag) => (
            <Tag key={tag}>{humaniseTag(tag)}</Tag>
          ))}
          {offeredModes(advisor).map((mode) => (
            <Tag key={mode}>{modeDetails(mode).label}</Tag>
          ))}
        </span>
      </span>
      <span
        className={`flex-none text-[13px] font-bold px-2.5 py-1 rounded-md ${advisor.has_availability ? "bg-[#E9E4FF] text-[#7957FF]" : "bg-[#F1EEF8] text-[#6F6A7C]"}`}
      >
        {advisor.has_availability ? `${slotCount} ${slotCount === 1 ? "slot" : "slots"}` : "Fully booked"}
      </span>
    </button>
  );
}

export function AdvisorList({ advisors, selectedId, onSelect }: AdvisorListProps) {
  if (advisors.length === 0) return <p className="m-0 text-[15px] text-[#6F6A7C]">No advisor matches these filters. Try widening them.</p>;
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Advisors">
      {advisors.map((advisor) => (
        <AdvisorOption
          key={advisor.advisor_id}
          advisor={advisor}
          selected={advisor.advisor_id === selectedId}
          onSelect={() => onSelect(advisor)}
        />
      ))}
    </div>
  );
}
