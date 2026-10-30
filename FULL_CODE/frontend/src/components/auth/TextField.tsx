"use client";

import type { HTMLInputTypeAttribute } from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}

/** A labelled input that announces its own error to assistive technology. */
export function TextField({ id, label, value, onChange, type = "text", autoComplete, placeholder, error }: TextFieldProps) {
  const { tx } = useI18n();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#24212B] mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#24212B] placeholder:text-[#A59FB5] font-medium focus:outline-none focus:ring-2 focus:ring-[#7957FF]/20 ${
          error ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="m-0 mt-1.5 text-xs font-semibold text-[#C23B3B]">
          {tx(error)}
        </p>
      )}
    </div>
  );
}
