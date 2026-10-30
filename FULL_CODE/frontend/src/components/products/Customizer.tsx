"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";
import { MODE_LABELS, paymentLabel, requestFromFit, riderCoverLimit, toggleRider } from "@/lib/plan-config";
import { useDebouncedPost } from "@/hooks/useDebouncedRequest";
import type { Applicant, PackProduct, PackRider, PayMode, ProductFit, Quote, QuoteRequest, RiderChoice, SelectedPlan } from "@/types/api";
import { Modal } from "./Modal";
import { QuotePanel } from "./QuotePanel";

const field = "mt-1.5 h-11 w-full rounded-lg border border-[#D9D3E8] bg-white px-3 text-[15px] font-semibold text-[#24212B]";
const label = "text-[13px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]";

interface Props {
  fit: ProductFit;
  product: PackProduct;
  riders: PackRider[];
  applicant: Applicant;
  onSave: (plan: SelectedPlan) => void;
  onClose: () => void;
}

const nearest = (options: number[], wanted: number) =>
  options.reduce((best, t) => (Math.abs(t - wanted) < Math.abs(best - wanted) ? t : best), options[0]);

/** Term, Whole Life and Endowment: sliders and choices that reprice live. */
export function Customizer({ fit, product, riders, applicant, onSave, onClose }: Props) {
  const start = fit.quote as Quote;
  const step = product.sum_assured_step_inr ?? 100_000;
  const lowest = product.min_sum_assured_inr ?? step;
  const highest = Math.min(product.max_sum_assured_inr ?? Infinity, start.max_sum_assured_for_applicant ?? Infinity);
  const toEnd = product.variant.includes("whole_life");

  const [sa, setSa] = useState(start.sum_assured);
  const [chosenTerm, setTerm] = useState(start.policy_term_years);
  const [option, setOption] = useState(start.payment_option);
  const [mode, setMode] = useState<PayMode>("monthly");
  const [riderPicks, setRiderPicks] = useState<RiderChoice[]>([]);
  const [riderCover, setRiderCover] = useState<Record<string, number>>({});

  // Changing the payment option can leave the chosen term unavailable, so the closest term offered is used instead
  const [allowed, setAllowed] = useState<number[]>([]);
  const term = !toEnd && allowed.length && !allowed.includes(chosenTerm) ? nearest(allowed, chosenTerm) : chosenTerm;

  const request: QuoteRequest = useMemo(
    () => ({
      ...requestFromFit(fit, applicant, mode),
      sum_assured: sa,
      policy_term_years: term,
      payment_option: option,
      riders: riderPicks,
    }),
    [fit, applicant, mode, sa, term, option, riderPicks],
  );
  const { result: quote, error, loading } = useDebouncedPost<QuoteRequest, Quote>("/quotes", request);

  const terms = quote?.allowed_terms ?? [];
  if (terms.length && terms.join() !== allowed.join()) setAllowed(terms);

  const single = option === "single";
  const save = () => quote?.valid && onSave({ request, quote, fit_summary: fit.reason });

  return (
    <Modal title={`Customise ${product.product_name}`} onClose={onClose}>
      <p className="m-0 mb-5 text-[15px] text-[#4A4553]">{product.plain_language_summary}</p>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between">
              <label htmlFor="sa" className={label}>
                Cover
              </label>
              <span className="font-extrabold text-[#7957FF]">{formatINR(sa, { compact: true })}</span>
            </div>
            <input
              id="sa"
              type="range"
              min={lowest}
              max={highest}
              step={step}
              value={sa}
              onChange={(e) => setSa(Number(e.target.value))}
              className="mt-2 w-full accent-[#7957FF]"
            />
            <p className="m-0 text-[12.5px] text-[#6F6A7C]">
              Between {formatINR(lowest, { compact: true })} and {formatINR(highest, { compact: true })}. The top is set by your income and
              existing cover.
            </p>
          </div>
          <div>
            <label htmlFor="term" className={label}>
              Policy term
            </label>
            {toEnd ? (
              <p className="m-0 mt-2 font-bold">Cover to age {applicant.age + start.policy_term_years}</p>
            ) : (
              <select id="term" className={field} value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                {(terms.length ? terms : [term]).map((t) => (
                  <option key={t} value={t}>
                    {t} years (to age {applicant.age + t})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="option" className={label}>
              How you pay
            </label>
            <select id="option" className={field} value={option} onChange={(e) => setOption(e.target.value)}>
              {product.premium_payment_options.map((o) => (
                <option key={o} value={o}>
                  {paymentLabel(o)}
                </option>
              ))}
            </select>
          </div>
          {!single && (
            <div>
              <label htmlFor="mode" className={label}>
                How often
              </label>
              <select id="mode" className={field} value={mode} onChange={(e) => setMode(e.target.value as PayMode)}>
                {product.premium_modes.map((m) => (
                  <option key={m} value={m}>
                    {MODE_LABELS[m as PayMode]}
                  </option>
                ))}
              </select>
            </div>
          )}
          {riders.length > 0 && (
            <fieldset className="m-0 border-0 p-0">
              <legend className={label}>Add-on riders</legend>
              {single && <p className="m-0 mt-1 text-[13px] text-[#6F6A7C]">Riders cannot be added when you pay once.</p>}
              <div className="mt-2 flex flex-col gap-2.5">
                {riders.map((r) => {
                  const picked = riderPicks.some((p) => p.rider_id === r.rider_id);
                  const perThousand = r.rate_basis === "per_1000_rider_sa";
                  const max = riderCoverLimit(r.max_rider_sa_inr, r.max_rider_sa_pct_of_base_sa, sa);
                  const min = r.min_rider_sa_inr ?? 100_000;
                  const value = Math.min(Math.max(riderCover[r.rider_id] ?? min, min), Math.max(min, max));
                  return (
                    <div key={r.rider_id} className="rounded-xl border border-[#D9D3E8] p-3">
                      <label className="flex cursor-pointer items-start gap-2.5 text-[14px] font-semibold">
                        <input
                          type="checkbox"
                          disabled={single}
                          checked={picked}
                          onChange={() => setRiderPicks((p) => toggleRider(p, r.rider_id, perThousand ? value : null))}
                          className="mt-1 h-4 w-4 accent-[#7957FF]"
                        />
                        <span>
                          {r.rider_name}
                          <span className="block text-[12.5px] font-normal text-[#6F6A7C]">{r.benefit}</span>
                        </span>
                      </label>
                      {picked && perThousand && max >= min && (
                        <div className="mt-2 pl-6">
                          <div className="flex justify-between text-[13px]">
                            <span>Rider cover</span>
                            <strong>{formatINR(value, { compact: true })}</strong>
                          </div>
                          <input
                            type="range"
                            aria-label={`${r.rider_name} cover`}
                            min={min}
                            max={max}
                            step={100_000}
                            value={value}
                            className="w-full accent-[#7957FF]"
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setRiderCover((c) => ({ ...c, [r.rider_id]: next }));
                              setRiderPicks((p) => p.map((x) => (x.rider_id === r.rider_id ? { ...x, sum_assured: next } : x)));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>
        <div className="flex flex-col gap-4 md:sticky md:top-4 md:self-start">
          <QuotePanel quote={quote} loading={loading} error={error} />
          <button
            type="button"
            onClick={save}
            disabled={!quote?.valid}
            className="h-12 rounded-lg bg-[#7957FF] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to my selection
          </button>
        </div>
      </div>
      <PolicyFacts product={product} />
    </Modal>
  );
}

export function PolicyFacts({ product }: { product: PackProduct }) {
  const rows: [string, string][] = [
    ["If you die", product.death_benefit],
    ["If you survive", product.maturity_benefit],
    ["Key features", product.key_features],
    ["Not covered", product.key_exclusions],
    ["Stopping early", product.surrender_and_lock_in],
    ["Medical checks", product.medical_underwriting],
  ];
  return (
    <details className="mt-6 rounded-2xl border border-[#D9D3E8] p-4">
      <summary className="cursor-pointer font-bold text-[#7957FF]">What this policy pays and excludes</summary>
      <dl className="m-0 mt-3 flex flex-col gap-3 text-[14px]">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">{k}</dt>
              <dd className="m-0 mt-0.5 leading-snug">{v}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}
