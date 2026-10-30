import { useCallback, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import type { SampleCustomer } from "@/types/api";
import type { SampleCustomerDetail } from "@/types/sample-customer";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export function filterCustomers(customers: SampleCustomer[], query: string): SampleCustomer[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return customers;
  return customers.filter((customer) =>
    [customer.full_name, customer.city, customer.occupation].some((text) => text.toLowerCase().includes(needle)),
  );
}

export const messageOf = (failure: unknown): string =>
  failure instanceof Error ? failure.message : "Something went wrong. Please try again.";

/** The synthetic customer list is fetched on first use, not on page load, so the form never waits for it. */
export function useSampleCustomers() {
  const [customers, setCustomers] = useState<SampleCustomer[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setCustomers(await fetchFromAPI<SampleCustomer[]>("/pack/customers"));
      setStatus("ready");
    } catch (failure) {
      setError(messageOf(failure));
      setStatus("error");
    }
  }, []);

  const loadDetail = useCallback(
    (profileId: string) => fetchFromAPI<SampleCustomerDetail>(`/pack/customers/${encodeURIComponent(profileId)}`),
    [],
  );

  return { customers, status, error, loadList, loadDetail };
}
