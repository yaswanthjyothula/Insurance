"use client";

import { useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { indicativePremiumPath, type IndicativePremiumParams, type IndicativePremiumResponse } from "@/lib/indicative-premium";

const DEBOUNCE_MS = 300;

interface Settled {
  path: string;
  annualPremium: number | null;
  error: string | null;
}

export interface IndicativePremium {
  /** Last premium the server returned. Null when none yet, or when cover is not offered at this age. */
  annualPremium: number | null;
  /** True while the inputs have changed and the matching answer has not arrived. */
  loading: boolean;
  error: string | null;
}

/**
 * Plain level-term premium from the Saffron Life rate table, re-requested 300ms after the inputs stop changing.
 * A late answer for older inputs is dropped, so a slow request can never overwrite a newer one.
 */
export function useIndicativePremium(params: IndicativePremiumParams): IndicativePremium {
  const path = indicativePremiumPath(params);
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetchFromAPI<IndicativePremiumResponse>(path);
        if (!stale) setSettled({ path, annualPremium: response.available ? response.annual_premium : null, error: null });
      } catch (error) {
        if (!stale)
          setSettled({ path, annualPremium: null, error: error instanceof Error ? error.message : "The premium could not be loaded." });
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [path]);

  const isCurrent = settled?.path === path;
  return {
    annualPremium: settled?.annualPremium ?? null,
    loading: !isCurrent,
    error: isCurrent ? settled.error : null,
  };
}
