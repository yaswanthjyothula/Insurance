/** The languages the customer site can be shown in. English is the source; the rest are translations of it. */
export const LANGUAGES = [
  { code: "en", name: "English", native: "English", dir: "ltr" },
  { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "te", name: "Telugu", native: "తెలుగు", dir: "ltr" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const STORAGE_KEY = "lifesure_lang";

export function isLanguage(value: string | null | undefined): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

export function languageInfo(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** The saved choice if there is one, else the browser's first language we have, else English. */
export function pickLanguage(saved: string | null | undefined, browser: readonly string[] = []): LanguageCode {
  if (isLanguage(saved)) return saved;
  for (const tag of browser) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
