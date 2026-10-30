import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEXT_PATH,
  advisorSignInPathFor,
  displayLogin,
  safeNextPath,
  signInPathFor,
  toAuthUser,
} from "@/components/auth/session-helpers";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths, including query and hash", () => {
    expect(safeNextPath("/advisory")).toBe("/advisory");
    expect(safeNextPath("/products?plan=term#top")).toBe("/products?plan=term#top");
  });

  it("falls back when the value is missing or empty", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("")).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example/steal")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("//evil.example")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("javascript:alert(1)")).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects backslash and control-character tricks browsers normalise into //host", () => {
    expect(safeNextPath("/\\evil.example")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("/\t/evil.example")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("/\n/evil.example")).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects paths without a leading slash", () => {
    expect(safeNextPath("advisory")).toBe(DEFAULT_NEXT_PATH);
  });

  it("uses the caller's fallback when given", () => {
    expect(safeNextPath("//evil.example", "/results")).toBe("/results");
  });
});

describe("signInPathFor", () => {
  it("encodes the page to return to", () => {
    expect(signInPathFor("/advisory")).toBe("/sign-in?next=%2Fadvisory");
  });
});

describe("toAuthUser", () => {
  it("maps the server session to the user shape the UI reads, without the token", () => {
    const user = toAuthUser({ token: "secret", email: "a@b.example", name: "Asha Rao", demo: false, role: "customer", advisor_id: null });
    expect(user).toEqual({
      email: "a@b.example",
      user_metadata: { full_name: "Asha Rao" },
      demo: false,
      role: "customer",
      advisorId: null,
    });
  });

  it("carries the advisor role and id", () => {
    const user = toAuthUser({ token: "t", email: "f@s.example", name: "Farah", demo: true, role: "advisor", advisor_id: "ADV-1" });
    expect(user.role).toBe("advisor");
    expect(user.advisorId).toBe("ADV-1");
  });

  it("treats a session from an older server, with no role, as a customer", () => {
    const user = toAuthUser({ token: "t", email: "a@b.example", name: "A", demo: false } as never);
    expect(user.role).toBe("customer");
  });
});

describe("advisorSignInPathFor", () => {
  it("sends advisors to their own sign-in and back to the page they wanted", () => {
    expect(advisorSignInPathFor("/advisor/customers")).toBe("/advisor-sign-in?next=%2Fadvisor%2Fcustomers");
  });
});

describe("displayLogin", () => {
  it("shows the ID for pack accounts and the email for everyone else", () => {
    expect(displayLogin("cus-06isggsq@users.lifesure.app")).toBe("CUS-06ISGGSQ");
    expect(displayLogin("asha@example.com")).toBe("asha@example.com");
  });
});
