"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import { paymentLabelT } from "@/lib/plan-config";
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
  const { t, tx } = useI18n();
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
            {tx(fit.product_type)} · {tx(fit.role)}
          </span>
          <h3 className="m-0 mt-2 text-[18px] font-extrabold leading-snug tracking-tight text-[#24212B]">{fit.product_name}</h3>
        </div>
        {fit.eligible && (
          <div className="shrink-0 text-end">
            <div className="text-[26px] font-extrabold leading-none tabular-nums text-[#7957FF]">{fit.match_percent}%</div>
            <div className="text-[11.5px] font-semibold text-[#6F6A7C]">{t("products.card.match")}</div>
          </div>
        )}
      </div>
      <p className="m-0 mt-2 line-clamp-3 text-[14px] leading-normal text-[#5A5566]">{fit.summary}</p>

      {fit.eligible && q ? (
        <dl className="m-0 mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[#E9E4FF] bg-[#FAF9F6] p-3">
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">{t("products.card.cover")}</dt>
            <dd className="m-0 text-[15px] font-extrabold tabular-nums">{formatINR(q.sum_assured, { compact: true })}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">{t("products.card.term")}</dt>
            <dd className="m-0 text-[15px] font-extrabold">{t("products.card.termYears", { count: q.policy_term_years })}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">
              {single ? t("products.card.oneTime") : t("products.card.perMonth")}
            </dt>
            <dd className="m-0 text-[15px] font-extrabold tabular-nums">{formatINR(q.total_instalment)}</dd>
          </div>
        </dl>
      ) : (
        <ul className="m-0 mt-4 list-disc rounded-xl bg-[#FAF9F6] py-3 ps-8 pe-3 text-[13.5px] text-[#4A4553]">
          {fit.issues.map((i) => (
            <li key={i}>{tx(i)}</li>
          ))}
        </ul>
      )}
      {q && <p className="m-0 mt-2 text-[12.5px] text-[#6F6A7C]">{paymentLabelT(t, q.payment_option)}</p>}

      {fit.eligible && (
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <label
            className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold ${compared || !compareFull ? "cursor-pointer text-[#24212B]" : "cursor-not-allowed text-[#8C879A]"}`}
            title={!compared && compareFull ? t("products.compareLimit") : undefined}
          >
            <input
              type="checkbox"
              checked={compared}
              disabled={!compared && compareFull}
              onChange={onToggleCompare}
              className="h-4 w-4 accent-[#7957FF]"
            />
            {t("products.compare")}
          </label>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 whitespace-nowrap text-[13.5px] font-semibold text-[#7957FF] hover:underline"
          >
            {t("products.card.why")}
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
                {t("products.card.selectedEdit")}
              </>
            ) : (
              t("products.customise")
            )}
          </button>
        </div>
      )}
      {open && (
        <div className="mt-4 grid gap-5 border-t border-[#D9D3E8] pt-4 lg:grid-cols-2">
          <p className="m-0 text-[14px] leading-normal text-[#4A4553]">{tx(fit.reason)}</p>
          <FactorBars fit={fit} />
        </div>
      )}
    </article>
  );
}
