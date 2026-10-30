import { AlertCircle, Check, FileCheck2, Landmark, Target, User, Users } from "lucide-react";

export const STEPS = [
  { label: "Profile", icon: User },
  { label: "Family", icon: Users },
  { label: "Liabilities", icon: Landmark },
  { label: "Goals", icon: Target },
  { label: "Review", icon: FileCheck2 },
] as const;

interface StepTabsProps {
  step: number;
  hasErrors: (step: number) => boolean;
  isDone: (step: number) => boolean;
  onSelect: (step: number) => void;
}

function tabClass(active: boolean, bad: boolean, done: boolean): string {
  if (active) return "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]";
  if (bad) return "bg-[#FFFFFF] text-[#C23B3B] border-[#C23B3B] shadow-[0_4px_0_#F2C9C9]";
  if (done) return "bg-[#E9E4FF] text-[#7957FF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]";
  return "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5";
}

export function StepTabs({ step, hasErrors, isDone, onSelect }: StepTabsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" role="tablist" aria-label="Assessment steps" data-no-reveal>
      {STEPS.map(({ label, icon: Icon }, index) => {
        const active = step === index,
          bad = hasErrors(index),
          done = isDone(index);
        return (
          <button
            key={label}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(index)}
            type="button"
            className={`flex items-center justify-center gap-2.5 h-12 px-2 rounded-[10px] text-[15px] font-semibold transition-all border ${tabClass(active, bad, done)}`}
          >
            {done ? (
              <Check className="w-4 h-4" strokeWidth={3} />
            ) : bad ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
