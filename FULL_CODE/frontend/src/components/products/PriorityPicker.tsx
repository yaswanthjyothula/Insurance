import type { Priority } from "@/types/api";

const OPTIONS: { value: Priority; label: string; hint: string }[] = [
  { value: "balanced", label: "Balanced", hint: "A mix of cover, price, goals and risk comfort" },
  { value: "lowest_cost", label: "Lowest cost", hint: "Weighs price most" },
  { value: "goal_savings", label: "Fund my goals", hint: "Weighs savings plans that pay out for your goals" },
  { value: "growth", label: "Long-term growth", hint: "Weighs market-linked growth" },
];

export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">What matters most to you?</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="What matters most">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            title={o.hint}
            className={`h-10 rounded-lg border px-4 text-[14.5px] font-semibold transition-colors ${value === o.value ? "border-[#7957FF] bg-[#7957FF] text-white" : "border-[#D9D3E8] bg-white text-[#24212B] hover:border-[#7957FF]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="m-0 text-[13.5px] text-[#6F6A7C]">{OPTIONS.find((o) => o.value === value)?.hint}</p>
    </div>
  );
}
