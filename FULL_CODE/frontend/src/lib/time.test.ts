import { describe, expect, it } from "vitest";
import { formatIst } from "@/lib/time";

describe("formatIst", () => {
  it("converts UTC to Indian Standard Time (UTC+5:30)", () => {
    expect(formatIst("2026-10-30T20:10:00+00:00")).toBe("2026-10-31 01:40 IST");
    expect(formatIst("2026-10-30T20:10:00Z")).toBe("2026-10-31 01:40 IST");
  });
  it("handles an offset that is already IST", () => {
    expect(formatIst("2026-10-30T20:10:00+05:30")).toBe("2026-10-30 20:10 IST");
  });
  it("rolls the date over at midnight", () => {
    expect(formatIst("2026-12-31T18:45:00+00:00")).toBe("2027-01-01 00:15 IST");
  });
  it("shows a zone-less timestamp as written, since it is already local time", () => {
    expect(formatIst("2026-10-30T20:10:00")).toBe("2026-10-30 20:10 IST");
  });
  it("copes with empty and unreadable values", () => {
    expect(formatIst("")).toBe("");
    expect(formatIst(null)).toBe("");
    expect(formatIst("2026-13-99T99:99:99Z")).toBe("2026-13-99T99:99:99Z");
  });
});
