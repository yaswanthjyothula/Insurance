import { Info, RotateCcw } from "lucide-react";
import type { FormOrigin } from "./use-assessment-form";

/** Tells the visitor when the form was not filled in by them: an old draft or a synthetic sample customer. */
export function FormNotice({ origin, onStartOver }: { origin: FormOrigin; onStartOver: () => void }) {
  if (!origin) return null;
  const message =
    origin.kind === "sample"
      ? `These answers belong to ${origin.name}, a synthetic sample customer. Review or edit anything before you calculate.`
      : "We restored the answers you entered earlier.";
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] text-[15px]"
      data-no-reveal
    >
      <span className="flex items-center gap-2.5">
        <Info className="w-4 h-4 text-[#7957FF] shrink-0" />
        {message}
      </span>
      <button type="button" onClick={onStartOver} className="inline-flex items-center gap-1.5 font-bold text-[#7957FF] hover:underline">
        <RotateCcw className="w-4 h-4" />
        Start over
      </button>
    </div>
  );
}
