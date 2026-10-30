import { describe, expect, it } from "vitest";
import { DEFAULT_LANGUAGE, LANGUAGES, isLanguage, languageInfo, pickLanguage } from "@/i18n/languages";
import { format, placeholders, reverseIndex } from "@/i18n/translate";

describe("format", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(format("Hello {name}, you have {count} plans", { name: "Asha", count: 3 })).toBe("Hello Asha, you have 3 plans");
    expect(format("Hi {name}", {})).toBe("Hi {name}");
    expect(format("No params")).toBe("No params");
  });
  it("fills a repeated placeholder everywhere", () => {
    expect(format("{n} of {n}", { n: 2 })).toBe("2 of 2");
  });
});

describe("placeholders", () => {
  it("lists each once, sorted", () => expect(placeholders("{b} and {a} and {b}")).toEqual(["a", "b"]));
  it("is empty when there are none", () => expect(placeholders("plain")).toEqual([]));
});

describe("reverseIndex", () => {
  it("maps text to the first key that has it", () => {
    const index = reverseIndex({ "a.one": "Save", "b.two": "Save", "c.three": "Cancel" });
    expect(index.get("Save")).toBe("a.one");
    expect(index.get("Cancel")).toBe("c.three");
    expect(index.get("Nope")).toBeUndefined();
  });
});

describe("languages", () => {
  it("has English first and only supported left-to-right languages", () => {
    expect(LANGUAGES[0].code).toBe(DEFAULT_LANGUAGE);
    expect(LANGUAGES.every((language) => language.dir === "ltr")).toBe(true);
  });
  it("has unique codes", () => expect(new Set(LANGUAGES.map((l) => l.code)).size).toBe(LANGUAGES.length));
  it("recognises its own codes only", () => {
    expect(isLanguage("hi")).toBe(true);
    expect(isLanguage("fr")).toBe(false);
    expect(isLanguage(null)).toBe(false);
    expect(languageInfo("te").native).toBe("తెలుగు");
  });
  it("prefers the saved choice, then the browser, then English", () => {
    expect(pickLanguage("te", ["hi-IN"])).toBe("te");
    expect(pickLanguage(null, ["fr-FR", "hi-IN", "en"])).toBe("hi");
    expect(pickLanguage("xx", ["en-US"])).toBe("en");
    expect(pickLanguage(undefined, [])).toBe("en");
  });
});
