import type { AdvisorOut } from "@/types/api";
import { groupSlotsByDay } from "@/components/advisory/advisory-helpers";

interface SlotPickerProps {
  advisor: AdvisorOut | undefined;
  selectedSlotId: string;
  onSelect: (slotId: string) => void;
}

export function SlotPicker({ advisor, selectedSlotId, onSelect }: SlotPickerProps) {
  if (!advisor) return <p className="m-0 text-[15px] text-[#6F6A7C]">Choose an advisor first to see their times.</p>;
  if (advisor.slots.length === 0) return <p className="m-0 text-[15px] text-[#6F6A7C]">Fully booked. Pick another advisor.</p>;

  return (
    <div className="flex flex-col gap-4" role="radiogroup" aria-label="Available times">
      {groupSlotsByDay(advisor.slots).map((day) => (
        <div key={day.dayKey}>
          <div className="text-[13px] font-bold text-[#5A5566] mb-2">{day.dayLabel}</div>
          <div className="flex flex-wrap gap-2.5">
            {day.slots.map(({ slot, time }) => {
              const selected = slot.slot_id === selectedSlotId;
              return (
                <button
                  key={slot.slot_id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(slot.slot_id)}
                  className={`h-12 px-5 rounded-xl border text-[15px] font-semibold transition-all ${selected ? "bg-[#7957FF] text-white border-[#7957FF] shadow-[0_3px_0_#5B3BE6]" : "bg-white border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5"}`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
