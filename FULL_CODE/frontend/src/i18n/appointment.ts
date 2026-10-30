"use client";

import { useCallback } from "react";
import type { MessageKey } from "@/i18n/en";
import { useI18n } from "@/i18n/I18nProvider";

/** Translated wording for appointments, shared by every customer screen that shows one. */
export function useAppointmentCopy() {
  const { t } = useI18n();

  /** "in 2 days", "in 45 minutes", "started 10 minutes ago", from a minute count. */
  const relativeStart = useCallback(
    (minutes: number): string => {
      const abs = Math.abs(minutes);
      const [count, unit] =
        abs >= 1440 ? [Math.round(abs / 1440), "day"] : abs >= 60 ? [Math.round(abs / 60), "hour"] : [Math.max(abs, 1), "minute"];
      const direction = minutes >= 0 ? "in" : "ago";
      return t(`common.time.${direction}.${unit}${count === 1 ? "" : "s"}` as MessageKey, { count });
    },
    [t],
  );

  const howItWorks = useCallback((mode: "video" | "phone" | "chat") => t(`common.appointment.how.${mode}` as const), [t]);
  const modeLabel = useCallback((mode: "video" | "phone" | "chat") => t(`common.mode.${mode}` as const), [t]);
  const modeHint = useCallback((mode: "video" | "phone" | "chat") => t(`common.mode.${mode}.hint` as const), [t]);

  return { relativeStart, howItWorks, modeLabel, modeHint };
}
