import { formatINR } from "@/lib/utils";
import { bestIds, coverOf, matchOf, monthlyOf } from "@/lib/compare";
import { paymentLabel } from "@/lib/plan-config";
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
const head = "border-t border-[#E9E4FF] px-4 py-3 text-left align-top text-[12px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]";

/** Side-by-side comparison of up to three products, with the best value in each numeric row marked in words. */
export function CompareModal({ fits, selectedIds, products, onCustomise, onRemove, onClose }: Props) {
  const cheapest = bestIds(fits, monthlyOf, false);
  const mostCover = bestIds(fits, coverOf, true);
  const bestMatch = bestIds(fits, matchOf, true);
  const flag = (ids: string[], id: string, text: string) =>
    ids.includes(id) ? (
      <span className="ml-2 rounded-md bg-[#E7F6F0] px-1.5 py-0.5 text-[11.5px] font-bold text-[#0B5E49]">{text}</span>
    ) : null;

  const rows: { label: string; render: (f: ProductFit, p: PackProduct | undefined) => React.ReactNode }[] = [
    { label: "Type", render: (f) => `${f.product_type} · ${f.role}` },
    {
      label: "Match for you",
      render: (f) =>
        f.eligible ? (
          <>
            {f.match_percent}%{flag(bestMatch, f.product_id, "Best match")}
            <span className="block text-[12.5px] text-[#6F6A7C]">
              rules {f.rule_percent}% · model {f.model_percent ?? "-"}%
            </span>
          </>
        ) : (
          "Not available"
        ),
    },
    {
      label: "Cover",
      render: (f) =>
        f.quote ? (
          <>
            {formatINR(f.quote.sum_assured, { compact: true })}
            {flag(mostCover, f.product_id, "Most cover")}
          </>
        ) : (
          "-"
        ),
    },
    { label: "Policy term", render: (f) => (f.quote ? `${f.quote.policy_term_years} years` : "-") },
    { label: "How you pay", render: (f) => (f.quote ? paymentLabel(f.quote.payment_option) : "-") },
    {
      label: "Price",
      render: (f) =>
        f.quote ? (
          <>
            {formatINR(f.quote.total_instalment)}
            {f.quote.payment_option === "single" ? " once" : " / month"}
            {flag(cheapest, f.product_id, "Lowest price")}
          </>
        ) : (
          "-"
        ),
    },
    { label: "Per year", render: (f) => (f.quote ? formatINR(f.quote.total_annual_premium) : "-") },
    { label: "If you die", render: (_, p) => p?.death_benefit ?? "-" },
    { label: "If you survive", render: (_, p) => p?.maturity_benefit ?? "-" },
    { label: "Riders on offer", render: (_, p) => (p ? `${p.riders_allowed.length}` : "-") },
    { label: "Stopping early", render: (_, p) => p?.surrender_and_lock_in ?? "-" },
    { label: "Not covered", render: (_, p) => p?.key_exclusions ?? "-" },
    { label: "Medical checks", render: (_, p) => p?.medical_underwriting ?? "-" },
  ];

  return (
    <Modal title="Compare plans" onClose={onClose} wide>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className="w-36 px-4 py-3" />
              {fits.map((f) => (
                <th key={f.product_id} className="px-4 py-3 text-left align-top">
                  <div className="text-[17px] font-extrabold leading-snug text-[#24212B]">{f.product_name}</div>
                  {selectedIds.includes(f.product_id) && (
                    <span className="mt-1 inline-block rounded-md bg-[#E9E4FF] px-1.5 py-0.5 text-[11.5px] font-bold text-[#5B3BE6]">
                      Your selection
                    </span>
                  )}
                  <div className="mt-2 flex gap-3 text-[13px] font-semibold">
                    {f.eligible && (
                      <button type="button" onClick={() => onCustomise(f)} className="text-[#7957FF] underline">
                        Customise
                      </button>
                    )}
                    <button type="button" onClick={() => onRemove(f.product_id)} className="text-[#6F6A7C] underline">
                      Remove
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
                  {r.label}
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
      <p className="m-0 mt-4 text-[13px] text-[#6F6A7C]">
        Plans you selected show your chosen cover, term and payment; others show the suggested set-up. Saffron Life is fictional, so these
        are not real quotes.
      </p>
    </Modal>
  );
}
