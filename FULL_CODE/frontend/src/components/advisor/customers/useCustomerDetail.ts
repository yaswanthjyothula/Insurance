"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { CustomerDetail } from "@/types/advisor";

export function useCustomerDetail(id: string) {
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the request as in flight
    setLoading(true);
    fetchFromAPI<CustomerDetail>(`/advisor/customers/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setError(null);
        setNotFound(false);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setNotFound(failure instanceof ApiError && failure.status === 404);
        setError(errorMessage(failure, "We couldn't load this customer. Please try again."));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [id, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { data, loading, error, notFound, reload };
}
