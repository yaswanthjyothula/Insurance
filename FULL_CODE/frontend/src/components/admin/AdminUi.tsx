"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";
import { RotateCcw, X } from "lucide-react";
import { EASE } from "@/components/advisor/motion";

export const INPUT =
  "w-full rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-sm text-[#0E1330] tabular-nums transition-colors focus:border-[#4F6BFF]";

interface SliderFieldProps {
  id: string;
  label: string;
  help: string;
  value: number;
  saved: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  error?: string;
  onChange: (value: number) => void;
}

/** A slider and a number box that edit the same value, with what the setting does, whether it is unsaved and a way to undo it. */
export function SliderField({ id, label, help, value, saved, min, max, step, suffix = "", error, onChange }: SliderFieldProps) {
  const changed = value !== saved;
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition-colors ${error ? "border-rose-300" : changed ? "border-[#4F6BFF]/50" : "border-[#E8E5F0]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-[#0E1330]">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {changed && (
            <>
              <span className="rounded-full bg-[#EEF1FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3D55E0]">
                Unsaved
              </span>
              <button
                type="button"
                onClick={() => onChange(saved)}
                aria-label={`Reset ${label} to ${saved}${suffix}`}
                className="rounded-md p-1 text-[#6F6A7C] hover:bg-[#F4F3F7] hover:text-[#0E1330]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
      <p id={`${id}-help`} className="m-0 mt-1 text-xs leading-relaxed text-[#6F6A7C]">
        {help}
      </p>
      <div className="mt-3 flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`${label} slider`}
          aria-describedby={`${id}-help`}
          className="h-2 flex-1 cursor-pointer accent-[#4F6BFF]"
        />
        <div className="relative w-28 shrink-0">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(event) => onChange(event.target.value === "" ? NaN : Number(event.target.value))}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-help`}
            className={`${INPUT} pr-8 text-right`}
          />
          {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A849A]">{suffix}</span>}
        </div>
      </div>
      {error && (
        <p role="alert" className="m-0 mt-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-[#4F6BFF]" : "bg-[#C4BFD3]"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <m.div
            className="absolute inset-0 bg-[#070B22]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <m.aside
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl ${wide ? "max-w-2xl" : "max-w-xl"}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <header className="flex items-center justify-between border-b border-[#E8E5F0] px-5 py-4">
              <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#0E1330]">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-[#6F6A7C] hover:bg-[#F4F3F7]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="m-0 mt-1 text-xs font-semibold text-rose-700">
      {message}
    </p>
  ) : null;
}
