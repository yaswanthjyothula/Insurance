import { describe, expect, it } from "vitest";
import { isValidEmail, validateLogin, validateRegistration } from "@/components/auth/form-validation";

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
