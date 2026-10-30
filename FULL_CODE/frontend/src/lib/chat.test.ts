import { describe, expect, it } from "vitest";
import { lastMessageId, mergeMessages, type ChatMessage } from "@/lib/chat";

const msg = (id: number, text = `m${id}`): ChatMessage => ({ id, sender_role: "customer", text, at: "2026-11-02T10:00:00" });

describe("mergeMessages", () => {
  it("appends only messages it has not seen", () => {
    expect(mergeMessages([msg(1), msg(2)], [msg(2), msg(3)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("keeps the same array when nothing is new, so React does not re-render", () => {
    const current = [msg(1)];
    expect(mergeMessages(current, [msg(1)])).toBe(current);
    expect(mergeMessages(current, [])).toBe(current);
  });

  it("orders by id when a send and a poll arrive out of order", () => {
    expect(mergeMessages([msg(1), msg(3)], [msg(2)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });
});

describe("lastMessageId", () => {
  it("is 0 for an empty thread, else the newest id", () => {
    expect(lastMessageId([])).toBe(0);
    expect(lastMessageId([msg(1), msg(4)])).toBe(4);
  });
});

import { dayLabel, layoutThread } from "@/lib/chat";

describe("dayLabel", () => {
  const now = new Date(2026, 9, 31, 15, 0);
  it("says Today and Yesterday, else the date", () => {
    expect(dayLabel("2026-10-31T09:00:00", now)).toBe("Today");
    expect(dayLabel("2026-10-30T23:00:00", now)).toBe("Yesterday");
    expect(dayLabel("2026-10-28T10:00:00", now)).toMatch(/28 Oct/);
  });
});

describe("layoutThread", () => {
  const now = new Date(2026, 9, 31, 15, 0);
  const at = (id: number, role: ChatMessage["sender_role"], when: string): ChatMessage => ({
    id,
    sender_role: role,
    text: `m${id}`,
    at: when,
  });

  it("groups runs from one sender and marks their first and last", () => {
    const rows = layoutThread(
      [at(1, "customer", "2026-10-31T10:00:00"), at(2, "customer", "2026-10-31T10:01:00"), at(3, "advisor", "2026-10-31T10:02:00")],
      now,
    );
    expect(rows.map((r) => [r.startsGroup, r.endsGroup])).toEqual([
      [true, false],
      [false, true],
      [true, true],
    ]);
  });

  it("starts a new group and heading on a new day", () => {
    const rows = layoutThread([at(1, "customer", "2026-10-30T10:00:00"), at(2, "customer", "2026-10-31T10:00:00")], now);
    expect(rows.map((r) => r.dayLabel)).toEqual(["Yesterday", "Today"]);
    expect(rows[1].startsGroup).toBe(true);
  });

  it("never groups system notices", () => {
    const rows = layoutThread([at(1, "system", "2026-10-31T10:00:00"), at(2, "system", "2026-10-31T10:01:00")], now);
    expect(rows.every((r) => r.startsGroup && r.endsGroup)).toBe(true);
  });
});
