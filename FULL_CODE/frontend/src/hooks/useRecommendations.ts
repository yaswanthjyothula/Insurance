"use client";

import { useCallback, useEffect, useState } from "react";
import { postJSON } from "@/lib/api";
import type { Priority, RecommendRequest, RecommendResponse } from "@/types/api";

/** Asks the engine for products. Re-runs when the answers or the chosen priority change. */
export function useRecommendations(base: RecommendRequest | null, priority: Priority) {
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = base ? JSON.stringify(base) : "";

  useEffect(() => {
    if (!key) return;
    let stale = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the loading state before the request starts
    setLoading(true);
    setError(null);
    postJSON<RecommendResponse>("/recommendations", { ...(JSON.parse(key) as RecommendRequest), priority })
      .then((res) => !stale && setData(res))
      .catch((e: Error) => !stale && setError(e.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [key, priority, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, loading, error, retry };
}
