"use client";

import { useEffect, useState } from "react";
import { postJSON } from "@/lib/api";

/** POSTs `body` to `endpoint` 250 ms after it stops changing, ignoring answers that arrive late. */
export function useDebouncedPost<TBody, TResult>(endpoint: string, body: TBody | null) {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const key = body ? JSON.stringify(body) : "";

  useEffect(() => {
    if (!key) return;
    let stale = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the request as in flight
    setLoading(true);
    const timer = setTimeout(() => {
      postJSON<TResult>(endpoint, JSON.parse(key))
        .then((res) => {
          if (stale) return;
          setResult(res);
          setError(null);
        })
        .catch((e: Error) => !stale && setError(e.message))
        .finally(() => !stale && setLoading(false));
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [endpoint, key]);

  return { result, error, loading };
}
