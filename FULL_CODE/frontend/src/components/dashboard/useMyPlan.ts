"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { saveMyPlan, type MyPlanData } from "@/lib/my-plan";
import { useAssessmentStore } from "@/store/assessment-store";
import type { Booking } from "@/types/api";
import { unsavedLocalWork } from "@/components/dashboard/dashboard-helpers";

interface MyPlanState {
  saved: MyPlanData | null;
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  removePlan: () => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

/** Loads the signed-in customer's saved plan and appointments, and moves anything done before sign-in into the account once. */
export function useMyPlan(): MyPlanState {
  const { result, selection, setSelection, isHydrated } = useAssessmentStore();
  const [saved, setSaved] = useState<MyPlanData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const migrationTried = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFromAPI<MyPlanData>("/my-plan"), fetchFromAPI<Booking[]>("/advisory/bookings")])
      .then(([plan, appointments]) => {
        if (cancelled) return;
        setSaved(plan);
        setBookings(appointments);
        setError(null);
      })
      .catch((failure: unknown) => !cancelled && setError(errorMessage(failure, "We couldn't load your plan. Please try again.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  useEffect(() => {
    if (!saved || !isHydrated || migrationTried.current) return;
    migrationTried.current = true;
    const patch = unsavedLocalWork(saved, result, selection);
    if (!patch) return;
    saveMyPlan(patch).then((ok) => {
      if (ok) setSaved((current) => ({ ...current, ...patch }));
      else setError("We couldn't save your earlier work to your account. Reload to try again.");
    });
  }, [saved, isHydrated, result, selection]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }, []);

  const removePlan = useCallback(async () => {
    try {
      await fetchFromAPI("/my-plan/choice", { method: "DELETE" });
      // The local selection goes too, otherwise the next visit would save the removed plan again.
      setSelection([]);
      setSaved((current) => (current ? { ...current, plan: undefined } : current));
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't remove your plan. Please try again."));
    }
  }, [setSelection]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const cancelled = await fetchFromAPI<Booking>(`/advisory/bookings/${bookingId}/cancel`, { method: "POST" });
      setBookings((current) => current.map((booking) => (booking.booking_id === bookingId ? cancelled : booking)));
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't cancel that appointment. Please try again."));
    }
  }, []);

  return { saved, bookings, loading, error, reload, removePlan, cancelBooking };
}
