import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { Priority } from "@/types/api";

const OPTIONS: { value: Priority; labelKey: MessageKey; hintKey: MessageKey }[] = [
  { value: "balanced", labelKey: "products.priority.balanced", hintKey: "products.priority.balancedHint" },
  { value: "lowest_cost", labelKey: "products.priority.lowestCost", hintKey: "products.priority.lowestCostHint" },
  { value: "goal_savings", labelKey: "products.priority.goalSavings", hintKey: "products.priority.goalSavingsHint" },
  { value: "growth", labelKey: "products.priority.growth", hintKey: "products.priority.growthHint" },
];

export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">{t("products.priority.heading")}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("products.priority.aria")}>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            title={t(o.hintKey)}
            className={`h-10 rounded-lg border px-4 text-[14.5px] font-semibold transition-colors ${value === o.value ? "border-[#7957FF] bg-[#7957FF] text-white" : "border-[#D9D3E8] bg-white text-[#24212B] hover:border-[#7957FF]"}`}
          >
            {t(o.labelKey)}
          </button>
        ))}
      </div>
      <p className="m-0 text-[13.5px] text-[#6F6A7C]">
        {(() => {
          const hint = OPTIONS.find((o) => o.value === value)?.hintKey;
          return hint ? t(hint) : null;
        })()}
      </p>
    </div>
  );
}
