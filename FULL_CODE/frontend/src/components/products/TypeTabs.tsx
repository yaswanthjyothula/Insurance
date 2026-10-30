import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { ProductType } from "@/types/api";

export type TypeFilter = "all" | ProductType;
const TABS: { value: TypeFilter; labelKey: MessageKey }[] = [
  { value: "all", labelKey: "products.tabs.all" },
  { value: "Term Life", labelKey: "products.tabs.term" },
  { value: "Whole Life", labelKey: "products.tabs.wholeLife" },
  { value: "Endowment", labelKey: "products.tabs.endowment" },
  { value: "ULIP", labelKey: "products.tabs.ulip" },
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
  const t = useT();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div role="tablist" aria-label={t("products.tabs.aria")} className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`h-10 rounded-lg border px-4 text-[14.5px] font-semibold ${value === tab.value ? "border-[#7957FF] bg-[#E9E4FF] text-[#5B3BE6]" : "border-[#D9D3E8] bg-white text-[#24212B] hover:border-[#7957FF]"}`}
        >
          {t(tab.labelKey)} <span className="font-normal text-[#6F6A7C]">({tab.value === "all" ? total : (counts[tab.value] ?? 0)})</span>
        </button>
      ))}
    </div>
  );
}
