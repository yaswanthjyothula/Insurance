import { describe, expect, it } from "vitest";
import { formatDate, formatTime, intlLocale } from "@/i18n/format";

describe("intlLocale", () => {
  it("asks for Latin digits in every language", () => {
    expect(intlLocale("hi")).toBe("hi-IN-u-nu-latn");
    expect(intlLocale("en")).toBe("en-IN-u-nu-latn");
  });
});

describe("formatDate", () => {
  const day = new Date(2026, 9, 31, 15, 30);
  it("writes the month in the language, with the digits kept Latin", () => {
    const hindi = formatDate("hi", day);
    expect(hindi).toMatch(/31/);
    expect(hindi).not.toMatch(/Oct/);
    expect(formatDate("en", day)).toMatch(/Oct/);
  });
  it("returns an empty string for a date it cannot read", () => expect(formatDate("hi", "not a date")).toBe(""));
  it("formats a time", () => expect(formatTime("en", day)).toMatch(/3:30/));
});
