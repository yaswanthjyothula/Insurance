import { Scale, X } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { MAX_COMPARE } from "@/lib/compare";

interface Props {
  names: { id: string; name: string }[];
  onOpen: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/** Appears once a product is ticked for comparison; opens the side-by-side view from two plans up. */
export function CompareBar({ names, onOpen, onRemove, onClear }: Props) {
  const t = useT();
  if (names.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9D3E8] bg-[#F5F2FF] px-5 py-3"
      role="region"
      aria-label={t("products.compareBar.aria")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#5B3BE6]">
          <Scale className="h-4 w-4" />
          {t("products.compareBar.count", { count: names.length, max: MAX_COMPARE })}
        </span>
        {names.map((n) => (
          <span
            key={n.id}
            className="inline-flex items-center gap-1 rounded-full bg-white py-1 ps-3 pe-1.5 text-[13.5px] font-semibold text-[#24212B]"
          >
            {n.name}
            <button
              type="button"
              onClick={() => onRemove(n.id)}
              aria-label={t("products.compareBar.remove", { name: n.name })}
              className="rounded-full p-1 hover:bg-[#E9E4FF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onClear} className="text-[13.5px] font-semibold text-[#6F6A7C] underline">
          {t("products.compareBar.clear")}
        </button>
        <button
          type="button"
          onClick={onOpen}
          disabled={names.length < 2}
          className="h-10 rounded-lg bg-[#7957FF] px-5 text-[14.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {names.length < 2 ? t("products.compareBar.pickOne") : t("products.compareBar.sideBySide")}
        </button>
      </div>
    </div>
  );
}
