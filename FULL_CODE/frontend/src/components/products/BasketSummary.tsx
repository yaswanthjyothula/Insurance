import { AlertCircle, CheckCircle2, Scale } from "lucide-react";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import { bold, mark } from "./rich";
import type { Basket, ProductFit } from "@/types/api";

interface Props {
  basket: Basket;
  recommendedCover: number;
  onUse: (items: ProductFit[]) => void;
  active: boolean;
  comparedIds: string[];
  compareFull: boolean;
  onToggleCompare: (id: string) => void;
  onCompareAll: (ids: string[]) => void;
}

/** The engine's suggested combination: protection first, then goal or growth add-ons that fit the budget. */
export function BasketSummary({ basket, recommendedCover, onUse, active, comparedIds, compareFull, onToggleCompare, onCompareAll }: Props) {
  const { t, tx } = useI18n();
  return (
    <section
      aria-label={t("products.basket.aria")}
      className="rounded-3xl border border-[#D9D3E8] bg-white p-6 sm:p-7"
      style={{ background: "linear-gradient(135deg,#F5F2FF 0%,#FFFFFF 60%)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[13px] font-bold uppercase tracking-[0.14em] text-[#7957FF]">{t("products.basket.eyebrow")}</p>
          <h2 className="m-0 mt-1 text-[24px] font-extrabold tracking-tight text-[#24212B]">
            {basket.items.length > 1 ? t("products.basket.multiTitle", { count: basket.items.length }) : t("products.basket.singleTitle")}
          </h2>
          <p className="m-0 mt-1 text-[14.5px] text-[#5A5566]">
            {bold(t("products.coverNeed", { amount: mark(formatINR(recommendedCover, { compact: true })) }))}
          </p>
        </div>
        <div className="text-end">
          <div className="text-[30px] font-extrabold tabular-nums leading-none text-[#24212B]">
            {formatINR(basket.total_monthly)}
            <span className="text-[15px] font-semibold text-[#6F6A7C]"> {t("products.perMonthSuffix")}</span>
          </div>
          <div className="mt-1 text-[13px] text-[#6F6A7C]">
            {basket.budget_monthly
              ? t("products.basket.budget", { amount: formatINR(basket.budget_monthly) })
              : t("products.basket.noBudget")}{" "}
            · {t("products.coverAmount", { amount: formatINR(basket.total_cover, { compact: true }) })}
          </div>
        </div>
      </div>
      <ul className="m-0 mt-5 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {basket.items.map((it) => (
          <li key={it.product_id} className="rounded-2xl border border-[#D9D3E8] bg-white p-4">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#7957FF]">{tx(it.role)}</div>
            <div className="mt-0.5 font-extrabold text-[#24212B]">{it.product_name}</div>
            <div className="mt-1 text-[13.5px] text-[#5A5566]">
              {t(it.quote?.payment_option === "single" ? "products.basket.itemOnce" : "products.basket.itemMonthly", {
                cover: formatINR(it.quote?.sum_assured ?? 0, { compact: true }),
                price: formatINR(it.quote?.total_instalment ?? 0),
              })}
            </div>
            <CompareTick
              checked={comparedIds.includes(it.product_id)}
              disabled={!comparedIds.includes(it.product_id) && compareFull}
              onChange={() => onToggleCompare(it.product_id)}
            />
          </li>
        ))}
      </ul>
      {basket.notes.length > 0 && (
        <ul role="note" className="m-0 mt-4 flex list-none flex-col gap-1.5 p-0">
          {basket.notes.map((n) => (
            <li key={n} className="flex gap-2 text-[14px] text-[#8A4B06]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {tx(n)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onUse(basket.items)} className="h-12 rounded-lg bg-[#7957FF] px-6 font-bold text-white">
          {active ? t("products.basket.inSelection") : t("products.basket.use")}
        </button>
        {basket.items.length > 0 && (
          <button
            type="button"
            onClick={() => onCompareAll(basket.items.map((i) => i.product_id))}
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#D9D3E8] bg-white px-5 font-bold text-[#24212B] hover:border-[#7957FF]"
          >
            <Scale className="h-4 w-4 text-[#7957FF]" />
            {basket.items.length > 1 ? t("products.basket.compareThese") : t("products.basket.compareOther")}
          </button>
        )}
        {active && (
          <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0B5E49]">
            <CheckCircle2 className="h-4 w-4" />
            {t("products.basket.added")}
          </span>
        )}
      </div>
    </section>
  );
}

function CompareTick({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: () => void }) {
  const t = useT();
  return (
    <label
      className={`mt-3 inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold ${disabled ? "cursor-not-allowed text-[#8C879A]" : "cursor-pointer text-[#24212B]"}`}
      title={disabled ? t("products.compareLimit") : undefined}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="h-4 w-4 accent-[#7957FF]" />
      {t("products.compare")}
    </label>
  );
}
