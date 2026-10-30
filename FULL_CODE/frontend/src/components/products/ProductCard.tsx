"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { paymentLabel } from "@/lib/plan-config";
import type { ProductFit } from "@/types/api";
import { FactorBars } from "./FactorBars";

const ROLE_STYLE: Record<string, string> = {
  "core protection": "bg-[#E9E4FF] text-[#5B3BE6]",
  "goal funding": "bg-[#E7F6F0] text-[#0B5E49]",
  "long-term growth": "bg-[#FFF3E0] text-[#8A4B06]",
  "lifelong cover": "bg-[#F1EEF8] text-[#4A4553]",
};

interface Props {
  fit: ProductFit;
  selected: boolean;
  compared: boolean;
  compareFull: boolean;
  onCustomise: () => void;
  onToggleCompare: () => void;
}

/** One product for this customer: the engine's suggested configuration, its price, and why it ranked here. */
export function ProductCard({ fit, selected, compared, compareFull, onCustomise, onToggleCompare }: Props) {
  const [open, setOpen] = useState(false);
  const q = fit.quote;
  const single = q?.payment_option === "single";
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 transition-all ${fit.eligible ? "" : "opacity-75"} ${selected ? "border-[#7957FF] shadow-[0_4px_0_#7957FF]" : "border-[#D9D3E8] shadow-[0_3px_0_#E9E4FF]"} ${open ? "sm:col-span-2 lg:col-span-3" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[12px] font-bold ${ROLE_STYLE[fit.role] ?? ROLE_STYLE["lifelong cover"]}`}
          >
            {fit.product_type} · {fit.role}
          </span>
          <h3 className="m-0 mt-2 text-[18px] font-extrabold leading-snug tracking-tight text-[#24212B]">{fit.product_name}</h3>
        </div>
        {fit.eligible && (
          <div className="shrink-0 text-right">
            <div className="text-[26px] font-extrabold leading-none tabular-nums text-[#7957FF]">{fit.match_percent}%</div>
            <div className="text-[11.5px] font-semibold text-[#6F6A7C]">match</div>
          </div>
        )}
      </div>
      <p className="m-0 mt-2 line-clamp-3 text-[14px] leading-normal text-[#5A5566]">{fit.summary}</p>

      {fit.eligible && q ? (
        <dl className="m-0 mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[#E9E4FF] bg-[#FAF9F6] p-3">
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">Cover</dt>
            <dd className="m-0 text-[15px] font-extrabold tabular-nums">{formatINR(q.sum_assured, { compact: true })}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">Term</dt>
            <dd className="m-0 text-[15px] font-extrabold">{q.policy_term_years} yrs</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">{single ? "One-time" : "Per month"}</dt>
            <dd className="m-0 text-[15px] font-extrabold tabular-nums">{formatINR(q.total_instalment)}</dd>
          </div>
        </dl>
      ) : (
        <ul className="m-0 mt-4 list-disc rounded-xl bg-[#FAF9F6] py-3 pl-8 pr-3 text-[13.5px] text-[#4A4553]">
          {fit.issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {q && <p className="m-0 mt-2 text-[12.5px] text-[#6F6A7C]">{paymentLabel(q.payment_option)}</p>}

      {fit.eligible && (
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <label
            className={`inline-flex items-center gap-1.5 text-[13.5px] font-semibold ${compared || !compareFull ? "cursor-pointer text-[#24212B]" : "cursor-not-allowed text-[#8C879A]"}`}
            title={!compared && compareFull ? "You can compare up to 3 plans" : undefined}
          >
            <input
              type="checkbox"
              checked={compared}
              disabled={!compared && compareFull}
              onChange={onToggleCompare}
              className="h-4 w-4 accent-[#7957FF]"
            />
            Compare
          </label>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#7957FF] hover:underline"
          >
            Why this match
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onCustomise}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-[14.5px] font-bold ${selected ? "border-[#7957FF] bg-[#7957FF] text-white" : "border-[#D9D3E8] bg-white text-[#24212B] hover:border-[#7957FF]"}`}
          >
            {selected ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                Selected · edit
              </>
            ) : (
              "Customise"
            )}
          </button>
        </div>
      )}
      {open && (
        <div className="mt-4 grid gap-5 border-t border-[#D9D3E8] pt-4 lg:grid-cols-2">
          <p className="m-0 text-[14px] leading-normal text-[#4A4553]">{fit.reason}</p>
          <FactorBars fit={fit} />
        </div>
      )}
    </article>
  );
}
