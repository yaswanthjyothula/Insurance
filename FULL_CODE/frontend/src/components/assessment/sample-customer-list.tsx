import { useI18n } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";
import type { MessageKey } from "@/i18n/en";
import type { SampleCustomer } from "@/types/api";

interface SampleCustomerListProps {
  customers: SampleCustomer[];
  pickingId: string | null;
  onPick: (customer: SampleCustomer) => void;
}

const RISK_KEYS: Record<string, MessageKey> = {
  low: "assessment.sample.riskLow",
  medium: "assessment.sample.riskMedium",
  high: "assessment.sample.riskHigh",
};

export function SampleCustomerList({ customers, pickingId, onPick }: SampleCustomerListProps) {
  const { t } = useI18n();
  if (customers.length === 0) return <p className="m-0 p-4 text-[15px] text-[#5A5566]">{t("assessment.sample.noMatch")}</p>;
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-2 overflow-y-auto max-h-[46vh]">
      {customers.map((customer) => (
        <li key={customer.profile_id}>
          <button
            type="button"
            disabled={pickingId !== null}
            onClick={() => onPick(customer)}
            className="w-full text-start p-3.5 rounded-xl border border-[#D9D3E8] bg-[#FFFFFF] hover:border-[#7957FF] disabled:opacity-60 transition-colors"
          >
            <span className="flex justify-between gap-3 text-[15.5px] font-bold">
              {customer.full_name}
              <span className="font-semibold text-[#7957FF]">
                {pickingId === customer.profile_id ? t("common.loading") : t("assessment.sample.age", { age: customer.age })}
              </span>
            </span>
            <span className="block text-[13.5px] text-[#5A5566] mt-0.5">
              {t("assessment.sample.details", {
                occupation: customer.occupation,
                city: customer.city,
                income: formatINR(customer.annual_income, { compact: true }),
                risk: RISK_KEYS[customer.risk_appetite] ? t(RISK_KEYS[customer.risk_appetite]) : customer.risk_appetite,
              })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
