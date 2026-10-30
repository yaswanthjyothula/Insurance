import type { ProductType } from "@/types/api";

export type TypeFilter = "all" | ProductType;
const TABS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Term Life", label: "Term" },
  { value: "Whole Life", label: "Whole life" },
  { value: "Endowment", label: "Endowment" },
  { value: "ULIP", label: "ULIP" },
];

export function TypeTabs({
  value,
  counts,
  onChange,
}: {
  value: TypeFilter;
  counts: Record<string, number>;
  onChange: (t: TypeFilter) => void;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div role="tablist" aria-label="Product type" className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`h-10 rounded-lg border px-4 text-[14.5px] font-semibold ${value === t.value ? "border-[#7957FF] bg-[#E9E4FF] text-[#5B3BE6]" : "border-[#D9D3E8] bg-white text-[#24212B] hover:border-[#7957FF]"}`}
        >
          {t.label} <span className="font-normal text-[#6F6A7C]">({t.value === "all" ? total : (counts[t.value] ?? 0)})</span>
        </button>
      ))}
    </div>
  );
}
