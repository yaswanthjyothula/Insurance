"use client";

import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import type { SavedPlan, SavedPlanItem } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { humaniseTag } from "@/lib/text";
import { CARD_CLASS, PRIMARY_LINK_CLASS, SECONDARY_LINK_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { instalmentPeriod } from "@/components/dashboard/dashboard-helpers";
import { formatDate } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";

const COST_KEY: Record<string, MessageKey> = {
  annual: "account.plan.costYear",
  half_yearly: "account.plan.costHalfYear",
  quarterly: "account.plan.costQuarter",
  monthly: "account.plan.costMonth",
};

function PlanItemCard({ item }: { item: SavedPlanItem }) {
  const { t } = useI18n();
  const amount = formatINR(item.total_instalment);
  const costKey = item.payment_option === "single" ? "account.plan.costOneTime" : COST_KEY[item.mode];
  const facts: [MessageKey, string][] = [
    ["account.plan.factCover", formatINR(item.sum_assured, { compact: true })],
    ["account.plan.factTerm", t("account.plan.termYears", { count: item.policy_term_years })],
    ["account.plan.factPayment", humaniseTag(item.payment_option)],
    ["account.plan.factCost", costKey ? t(costKey, { amount }) : `${amount} ${instalmentPeriod(item)}`],
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
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">{t(key)}</dt>
            <dd className="m-0 mt-0.5 text-[16px] font-extrabold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 text-[14px] text-[#5A5566]">
        {item.rider_names.length > 0 ? t("account.plan.ridersList", { riders: item.rider_names.join(", ") }) : t("account.plan.ridersNone")}
      </p>
    </li>
  );
}

interface SavedPlanCardProps {
  plan: SavedPlan | undefined;
  hasAssessment: boolean;
  onRemove: () => void;
}

export function SavedPlanCard({ plan, hasAssessment, onRemove }: SavedPlanCardProps) {
  const { t, lang } = useI18n();
  return (
    <section className={CARD_CLASS} aria-label={t("account.plan.label")}>
      <h2 className={SECTION_HEADING_CLASS}>{t("account.plan.heading")}</h2>
      {plan && plan.items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-4">
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {plan.items.map((item) => (
              <PlanItemCard key={item.product_id} item={item} />
            ))}
          </ul>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="m-0 text-[16px] font-bold text-[#24212B]">
              {t("account.plan.total", { cover: formatINR(plan.total_cover, { compact: true }), monthly: formatINR(plan.total_monthly) })}
            </p>
            <span className="text-[13px] text-[#6F6A7C]">{t("account.plan.saved", { date: formatDate(lang, plan.saved_at) })}</span>
          </div>
          <p className="m-0 text-[13px] text-[#6F6A7C]">{t("account.plan.estimates")}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/advisory" className={PRIMARY_LINK_CLASS}>
              {t("account.plan.talk")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className={SECONDARY_LINK_CLASS}>
              {t("account.plan.change")}
            </Link>
            <button
              type="button"
              onClick={onRemove}
              className="h-11 px-4 rounded-lg text-[#C23B3B] font-semibold inline-flex items-center gap-1.5 hover:bg-[#FDECEF]"
            >
              <Trash2 className="w-4 h-4" />
              {t("account.plan.remove")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[16px] text-[#5A5566]">
            {hasAssessment ? t("account.plan.emptyWithAssessment") : t("account.plan.emptyNoAssessment")}
          </p>
          <Link href={hasAssessment ? "/products" : "/assessment"} className={PRIMARY_LINK_CLASS}>
            {hasAssessment ? t("account.plan.seeMatched") : t("account.need.start")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
