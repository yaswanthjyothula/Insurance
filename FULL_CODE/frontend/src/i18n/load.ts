import type { LanguageCode } from "@/i18n/languages";
import type { Messages } from "@/i18n/en";

type Loader = () => Promise<{ default: Partial<Messages> }>;

/** Each language is its own chunk, fetched only when someone picks it. */
const LOADERS: Record<Exclude<LanguageCode, "en">, Loader> = {
  hi: () => import("@/i18n/lang/hi"),
  te: () => import("@/i18n/lang/te"),
};

export async function loadMessages(code: LanguageCode): Promise<Partial<Messages>> {
  if (code === "en") return {};
  return (await LOADERS[code]()).default;
}

export const TRANSLATED_LANGUAGES = Object.keys(LOADERS) as Exclude<LanguageCode, "en">[];
