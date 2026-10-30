import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import type { SavedPlan, SavedPlanItem } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { humaniseTag } from "@/lib/text";
import { CARD_CLASS, PRIMARY_LINK_CLASS, SECONDARY_LINK_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { formatSavedDate, instalmentPeriod } from "@/components/dashboard/dashboard-helpers";

function PlanItemCard({ item }: { item: SavedPlanItem }) {
  const facts: [string, string][] = [
    ["Cover", formatINR(item.sum_assured, { compact: true })],
    ["Term", `${item.policy_term_years} years`],
    ["Payment", humaniseTag(item.payment_option)],
    ["Cost", `${formatINR(item.total_instalment)} ${instalmentPeriod(item)}`],
  ];
  return (
    <li className="rounded-2xl border border-[#D9D3E8] p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-[19px] font-extrabold tracking-[-0.02em] text-[#24212B]">{item.product_name}</h3>
        <span className="rounded-full bg-[#E9E4FF] px-3 py-1 text-[12.5px] font-bold text-[#7957FF]">{item.product_type}</span>
      </div>
      <dl className="m-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {facts.map(([key, value]) => (
          <div key={key} className="rounded-xl bg-[#FAF9F6] border border-[#E9E4FF] px-4 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">{key}</dt>
            <dd className="m-0 mt-0.5 text-[16px] font-extrabold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 text-[14px] text-[#5A5566]">Riders: {item.rider_names.length > 0 ? item.rider_names.join(", ") : "none"}</p>
    </li>
  );
}

interface SavedPlanCardProps {
  plan: SavedPlan | undefined;
  hasAssessment: boolean;
  onRemove: () => void;
}

export function SavedPlanCard({ plan, hasAssessment, onRemove }: SavedPlanCardProps) {
  return (
    <section className={CARD_CLASS} aria-label="Chosen plan">
      <h2 className={SECTION_HEADING_CLASS}>2. Your chosen plan</h2>
      {plan && plan.items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-4">
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {plan.items.map((item) => (
              <PlanItemCard key={item.product_id} item={item} />
            ))}
          </ul>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="m-0 text-[16px] font-bold text-[#24212B]">
              Total: {formatINR(plan.total_cover, { compact: true })} cover, about {formatINR(plan.total_monthly)} a month
            </p>
            <span className="text-[13px] text-[#6F6A7C]">Saved {formatSavedDate(plan.saved_at)}</span>
          </div>
          <p className="m-0 text-[13px] text-[#6F6A7C]">These figures are estimates. Only the insurer can give an exact price.</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/advisory" className={PRIMARY_LINK_CLASS}>
              Talk to an advisor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className={SECONDARY_LINK_CLASS}>
              Change plan
            </Link>
            <button
              type="button"
              onClick={onRemove}
              className="h-11 px-4 rounded-lg text-[#C23B3B] font-semibold inline-flex items-center gap-1.5 hover:bg-[#FDECEF]"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[16px] text-[#5A5566]">
            {hasAssessment
              ? "You haven't chosen a plan yet. Compare plans matched to your cover need."
              : "Work out your cover need first, then compare plans."}
          </p>
          <Link href={hasAssessment ? "/products" : "/assessment"} className={PRIMARY_LINK_CLASS}>
            {hasAssessment ? "See matched plans" : "Start the assessment"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
