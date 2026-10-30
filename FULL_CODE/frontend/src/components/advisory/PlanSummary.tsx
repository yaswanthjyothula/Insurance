"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import type { SavedPlan } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { SUMMARY_HEADING_CLASS } from "@/components/advisory/styles";

export function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="m-0 text-[15px]">
      {rows.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-3 py-2 border-b border-[#D9D3E8] last:border-0">
          <dt className="text-[#5A5566]">{key}</dt>
          <dd className="m-0 font-bold text-end">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The plans the customer kept, in two lines of numbers; an invitation to pick some when there are none. */
export function PlanSummary({ plan }: { plan: SavedPlan | null }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 className={SUMMARY_HEADING_CLASS}>{t("advisory.plan.title")}</h3>
      {plan && plan.items.length > 0 ? (
        <SummaryRows
          rows={[
            [t("advisory.plan.plans"), plan.items.map((item) => item.product_name).join(", ")],
            [t("advisory.plan.totalCover"), formatINR(plan.total_cover, { compact: true })],
            [t("advisory.plan.estimate"), t("advisory.plan.perMonth", { amount: formatINR(plan.total_monthly) })],
          ]}
        />
      ) : (
        <p className="m-0 text-[14.5px] text-[#5A5566]">
          {t("advisory.plan.emptyBefore")}{" "}
          <Link href="/products" className="text-[#7957FF] font-semibold hover:underline">
            {t("advisory.plan.emptyLink")}
          </Link>
          {t("advisory.plan.emptyAfter")}
        </p>
      )}
    </div>
  );
}
