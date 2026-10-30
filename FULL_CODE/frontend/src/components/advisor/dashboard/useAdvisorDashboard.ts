"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AdvisorDashboard } from "@/types/advisor";

interface DashboardState {
  data: AdvisorDashboard | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAdvisorDashboard(): DashboardState {
  const [data, setData] = useState<AdvisorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<AdvisorDashboard>("/advisor/dashboard", { signal: controller.signal })
      .then((dashboard) => {
        setData(dashboard);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, "We couldn't load your dashboard. Please try again."));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [reloadCount]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }, []);

  return { data, loading, error, reload };
}
