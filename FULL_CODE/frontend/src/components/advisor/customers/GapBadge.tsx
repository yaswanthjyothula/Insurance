import type { GapBandKey } from "@/types/advisor";

const STYLE: Record<GapBandKey, { label: string; tone: string }> = {
  covered: { label: "Fully covered", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  small: { label: "Small gap", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  moderate: { label: "Moderate gap", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  large: { label: "Large gap", tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function GapBadge({ band }: { band: GapBandKey }) {
  const { label, tone } = STYLE[band];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${tone}`}>{label}</span>
  );
}
