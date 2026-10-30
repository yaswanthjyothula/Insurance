import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "@/lib/password";

describe("validatePasswordChange", () => {
  it("accepts a different, long enough, confirmed password", () => {
    expect(validatePasswordChange({ current: "old-pass", next: "new-pass-123", confirm: "new-pass-123" })).toEqual({});
  });

  it("flags each problem on its own field", () => {
    expect(Object.keys(validatePasswordChange({ current: "", next: "short", confirm: "other" }))).toEqual(["current", "next", "confirm"]);
  });

  it("refuses to reuse the current password", () => {
    expect(validatePasswordChange({ current: "same-password", next: "same-password", confirm: "same-password" }).next).toMatch(/different/);
  });
});
