import { describe, expect, it } from "vitest";
import { groupByDay, howItWorks, relativeStart } from "@/components/advisor/appointments/appointment-time";
import type { AppointmentSummary } from "@/types/advisor";

const item = (id: string, start: string): AppointmentSummary => ({
  booking_id: id,
  customer_name: "A",
  slot_start: start,
  slot_end: start,
  slot_label: "",
  consultation_mode: "video",
  status: "confirmed",
  phase: "upcoming",
  outcome: null,
  outcome_at: null,
  starts_in_minutes: 60,
  cancelled_by: "",
  message_count: 0,
  last_message_preview: null,
  last_message_at: null,
  simulated: true,
});

describe("relativeStart", () => {
  it("speaks in the largest sensible unit", () => {
    expect(relativeStart(45)).toBe("in 45 minutes");
    expect(relativeStart(60)).toBe("in 1 hour");
    expect(relativeStart(180)).toBe("in 3 hours");
    expect(relativeStart(2880)).toBe("in 2 days");
  });

  it("says when something has already started", () => {
    expect(relativeStart(-30)).toBe("started 30 minutes ago");
  });
});

describe("howItWorks", () => {
  it("tells each side what happens at the time", () => {
    expect(howItWorks("video", "advisor")).toMatch(/join link opens 10 minutes before/);
    expect(howItWorks("phone", "advisor")).toMatch(/You call the customer/);
    expect(howItWorks("phone", "customer")).toMatch(/advisor calls your mobile/);
    expect(howItWorks("chat", "customer")).toMatch(/chat here/);
  });
});

describe("groupByDay", () => {
  it("puts same-day appointments together", () => {
    const groups = groupByDay([item("a", "2026-11-02T10:00:00"), item("b", "2026-11-02T15:00:00"), item("c", "2026-11-03T09:00:00")]);
    expect(groups.map((g) => g.items.length)).toEqual([2, 1]);
    expect(groups[0].date).toBe("2026-11-02");
  });
});
