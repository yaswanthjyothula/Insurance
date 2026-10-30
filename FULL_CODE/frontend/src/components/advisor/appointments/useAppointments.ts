"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AppointmentDetail, AppointmentSummary } from "@/types/advisor";

export type Scope = "upcoming" | "past" | "cancelled";

export function useAppointments(scope: Scope) {
  const [data, setData] = useState<AppointmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<AppointmentSummary[]>(`/advisor/appointments?scope=${scope}`, { signal: controller.signal })
      .then((rows) => {
        setData(rows);
        setError(null);
      })
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load your appointments.")));
    return () => controller.abort();
  }, [scope, reloadCount]);

  const reload = useCallback(() => {
    setData(null);
    setReloadCount((n) => n + 1);
  }, []);
  return { data, error, reload };
}

export function useAppointment(id: string) {
  const [data, setData] = useState<AppointmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<AppointmentDetail>(`/advisor/appointments/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((detail) => {
        setData(detail);
        setError(null);
        setNotFound(false);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        setNotFound(failure instanceof ApiError && failure.status === 404);
        setError(errorMessage(failure, "We couldn't load this appointment."));
      });
    return () => controller.abort();
  }, [id, reloadCount]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);
  return { data, setData, error, notFound, reload };
}
