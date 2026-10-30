import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY, rangeLabel, toSearchParams, withChange } from "@/components/advisor/customers/customer-query";

describe("toSearchParams", () => {
  it("leaves empty filters out", () => {
    const params = new URLSearchParams(toSearchParams(DEFAULT_QUERY));
    expect(params.get("q")).toBeNull();
    expect(params.get("band")).toBeNull();
    expect(params.get("page_size")).toBe("10");
  });

  it("trims and sends the search and filters", () => {
    const params = new URLSearchParams(
      toSearchParams({ ...DEFAULT_QUERY, q: "  asha ", band: "large", risk: "high", sort: "gap", order: "desc" }),
    );
    expect(params.get("q")).toBe("asha");
    expect(params.get("band")).toBe("large");
    expect(params.get("sort")).toBe("gap");
    expect(params.get("order")).toBe("desc");
  });
});

describe("withChange", () => {
  it("returns to page 1 when a filter changes", () => {
    expect(withChange({ ...DEFAULT_QUERY, page: 3 }, { band: "small" }).page).toBe(1);
  });

  it("keeps filters when only the page changes", () => {
    const next = withChange({ ...DEFAULT_QUERY, band: "large", page: 1 }, { page: 2 });
    expect(next).toMatchObject({ band: "large", page: 2 });
  });
});

describe("rangeLabel", () => {
  it("describes the visible rows", () => {
    expect(rangeLabel(2, 10, 14)).toBe("11–14 of 14");
    expect(rangeLabel(1, 10, 0)).toBe("No customers");
  });
});
