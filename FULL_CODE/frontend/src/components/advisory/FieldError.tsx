"use client";

import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  const { tx } = useI18n();
  if (!message) return null;
  return (
    <span id={id} role="alert" className="flex items-center gap-1.5 text-[14px] font-semibold text-[#C23B3B] mt-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {tx(message)}
    </span>
  );
}
