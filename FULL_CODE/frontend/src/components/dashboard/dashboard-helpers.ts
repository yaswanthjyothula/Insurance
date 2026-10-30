import type { Booking, SelectedPlan } from "@/types/api";
import type { AssessmentResult } from "@/types/assessment";
import {
  summariseAssessment,
  summariseSelection,
  type MyPlanData,
  type SavedAssessment,
  type SavedPlan,
  type SavedPlanItem,
} from "@/lib/my-plan";

export interface PlanPatch {
  assessment?: SavedAssessment;
  plan?: SavedPlan;
}

const PERIOD_LABEL: Record<string, string> = { annual: "year", half_yearly: "half-year", quarterly: "quarter", monthly: "month" };

/**
 * Work done in this browser (before signing in, or on another device's account) that the account doesn't hold yet.
 * Returns null when there is nothing to save, so callers can skip the request.
 */
export function unsavedLocalWork(saved: MyPlanData, result: AssessmentResult | null, selection: SelectedPlan[]): PlanPatch | null {
  const patch: PlanPatch = {};
  if (!saved.assessment && result) patch.assessment = summariseAssessment(result);
  if (!saved.plan && selection.length > 0) patch.plan = summariseSelection(selection);
  return patch.assessment || patch.plan ? patch : null;
}

export function splitBookings(bookings: Booking[]): { upcoming: Booking[]; cancelled: Booking[] } {
  const byStart = (a: Booking, b: Booking) => a.slot_start.localeCompare(b.slot_start);
  return {
    upcoming: bookings.filter((booking) => booking.status !== "cancelled").sort(byStart),
    cancelled: bookings.filter((booking) => booking.status === "cancelled").sort(byStart),
  };
}

/** "1,200 per month", or one-time for a single-premium plan. */
export function instalmentPeriod(item: SavedPlanItem): string {
  if (item.payment_option === "single") return "one time";
  return `per ${PERIOD_LABEL[item.mode] ?? item.mode}`;
}

export function formatSavedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
