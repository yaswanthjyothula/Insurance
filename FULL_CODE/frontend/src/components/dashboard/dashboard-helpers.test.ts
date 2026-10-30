import { describe, expect, it } from "vitest";
import type { Booking, SelectedPlan } from "@/types/api";
import type { SavedPlanItem } from "@/lib/my-plan";
import { formatSavedDate, instalmentPeriod, splitBookings, unsavedLocalWork } from "@/components/dashboard/dashboard-helpers";

const booking = (id: string, start: string, status: string): Booking => ({
  booking_id: id,
  advisor_id: "ADV-1",
  advisor_name: "Suresh Nair",
  slot_id: `SLT-${id}`,
  slot_start: start,
  slot_label: start,
  status,
  consultation_mode: "video",
  meeting_link: "",
  created_at: "2026-10-30T09:00:00",
});

const item = (overrides: Partial<SavedPlanItem>): SavedPlanItem => ({
  product_id: "P1",
  product_name: "Term Plan",
  product_type: "Term Life",
  sum_assured: 1_00_00_000,
  policy_term_years: 30,
  payment_option: "regular",
  mode: "monthly",
  total_instalment: 1200,
  total_annual_premium: 14400,
  rider_names: [],
  ...overrides,
});

describe("splitBookings", () => {
  it("separates cancelled bookings and orders each group by start time", () => {
    const { upcoming, cancelled } = splitBookings([
      booking("b", "2026-11-02T10:00:00", "confirmed"),
      booking("x", "2026-11-01T10:00:00", "cancelled"),
      booking("a", "2026-11-01T09:00:00", "confirmed"),
    ]);
    expect(upcoming.map((b) => b.booking_id)).toEqual(["a", "b"]);
    expect(cancelled.map((b) => b.booking_id)).toEqual(["x"]);
  });
});

describe("instalmentPeriod", () => {
  it("names the billing period", () => {
    expect(instalmentPeriod(item({ mode: "monthly" }))).toBe("per month");
    expect(instalmentPeriod(item({ mode: "half_yearly" }))).toBe("per half-year");
  });

  it("says one time for single-premium plans", () => {
    expect(instalmentPeriod(item({ payment_option: "single", mode: "annual" }))).toBe("one time");
  });
});

describe("unsavedLocalWork", () => {
  const selection = [
    {
      quote: {
        riders: [],
        product_id: "P1",
        product_name: "Term Plan",
        product_type: "Term Life",
        sum_assured: 100,
        policy_term_years: 10,
        payment_option: "regular",
        mode: "monthly",
        total_instalment: 10,
        total_annual_premium: 120,
      },
    },
  ] as unknown as SelectedPlan[];

  it("returns null when there is nothing local to save", () => {
    expect(unsavedLocalWork({}, null, [])).toBeNull();
  });

  it("returns null when the account already has the plan", () => {
    const saved = { plan: { items: [], total_monthly: 0, total_cover: 0, saved_at: "" } };
    expect(unsavedLocalWork(saved, null, selection)).toBeNull();
  });

  it("saves a local selection the account lacks", () => {
    const patch = unsavedLocalWork({}, null, selection);
    expect(patch?.plan?.items).toHaveLength(1);
    expect(patch?.assessment).toBeUndefined();
  });
});

describe("formatSavedDate", () => {
  it("returns an empty string for an unreadable date", () => {
    expect(formatSavedDate("not a date")).toBe("");
  });

  it("formats a valid ISO date", () => {
    expect(formatSavedDate("2026-10-30T09:00:00")).toContain("2026");
  });
});
