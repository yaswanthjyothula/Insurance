"use client";

import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export function FormAlert({ message }: { message: string | null }) {
  const { tx } = useI18n();
  if (!message) return null;
  return (
    <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <span className="font-medium">{tx(message)}</span>
    </div>
  );
}
