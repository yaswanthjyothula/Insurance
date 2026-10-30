import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { LANGUAGES } from "@/i18n/languages";
import { loadMessages, TRANSLATED_LANGUAGES } from "@/i18n/load";
import { placeholders } from "@/i18n/translate";

/** The letters each language is written in. A translated sentence must contain some of them. */
const SCRIPT: Record<string, RegExp> = {
  hi: /[ऀ-ॿ]/,
  te: /[ఀ-౿]/,
};

describe("the language list and the loaders agree", () => {
  it("has a loader for every language except English", () => {
    expect(TRANSLATED_LANGUAGES.sort()).toEqual(
      LANGUAGES.filter((l) => l.code !== "en")
        .map((l) => l.code)
        .sort(),
    );
  });
});

describe.each(TRANSLATED_LANGUAGES)("translations: %s", (code) => {
  it("contains only known message keys", async () => {
    const messages = (await loadMessages(code)) as Record<string, string>;
    const extra = Object.keys(messages).filter((k) => !(k in en));
    expect(extra).toEqual([]);
  });

  it("keeps every named {placeholder} from English", async () => {
    const messages = (await loadMessages(code)) as Record<string, string>;
    const wrong = Object.keys(messages).filter(
      (k) =>
        k in messages &&
        placeholders(messages[k]).slice().sort().join() !==
          placeholders((en as Record<string, string>)[k])
            .slice()
            .sort()
            .join(),
    );
    expect(wrong.slice(0, 15)).toEqual([]);
  });

  it("has no empty messages", async () => {
    const messages = (await loadMessages(code)) as Record<string, string>;
    expect(
      Object.entries(messages)
        .filter(([, v]) => !v.trim())
        .map(([k]) => k),
    ).toEqual([]);
  });

  it("is really written in the language, not left in English", async () => {
    const messages = (await loadMessages(code)) as Record<string, string>;
    // Brand names, units and one-word labels such as "OK" may legitimately look like English, so require most of the text to be in script
    const sentences = Object.keys(messages).filter((k) => /[A-Za-z]{4,}.*\s[A-Za-z]{3,}/.test((en as Record<string, string>)[k]));
    const inScript = sentences.filter((k) => SCRIPT[code].test(messages[k] ?? ""));
    expect(sentences.length).toBeGreaterThan(0);
    expect(inScript.length / Math.max(1, sentences.length)).toBeGreaterThan(0.95);
  });
});
