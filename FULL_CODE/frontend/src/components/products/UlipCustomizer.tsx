"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import { modeLabelT, requestFromFit, ulipMultiples } from "@/lib/plan-config";
import { useDebouncedPost } from "@/hooks/useDebouncedRequest";
import type { Applicant, PackFund, PackProduct, PayMode, ProductFit, Quote, QuoteRequest, SelectedPlan, UlipProjection } from "@/types/api";
import { Modal } from "./Modal";
import { PolicyFacts } from "./Customizer";
import { QuotePanel } from "./QuotePanel";
import { UlipChart } from "./UlipChart";

const field = "mt-1.5 h-11 w-full rounded-lg border border-[#D9D3E8] bg-white px-3 text-[15px] font-semibold text-[#24212B]";
const label = "text-[13px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]";

interface Props {
  fit: ProductFit;
  product: PackProduct;
  funds: PackFund[];
  applicant: Applicant;
  onSave: (plan: SelectedPlan) => void;
  onClose: () => void;
}

/** ULIP: the customer chooses the premium, a cover multiple, the fund and the term, and sees where the fund could end up. */
export function UlipCustomizer({ fit, product, funds, applicant, onSave, onClose }: Props) {
  const { t, tx } = useI18n();
  const start = fit.quote as Quote;
  const single = start.payment_option === "single";
  const multiples = ulipMultiples(product, applicant.age);
  const minPremium = product.min_annual_premium_inr ?? 10_000;
  const maxPremium = product.max_annual_premium_inr ?? minPremium;

  const [premium, setPremium] = useState(Math.round(start.base_annual_premium));
  const [multiple, setMultiple] = useState(fit.sa_multiple ?? multiples[0]);
  const [term, setTerm] = useState(start.policy_term_years);
  const [fundId, setFundId] = useState(fit.fund_id ?? funds[0]?.fund_id);
  const [mode, setMode] = useState<PayMode>("monthly");

  const request: QuoteRequest = useMemo(
    () => ({
      ...requestFromFit(fit, applicant, mode),
      annual_premium: premium,
      sa_multiple: multiple,
      policy_term_years: term,
      fund_id: fundId,
    }),
    [fit, applicant, mode, premium, multiple, term, fundId],
  );
  const projectionRequest = useMemo(
    () => ({
      product_id: product.product_id,
      applicant,
      annual_premium: premium,
      sa_multiple: multiple,
      policy_term_years: term,
      payment_option: start.payment_option,
      fund_id: fundId,
    }),
    [product.product_id, applicant, premium, multiple, term, start.payment_option, fundId],
  );
  const { result: quote, error, loading } = useDebouncedPost<QuoteRequest, Quote>("/quotes", request);
  const { result: projection } = useDebouncedPost<typeof projectionRequest, UlipProjection>("/ulip/projection", projectionRequest);
  const fund = funds.find((f) => f.fund_id === fundId);
  const minTerm = product.min_policy_term_years ?? 10;
  const maxTerm = Math.min(product.max_policy_term_years ?? 30, product.max_maturity_age - applicant.age);

  return (
    <Modal title={t("products.customiseTitle", { name: product.product_name })} onClose={onClose}>
      <p className="m-0 mb-5 text-[15px] text-[#4A4553]">{product.plain_language_summary}</p>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between">
              <label htmlFor="premium" className={label}>
                {single ? t("products.ulip.oneTime") : t("products.ulip.premiumPerYear")}
              </label>
              <span className="font-extrabold text-[#7957FF]">{formatINR(premium)}</span>
            </div>
            <input
              id="premium"
              type="range"
              min={minPremium}
              max={maxPremium}
              step={single ? 10_000 : 1_000}
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
              className="mt-2 w-full accent-[#7957FF]"
            />
          </div>
          <div>
            <span className={label}>{t("products.ulip.multiple")}</span>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("products.ulip.multipleAria")}>
              {multiples.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === multiple}
                  onClick={() => setMultiple(m)}
                  className={`h-10 rounded-lg border px-4 text-[14px] font-bold ${m === multiple ? "border-[#7957FF] bg-[#7957FF] text-white" : "border-[#D9D3E8] bg-white text-[#24212B]"}`}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <label htmlFor="uterm" className={label}>
                {t("products.ulip.term")}
              </label>
              <span className="font-extrabold text-[#7957FF]">{t("products.years", { count: term })}</span>
            </div>
            <input
              id="uterm"
              type="range"
              min={minTerm}
              max={maxTerm}
              step={1}
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="mt-2 w-full accent-[#7957FF]"
            />
          </div>
          <div>
            <label htmlFor="fund" className={label}>
              {t("products.ulip.fund")}
            </label>
            <select id="fund" className={field} value={fundId} onChange={(e) => setFundId(e.target.value)}>
              {funds.map((f) => (
                <option key={f.fund_id} value={f.fund_id}>
                  {t("products.ulip.fundOption", { name: f.fund_name, risk: tx(f.risk_level.replace(/_/g, " ")) })}
                </option>
              ))}
            </select>
            {fund && (
              <p className="m-0 mt-1 text-[12.5px] text-[#6F6A7C]">
                {fund.objective} {t("products.ulip.fundCharge", { pct: fund.fmc_pct_pa })}
              </p>
            )}
          </div>
          {!single && (
            <div>
              <label htmlFor="umode" className={label}>
                {t("products.ulip.howOften")}
              </label>
              <select id="umode" className={field} value={mode} onChange={(e) => setMode(e.target.value as PayMode)}>
                {product.premium_modes.map((m) => (
                  <option key={m} value={m}>
                    {modeLabelT(t, m as PayMode)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 md:sticky md:top-4 md:self-start">
          <QuotePanel quote={quote} loading={loading} error={error} />
          <button
            type="button"
            disabled={!quote?.valid}
            onClick={() => quote?.valid && onSave({ request, quote, fit_summary: fit.reason })}
            className="h-12 rounded-lg bg-[#7957FF] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("products.ulip.add")}
          </button>
        </div>
      </div>
      {projection && (
        <section className="mt-6 rounded-2xl border border-[#D9D3E8] p-4" aria-label={t("products.ulip.illustration")}>
          <h3 className="m-0 text-[15px] font-extrabold">{t("products.ulip.projectionHeading")}</h3>
          <UlipChart scenarios={projection.scenarios} />
          <p className="m-0 mt-2 text-[12.5px] text-[#6F6A7C]">
            {tx(projection.note)}{" "}
            {t("products.ulip.totalCharges", {
              list: projection.scenarios
                .map((s) => t("products.ulip.chargeAt", { amount: formatINR(s.total_charges, { compact: true }), pct: s.gross_return_pct }))
                .join(", "),
            })}
          </p>
        </section>
      )}
      <PolicyFacts product={product} />
    </Modal>
  );
}
