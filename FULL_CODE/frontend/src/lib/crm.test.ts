import { describe, expect, it } from "vitest";
import { ageLabel, moveCard, pct } from "@/lib/crm";
import type { LeadCard, Stage } from "@/types/admin";

const card = (id: string, stage: Stage, cover: number | null): LeadCard => ({
  lead_id: id,
  name: id,
  customer_id: "",
  contact: "",
  source: "manual",
  stage,
  owner_advisor_id: null,
  owner_name: null,
  cover_needed: cover,
  annual_premium: null,
  created_at: "",
  updated_at: "",
  days_in_stage: 5,
  note_count: 0,
});
const board = () => [
  { key: "new" as Stage, count: 2, cover_total: 300, leads: [card("a", "new", 100), card("b", "new", 200)] },
  { key: "contacted" as Stage, count: 0, cover_total: 0, leads: [] },
];

describe("moveCard", () => {
  it("moves the card, its count and its cover, without touching the original", () => {
    const original = board();
    const next = moveCard(original, "a", "contacted");
    expect(next[0]).toMatchObject({ count: 1, cover_total: 200 });
    expect(next[1]).toMatchObject({ count: 1, cover_total: 100 });
    expect(next[1].leads[0]).toMatchObject({ lead_id: "a", stage: "contacted", days_in_stage: 0 });
    expect(original[0].count).toBe(2);
  });
  it("copes with a lead that has no cover figure", () => {
    const next = moveCard(
      [{ key: "new" as Stage, count: 1, cover_total: 0, leads: [card("x", "new", null)] }, ...board().slice(1)],
      "x",
      "contacted",
    );
    expect(next[1].cover_total).toBe(0);
  });
  it("leaves the board alone for an unknown card or the same stage", () => {
    const b = board();
    expect(moveCard(b, "nope", "contacted")).toBe(b);
    expect(moveCard(b, "a", "new")).toBe(b);
  });
});

describe("labels", () => {
  it("reads naturally", () => {
    expect(ageLabel(0)).toBe("today");
    expect(ageLabel(1)).toBe("1 day");
    expect(ageLabel(9)).toBe("9 days");
    expect(pct(33.3)).toBe("33.3%");
    expect(pct(null)).toBe("—");
  });
});
