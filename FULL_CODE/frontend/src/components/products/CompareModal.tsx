import { useI18n } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import { bestIds, coverOf, matchOf, monthlyOf } from "@/lib/compare";
import { paymentLabelT } from "@/lib/plan-config";
import type { MessageKey } from "@/i18n/en";
import type { PackProduct, ProductFit } from "@/types/api";
import { Modal } from "./Modal";

interface Props {
  fits: ProductFit[];
  selectedIds: string[];
  products: Record<string, PackProduct>;
  onCustomise: (fit: ProductFit) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const cell = "border-t border-[#E9E4FF] px-4 py-3 align-top text-[14.5px] leading-snug text-[#24212B]";
const head = "border-t border-[#E9E4FF] px-4 py-3 text-start align-top text-[12px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]";

/** Side-by-side comparison of up to three products, with the best value in each numeric row marked in words. */
export function CompareModal({ fits, selectedIds, products, onCustomise, onRemove, onClose }: Props) {
  const { t, tx } = useI18n();
  const cheapest = bestIds(fits, monthlyOf, false);
  const mostCover = bestIds(fits, coverOf, true);
  const bestMatch = bestIds(fits, matchOf, true);
  const flag = (ids: string[], id: string, text: string) =>
    ids.includes(id) ? (
      <span className="ms-2 rounded-md bg-[#E7F6F0] px-1.5 py-0.5 text-[11.5px] font-bold text-[#0B5E49]">{text}</span>
    ) : null;

  const rows: { label: MessageKey; render: (f: ProductFit, p: PackProduct | undefined) => React.ReactNode }[] = [
    { label: "products.compareModal.type", render: (f) => `${tx(f.product_type)} · ${tx(f.role)}` },
    {
      label: "products.compareModal.match",
      render: (f) =>
        f.eligible ? (
          <>
            {f.match_percent}%{flag(bestMatch, f.product_id, t("products.compareModal.bestMatch"))}
            <span className="block text-[12.5px] text-[#6F6A7C]">
              {t("products.compareModal.rulesModel", { rule: f.rule_percent, model: f.model_percent ?? "-" })}
            </span>
          </>
        ) : (
          t("products.compareModal.notAvailable")
        ),
    },
    {
      label: "products.compareModal.cover",
      render: (f) =>
        f.quote ? (
          <>
            {formatINR(f.quote.sum_assured, { compact: true })}
            {flag(mostCover, f.product_id, t("products.compareModal.mostCover"))}
          </>
        ) : (
          "-"
        ),
    },
    { label: "products.compareModal.term", render: (f) => (f.quote ? t("products.years", { count: f.quote.policy_term_years }) : "-") },
    { label: "products.compareModal.howYouPay", render: (f) => (f.quote ? paymentLabelT(t, f.quote.payment_option) : "-") },
    {
      label: "products.compareModal.price",
      render: (f) =>
        f.quote ? (
          <>
            {t(f.quote.payment_option === "single" ? "products.priceOnce" : "products.priceMonthly", {
              price: formatINR(f.quote.total_instalment),
            })}
            {flag(cheapest, f.product_id, t("products.compareModal.lowestPrice"))}
          </>
        ) : (
          "-"
        ),
    },
    { label: "products.compareModal.perYear", render: (f) => (f.quote ? formatINR(f.quote.total_annual_premium) : "-") },
    { label: "products.fact.ifYouDie", render: (_, p) => p?.death_benefit ?? "-" },
    { label: "products.fact.ifYouSurvive", render: (_, p) => p?.maturity_benefit ?? "-" },
    { label: "products.compareModal.riders", render: (_, p) => (p ? `${p.riders_allowed.length}` : "-") },
    { label: "products.fact.stoppingEarly", render: (_, p) => p?.surrender_and_lock_in ?? "-" },
    { label: "products.fact.notCovered", render: (_, p) => p?.key_exclusions ?? "-" },
    { label: "products.fact.medicalChecks", render: (_, p) => p?.medical_underwriting ?? "-" },
  ];

  return (
    <Modal title={t("products.compareModal.title")} onClose={onClose} wide>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className="w-36 px-4 py-3" />
              {fits.map((f) => (
                <th key={f.product_id} className="px-4 py-3 text-start align-top">
                  <div className="text-[17px] font-extrabold leading-snug text-[#24212B]">{f.product_name}</div>
                  {selectedIds.includes(f.product_id) && (
                    <span className="mt-1 inline-block rounded-md bg-[#E9E4FF] px-1.5 py-0.5 text-[11.5px] font-bold text-[#5B3BE6]">
                      {t("products.compareModal.yourSelection")}
                    </span>
                  )}
                  <div className="mt-2 flex gap-3 text-[13px] font-semibold">
                    {f.eligible && (
                      <button type="button" onClick={() => onCustomise(f)} className="text-[#7957FF] underline">
                        {t("products.customise")}
                      </button>
                    )}
                    <button type="button" onClick={() => onRemove(f.product_id)} className="text-[#6F6A7C] underline">
                      {t("products.compareModal.remove")}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className={head}>
                  {t(r.label)}
                </th>
                {fits.map((f) => (
                  <td key={f.product_id} className={cell}>
                    {r.render(f, products[f.product_id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-4 text-[13px] text-[#6F6A7C]">{t("products.compareModal.note")}</p>
    </Modal>
  );
}
