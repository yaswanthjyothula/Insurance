import { describe, expect, it } from "vitest";
import { isLoginId, isValidEmail, validateLogin, validateRegistration } from "@/components/auth/form-validation";

const validRegistration = { fullName: "Asha Rao", email: "asha@example.com", password: "long-enough", confirmPassword: "long-enough" };

describe("isValidEmail", () => {
  it("accepts ordinary addresses and ignores surrounding spaces", () => {
    expect(isValidEmail(" asha@example.com ")).toBe(true);
  });

  it("rejects addresses without a domain or with spaces inside", () => {
    expect(isValidEmail("asha@")).toBe(false);
    expect(isValidEmail("asha@example")).toBe(false);
    expect(isValidEmail("as ha@example.com")).toBe(false);
  });
});

describe("validateLogin", () => {
  it("passes a filled form", () => {
    expect(validateLogin({ email: "asha@example.com", password: "x" })).toEqual({});
  });

  it("flags each empty or invalid field", () => {
    expect(Object.keys(validateLogin({ email: "nope", password: "" }))).toEqual(["email", "password"]);
  });
});

describe("sign in with an ID", () => {
  it("accepts customer and advisor IDs in any case", () => {
    expect(isLoginId("CUS-06ISGGSQ")).toBe(true);
    expect(isLoginId(" adv-4kkbrk ")).toBe(true);
    expect(validateLogin({ email: "CUS-06ISGGSQ", password: "x" })).toEqual({});
  });

  it("rejects other shapes", () => {
    expect(isLoginId("CUS-")).toBe(false);
    expect(isLoginId("USR-123456")).toBe(false);
    expect(isLoginId("CUS-06 ISGGSQ")).toBe(false);
  });
});

describe("validateRegistration", () => {
  it("passes a complete, matching form", () => {
    expect(validateRegistration(validRegistration)).toEqual({});
  });

  it("requires a name of at least two characters", () => {
    expect(validateRegistration({ ...validRegistration, fullName: " A " }).fullName).toBeDefined();
  });

  it("requires a password of at least eight characters, as the server does", () => {
    expect(validateRegistration({ ...validRegistration, password: "short", confirmPassword: "short" }).password).toBeDefined();
  });

  it("flags a confirmation that differs", () => {
    expect(validateRegistration({ ...validRegistration, confirmPassword: "different" }).confirmPassword).toBeDefined();
  });
});
