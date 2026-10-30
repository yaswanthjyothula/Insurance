"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { FollowUp } from "@/types/advisor";

export type FollowUpScope = "open" | "overdue" | "done";

export function useFollowUps(scope: FollowUpScope) {
  const [items, setItems] = useState<FollowUp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<FollowUp[]>(`/advisor/follow-ups?scope=${scope}`, { signal: controller.signal })
      .then((rows) => {
        setItems(rows);
        setError(null);
      })
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load your follow-ups.")));
    return () => controller.abort();
  }, [scope, reloadCount]);

  const reload = useCallback(() => {
    setItems(null);
    setReloadCount((n) => n + 1);
  }, []);
  return { items, error, reload };
}
