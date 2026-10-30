import { describe, expect, it } from "vitest";
import { dateInDays, dueLabel, validateDraft } from "@/components/advisor/followups/followup-helpers";

describe("dueLabel", () => {
  it("speaks plainly about when a task is due", () => {
    expect(dueLabel({ days_until_due: 0, status: "open" })).toBe("Due today");
    expect(dueLabel({ days_until_due: 1, status: "open" })).toBe("Due tomorrow");
    expect(dueLabel({ days_until_due: 5, status: "open" })).toBe("Due in 5 days");
    expect(dueLabel({ days_until_due: -1, status: "open" })).toBe("1 day overdue");
    expect(dueLabel({ days_until_due: -4, status: "open" })).toBe("4 days overdue");
  });

  it("does not call a finished task overdue", () => {
    expect(dueLabel({ days_until_due: -9, status: "done" })).toBe("Done");
  });
});

describe("dateInDays", () => {
  it("adds days across month ends", () => {
    expect(dateInDays(3, new Date(2026, 9, 30))).toBe("2026-11-02");
    expect(dateInDays(0, new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("validateDraft", () => {
  const ok = { title: "Call back", note: "", due_date: "2026-11-02", priority: "medium" as const, profile_id: "" };
  it("accepts a complete draft", () => expect(validateDraft(ok)).toEqual({}));
  it("flags a blank title and a missing date", () => {
    expect(Object.keys(validateDraft({ ...ok, title: "  ", due_date: "" }))).toEqual(["title", "due_date"]);
  });
});
