import { describe, expect, it } from "vitest";
import { ADVISOR_NAV, breadcrumbsFor, isActive } from "@/components/advisor/nav";

describe("isActive", () => {
  it("matches Overview only on its own path", () => {
    expect(isActive("/advisor", "/advisor")).toBe(true);
    expect(isActive("/advisor", "/advisor/customers")).toBe(false);
  });

  it("matches a section and its sub-pages, but not a lookalike prefix", () => {
    expect(isActive("/advisor/customers", "/advisor/customers")).toBe(true);
    expect(isActive("/advisor/customers", "/advisor/customers/CUS-1")).toBe(true);
    expect(isActive("/advisor/customers", "/advisor/customers-archive")).toBe(false);
  });
});

describe("breadcrumbsFor", () => {
  it("shows Overview on the home page", () => {
    expect(breadcrumbsFor("/advisor").map((c) => c.label)).toEqual(["Advisor", "Overview"]);
  });

  it("names the section for deeper pages", () => {
    expect(breadcrumbsFor("/advisor/follow-ups").map((c) => c.label)).toEqual(["Advisor", "Follow-ups"]);
    expect(breadcrumbsFor("/advisor/customers/CUS-1").map((c) => c.label)).toEqual(["Advisor", "My Customers", "Details"]);
  });
});

describe("ADVISOR_NAV", () => {
  it("has unique destinations, and every item is a page that exists", () => {
    expect(new Set(ADVISOR_NAV.map((i) => i.href)).size).toBe(ADVISOR_NAV.length);
    expect(ADVISOR_NAV.every((i) => i.ready)).toBe(true);
  });
});
