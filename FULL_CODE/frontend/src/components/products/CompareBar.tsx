import { Scale, X } from "lucide-react";
import { MAX_COMPARE } from "@/lib/compare";

interface Props {
  names: { id: string; name: string }[];
  onOpen: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/** Appears once a product is ticked for comparison; opens the side-by-side view from two plans up. */
export function CompareBar({ names, onOpen, onRemove, onClear }: Props) {
  if (names.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9D3E8] bg-[#F5F2FF] px-5 py-3"
      role="region"
      aria-label="Comparison"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#5B3BE6]">
          <Scale className="h-4 w-4" />
          Compare ({names.length}/{MAX_COMPARE})
        </span>
        {names.map((n) => (
          <span
            key={n.id}
            className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1.5 text-[13.5px] font-semibold text-[#24212B]"
          >
            {n.name}
            <button
              type="button"
              onClick={() => onRemove(n.id)}
              aria-label={`Remove ${n.name} from comparison`}
              className="rounded-full p-1 hover:bg-[#E9E4FF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onClear} className="text-[13.5px] font-semibold text-[#6F6A7C] underline">
          Clear
        </button>
        <button
          type="button"
          onClick={onOpen}
          disabled={names.length < 2}
          className="h-10 rounded-lg bg-[#7957FF] px-5 text-[14.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {names.length < 2 ? "Pick one more to compare" : "Compare side by side"}
        </button>
      </div>
    </div>
  );
}
