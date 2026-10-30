import { describe, expect, it } from "vitest";
import { formatCount, formatInrCompact, initials } from "@/components/advisor/format";

describe("formatInrCompact", () => {
  it("uses crore, lakh and plain rupees", () => {
    expect(formatInrCompact(12_500_000)).toBe("₹1.25 Cr");
    expect(formatInrCompact(4_550_000)).toBe("₹45.5 L");
    expect(formatInrCompact(8500)).toBe("₹8,500");
    expect(formatInrCompact(0)).toBe("₹0");
  });

  it("keeps the sign of negative amounts", () => {
    expect(formatInrCompact(-250_000)).toBe("-₹2.5 L");
  });
});

describe("formatCount", () => {
  it("groups digits the Indian way", () => {
    expect(formatCount(1234567)).toBe("12,34,567");
  });
});

describe("initials", () => {
  it("takes the first and last name", () => {
    expect(initials("Venkata Subba Rao")).toBe("VR");
    expect(initials("Farah")).toBe("F");
    expect(initials("  ")).toBe("?");
  });
});
