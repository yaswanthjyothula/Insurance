import { useCallback } from "react";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Translates the English messages that src/lib/assessment-form.ts returns. Fixed sentences go through tx();
 * sentences built from a field label and numbers are matched by shape and rebuilt from translated parts.
 * Anything unrecognised is shown as written.
 */
export function useErrorText(): (message: string) => string {
  const { t, tx } = useI18n();
  return useCallback(
    (message: string) => {
      const direct = tx(message);
      if (direct !== message) return direct;
      let match = /^(.+) is required$/.exec(message);
      if (match) return t("assessment.validation.required", { label: tx(match[1]) });
      match = /^(.+) must be a number$/.exec(message);
      if (match) return t("assessment.validation.notNumber", { label: tx(match[1]) });
      match = /^(.+) must be greater than 0$/.exec(message);
      if (match) return t("assessment.validation.positive", { label: tx(match[1]) });
      match = /^(.+) must be between (.+) and (.+)$/.exec(message);
      if (match) return t("assessment.validation.between", { label: tx(match[1]), min: match[2], max: match[3] });
      match = /^Retirement age must be above your current age \((.+)\)$/.exec(message);
      if (match) return t("assessment.validation.retireAbove", { age: match[1] });
      return message;
    },
    [t, tx],
  );
}
