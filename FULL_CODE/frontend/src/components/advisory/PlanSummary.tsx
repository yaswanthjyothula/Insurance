import Link from "next/link";
import type { SavedPlan } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { SUMMARY_HEADING_CLASS } from "@/components/advisory/styles";

export function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="m-0 text-[15px]">
      {rows.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-3 py-2 border-b border-[#D9D3E8] last:border-0">
          <dt className="text-[#5A5566]">{key}</dt>
          <dd className="m-0 font-bold text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The plans the customer kept, in two lines of numbers; an invitation to pick some when there are none. */
export function PlanSummary({ plan }: { plan: SavedPlan | null }) {
  return (
    <div>
      <h3 className={SUMMARY_HEADING_CLASS}>Your plan</h3>
      {plan && plan.items.length > 0 ? (
        <SummaryRows
          rows={[
            ["Plans", plan.items.map((item) => item.product_name).join(", ")],
            ["Total cover", formatINR(plan.total_cover, { compact: true })],
            ["Estimate", `≈ ${formatINR(plan.total_monthly)}/month`],
          ]}
        />
      ) : (
        <p className="m-0 text-[14.5px] text-[#5A5566]">
          No plan chosen yet. You can still book, or{" "}
          <Link href="/products" className="text-[#7957FF] font-semibold hover:underline">
            choose a plan first
          </Link>
          .
        </p>
      )}
    </div>
  );
}
