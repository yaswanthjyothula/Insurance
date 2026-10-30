import { AlertCircle, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { modeLabelT } from "@/lib/plan-config";
import type { Quote } from "@/types/api";

/** The live price for the configuration on screen, or the reasons it is not allowed. */
export function QuotePanel({ quote, loading, error }: { quote: Quote | null; loading: boolean; error: string | null }) {
  const { t, tx } = useI18n();
  if (error) {
    return (
      <div role="alert" className="flex gap-2 rounded-2xl border border-[#C23B3B] p-4 text-[14px] font-semibold text-[#C23B3B]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {tx(error)}
      </div>
    );
  }
  if (!quote) return <div className="rounded-2xl bg-[#FAF9F6] p-4 text-[#6F6A7C]">{t("products.quote.working")}</div>;
  const single = quote.payment_option === "single";
  return (
    <div
      className={`rounded-2xl border p-5 transition-opacity ${loading ? "opacity-60" : ""} ${quote.valid ? "border-[#D9D3E8] bg-[#FAF9F6]" : "border-[#C23B3B] bg-white"}`}
      aria-live="polite"
    >
      {quote.valid ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">
              {single ? t("products.quote.oneTimePremium") : t("products.quote.instalment", { mode: modeLabelT(t, quote.mode) })}
            </span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-[#7957FF]" />}
          </div>
          <div className="mt-1 text-[34px] font-extrabold tabular-nums tracking-tight text-[#24212B]">
            {formatINR(quote.total_instalment)}
          </div>
          <dl className="m-0 mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
            <div>
              <dt className="text-[#6F6A7C]">{t("products.quote.cover")}</dt>
              <dd className="m-0 font-bold">{formatINR(quote.sum_assured, { compact: true })}</dd>
            </div>
            <div>
              <dt className="text-[#6F6A7C]">{t("products.quote.term")}</dt>
              <dd className="m-0 font-bold">{t("products.years", { count: quote.policy_term_years })}</dd>
            </div>
            <div>
              <dt className="text-[#6F6A7C]">{t("products.quote.payingFor")}</dt>
              <dd className="m-0 font-bold">
                {single ? t("products.quote.onePayment") : t("products.years", { count: quote.premium_paying_term_years })}
              </dd>
            </div>
            <div>
              <dt className="text-[#6F6A7C]">{single ? t("products.quote.total") : t("products.quote.perYear")}</dt>
              <dd className="m-0 font-bold">{formatINR(quote.total_annual_premium)}</dd>
            </div>
          </dl>
          {quote.riders.length > 0 && (
            <ul className="m-0 mt-3 list-none border-t border-[#D9D3E8] p-0 pt-3 text-[13.5px]">
              <li className="flex justify-between">
                <span>{t("products.quote.basePolicy")}</span>
                <span className="tabular-nums">{formatINR(quote.base_instalment)}</span>
              </li>
              {quote.riders.map((r) => (
                <li key={r.rider_id} className="flex justify-between gap-4">
                  <span>{r.rider_name}</span>
                  <span className="tabular-nums">{formatINR(r.instalment)}</span>
                </li>
              ))}
            </ul>
          )}
          {quote.rate_per_1000 != null && (
            <p className="m-0 mt-3 text-[12.5px] text-[#6F6A7C]">
              {t("products.quote.rate", { rate: quote.rate_per_1000, band: quote.band_factor ?? "" })}
            </p>
          )}
        </>
      ) : (
        <ul role="alert" className="m-0 list-disc pl-5 text-[14px] font-semibold text-[#C23B3B]">
          {quote.issues.map((i) => (
            <li key={i}>{tx(i)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
