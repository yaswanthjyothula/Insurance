"use client";

import { en, type MessageKey } from "@/i18n/en";
import { useI18n } from "@/i18n/I18nProvider";
import { humaniseTag } from "@/lib/text";

/** Translated labels for advisor specialisation tags and spoken languages; unknown values fall back to the readable English or the raw name. */
export function useTagLabels() {
  const { t } = useI18n();
  const tagLabel = (tag: string): string => {
    const key = `advisory.tag.${tag}`;
    return key in en ? t(key as MessageKey) : humaniseTag(tag);
  };
  const languageLabel = (language: string): string => {
    const key = `advisory.language.${language}`;
    return key in en ? t(key as MessageKey) : language;
  };
  return { tagLabel, languageLabel };
}
