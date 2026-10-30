"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AdvisorOut, Availability } from "@/types/api";

interface AvailabilityState {
  advisors: AdvisorOut[];
  calendarNote: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAdvisorAvailability(): AvailabilityState {
  const [advisors, setAdvisors] = useState<AdvisorOut[]>([]);
  const [calendarNote, setCalendarNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFromAPI<Availability>("/advisory/availability")
      .then((data) => {
        if (cancelled) return;
        setAdvisors(data.advisors);
        setCalendarNote(data.calendar_note ?? null);
        setError(null);
      })
      .catch(
        (failure: unknown) => !cancelled && setError(errorMessage(failure, "We couldn't load advisor availability. Please try again.")),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }, []);

  return { advisors, calendarNote, loading, error, reload };
}
