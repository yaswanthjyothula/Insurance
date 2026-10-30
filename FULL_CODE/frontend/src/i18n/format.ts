import type { LanguageCode } from "@/i18n/languages";

/** The Intl locale for a site language. Latin digits are kept on purpose, so amounts read the same in every language. */
export function intlLocale(lang: LanguageCode): string {
  return `${lang}-IN-u-nu-latn`;
}

export function formatDate(
  lang: LanguageCode,
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale(lang), options).format(date);
}

export function formatTime(lang: LanguageCode, value: Date | string | number): string {
  return formatDate(lang, value, { hour: "numeric", minute: "2-digit" });
}
