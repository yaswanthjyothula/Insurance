import { formatINR } from "@/lib/utils";
import type { SampleCustomer } from "@/types/api";

interface SampleCustomerListProps {
  customers: SampleCustomer[];
  pickingId: string | null;
  onPick: (customer: SampleCustomer) => void;
}

export function SampleCustomerList({ customers, pickingId, onPick }: SampleCustomerListProps) {
  if (customers.length === 0) return <p className="m-0 p-4 text-[15px] text-[#5A5566]">No sample customer matches that search.</p>;
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-2 overflow-y-auto max-h-[46vh]">
      {customers.map((customer) => (
        <li key={customer.profile_id}>
          <button
            type="button"
            disabled={pickingId !== null}
            onClick={() => onPick(customer)}
            className="w-full text-left p-3.5 rounded-xl border border-[#D9D3E8] bg-[#FFFFFF] hover:border-[#7957FF] disabled:opacity-60 transition-colors"
          >
            <span className="flex justify-between gap-3 text-[15.5px] font-bold">
              {customer.full_name}
              <span className="font-semibold text-[#7957FF]">{pickingId === customer.profile_id ? "Loading…" : `Age ${customer.age}`}</span>
            </span>
            <span className="block text-[13.5px] text-[#5A5566] mt-0.5">
              {customer.occupation}, {customer.city} · {formatINR(customer.annual_income, { compact: true })} a year ·{" "}
              {customer.risk_appetite} risk appetite
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
