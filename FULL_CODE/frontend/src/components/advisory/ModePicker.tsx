import type { ConsultationMode } from "@/components/advisory/advisory-helpers";
import { CONSULTATION_MODES } from "@/components/advisory/consultation-modes";

interface ModePickerProps {
  offered: ConsultationMode[];
  selected: ConsultationMode | null;
  onSelect: (mode: ConsultationMode) => void;
}

export function ModePicker({ offered, selected, onSelect }: ModePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Consultation mode">
      {CONSULTATION_MODES.map(({ id, label, hint, icon: Icon }) => {
        const available = offered.includes(id);
        const on = selected === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!available}
            onClick={() => onSelect(id)}
            className={`p-4 rounded-xl border text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${on ? "border-[#7957FF] bg-[#F7F4FF] shadow-[0_3px_0_#7957FF]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}
          >
            <Icon className={`w-5 h-5 ${on ? "text-[#7957FF]" : "text-[#6F6A7C]"}`} />
            <span>
              <span className="block font-bold text-[15px]">{label}</span>
              <span className="block text-[13px] text-[#6F6A7C]">{available ? hint : "Not offered by this advisor"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
