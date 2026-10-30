"use client";

import { RotateCcw } from "lucide-react";
import { INPUT } from "@/components/admin/AdminUi";
import { inrShort } from "@/lib/admin-form";

/** A rupee amount with its lakh/crore reading beside it, an unsaved marker and a way to undo. */
export function MoneyField({
  id,
  label,
  help,
  value,
  saved,
  error,
  step = 500_000,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: number;
  saved: number;
  error?: string;
  step?: number;
  onChange: (v: number) => void;
}) {
  const changed = value !== saved;
  return (
    <div className={`rounded-2xl border bg-white p-4 ${error ? "border-rose-300" : changed ? "border-[#4F6BFF]/50" : "border-[#E8E5F0]"}`}>
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={id} className="text-sm font-bold text-[#0E1330]">
          {label}
        </label>
        {changed && (
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-[#EEF1FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3D55E0]">
              Unsaved
            </span>
            <button
              type="button"
              onClick={() => onChange(saved)}
              aria-label={`Reset ${label} to ${inrShort(saved)}`}
              className="rounded-md p-1 text-[#6F6A7C] hover:bg-[#F4F3F7]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        )}
      </div>
      <p id={`${id}-help`} className="m-0 mt-1 text-xs leading-relaxed text-[#6F6A7C]">
        {help}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A849A]">₹</span>
          <input
            id={id}
            type="number"
            min={0}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-help`}
            className={`${INPUT} pl-7`}
          />
        </div>
        <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-[#3D55E0]">{inrShort(value)}</span>
      </div>
      {error && (
        <p role="alert" className="m-0 mt-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
