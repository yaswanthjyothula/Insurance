"use client";

import { useState } from "react";
import { fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { Skeleton } from "@/components/advisor/dashboard/parts";
import type { AppointmentDetail, SlotOption } from "@/types/advisor";

/** Move an appointment to another open slot of the advisor's own calendar. The customer sees the new time and a note in the chat. */
export function RescheduleCard({ bookingId, onMoved }: { bookingId: string; onMoved: (updated: AppointmentDetail) => void }) {
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/advisor/appointments/${encodeURIComponent(bookingId)}`;

  const show = async () => {
    setOpen(true);
    setError(null);
    try {
      setSlots(await fetchFromAPI<SlotOption[]>(`${base}/slots`));
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't load your open slots."));
    }
  };

  const move = async () => {
    setBusy(true);
    setError(null);
    try {
      onMoved(await postJSON<AppointmentDetail>(`${base}/reschedule`, { slot_id: picked }));
      setOpen(false);
      setSlots(null);
      setPicked("");
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't move the appointment."));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={show}
        className="rounded-xl border border-[#D9D3E8] px-4 py-2 text-sm font-bold text-[#24212B] transition-colors hover:border-[#7957FF] hover:text-[#7957FF]"
      >
        Reschedule
      </button>
    );
  }
  return (
    <div className="w-full space-y-3 rounded-xl border border-[#E8E5F0] bg-[#FBFAFE] p-4">
      <p className="m-0 text-sm font-bold text-[#24212B]">Pick a new time</p>
      {!slots && !error ? (
        <Skeleton className="h-20" />
      ) : (
        <div role="radiogroup" aria-label="Open slots" className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {(slots ?? []).map((slot) => (
            <button
              key={slot.slot_id}
              type="button"
              role="radio"
              aria-checked={picked === slot.slot_id}
              onClick={() => setPicked(slot.slot_id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${picked === slot.slot_id ? "border-[#171B3D] bg-[#171B3D] text-white" : "border-[#E8E5F0] bg-white text-[#24212B] hover:border-[#D2C8F5]"}`}
            >
              {slot.label}
            </button>
          ))}
          {slots?.length === 0 && <p className="m-0 text-xs text-[#6F6A7C]">You have no open slots left in the sample calendar.</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="m-0 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={move}
          disabled={!picked || busy}
          className="rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-40"
        >
          {busy ? "Moving…" : "Move appointment"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6F6A7C] hover:text-[#24212B]"
        >
          Keep current time
        </button>
      </div>
    </div>
  );
}
