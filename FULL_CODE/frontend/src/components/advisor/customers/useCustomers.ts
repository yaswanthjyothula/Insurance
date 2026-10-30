"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { toSearchParams, type CustomerQuery } from "@/components/advisor/customers/customer-query";
import type { CustomerPage } from "@/types/advisor";

export function useCustomers(query: CustomerQuery) {
  const [data, setData] = useState<CustomerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const key = toSearchParams(query);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the request as in flight
    setLoading(true);
    fetchFromAPI<CustomerPage>(`/advisor/customers?${key}`, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, "We couldn't load your customers. Please try again."));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [key, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { data, loading, error, reload };
}
