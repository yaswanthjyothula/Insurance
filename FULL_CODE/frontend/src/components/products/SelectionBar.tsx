import Link from "next/link";
import { ArrowRight, Scale, X } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { monthlyTotal } from "@/lib/plan-config";
import type { SelectedPlan } from "@/types/api";

interface Props {
  selection: SelectedPlan[];
  issues: string[];
  onRemove: (productId: string) => void;
  onContinue: () => void;
  onCompare: () => void;
}

/** Sticky summary of what the customer has chosen, with the combined-cover check from the server. */
export function SelectionBar({ selection, issues, onRemove, onContinue, onCompare }: Props) {
  if (selection.length === 0) return null;
  return (
    <div className="sticky bottom-4 z-30 mt-6" data-no-reveal>
      <div className="rounded-2xl border border-[#D9D3E8] bg-white p-4 shadow-[0_18px_40px_-18px_rgba(121,87,255,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {selection.map((p) => (
              <li
                key={p.request.product_id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E9E4FF] py-1 pl-3 pr-1.5 text-[13.5px] font-bold text-[#5B3BE6]"
              >
                {p.quote.product_name}
                <button
                  type="button"
                  onClick={() => onRemove(p.request.product_id)}
                  aria-label={`Remove ${p.quote.product_name}`}
                  className="rounded-full p-1 hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <div className="text-right text-[13px] text-[#6F6A7C]">
              <strong className="block text-[18px] tabular-nums text-[#24212B]">{formatINR(monthlyTotal(selection))} / month</strong>
              {formatINR(
                selection.reduce((s, p) => s + p.quote.sum_assured, 0),
                { compact: true },
              )}{" "}
              cover
            </div>
            <button
              type="button"
              onClick={onCompare}
              title={selection.length > 1 ? "Compare your selected plans" : "Compare this plan with another"}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#D9D3E8] bg-white px-4 font-bold text-[#24212B] hover:border-[#7957FF]"
            >
              <Scale className="h-4 w-4 text-[#7957FF]" />
              Compare
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={issues.length > 0}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#7957FF] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Talk to an advisor
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {issues.length > 0 && (
          <ul role="alert" className="m-0 mt-3 list-disc pl-5 text-[13.5px] font-semibold text-[#C23B3B]">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}
        <p className="m-0 mt-2 text-[12px] text-[#6F6A7C]">
          Prices are from a fictional insurer&apos;s rate table.{" "}
          <Link href="/resources" className="underline">
            How to read them
          </Link>
        </p>
      </div>
    </div>
  );
}
