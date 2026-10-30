"use client";

import { useState } from "react";
import { CheckCircle2, UserX } from "lucide-react";
import { Panel } from "@/components/advisor/dashboard/parts";
import { postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { AppointmentDetail } from "@/types/advisor";

/** Lets the advisor say how a session went. It opens when the session is about to start, and the answer can be corrected. */
export function OutcomeCard({ appointment, onSaved }: { appointment: AppointmentDetail; onSaved: (next: AppointmentDetail) => void }) {
  const [note, setNote] = useState(appointment.outcome_note);
  const [busy, setBusy] = useState<"completed" | "no_show" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  if (appointment.phase === "cancelled") return null;
  const recorded = appointment.outcome;
  if (!appointment.can_record_outcome && !recorded) {
    return (
      <Panel title="After the session">
        <p className="m-0 text-sm text-[#6F6A7C]">
          Once the session is about to start you can mark it completed, or note that the customer didn&apos;t attend.
        </p>
      </Panel>
    );
  }

  const save = async (outcome: "completed" | "no_show") => {
    setBusy(outcome);
    setError(null);
    try {
      onSaved(
        await postJSON<AppointmentDetail>(`/advisor/appointments/${encodeURIComponent(appointment.booking_id)}/outcome`, { outcome, note }),
      );
      setChanging(false);
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't save the outcome."));
    } finally {
      setBusy(null);
    }
  };

  const showForm = !recorded || changing;
  return (
    <Panel
      title={recorded ? "Outcome" : "How did the session go?"}
      aside={
        recorded && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${recorded === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {recorded === "completed" ? "Completed" : "Customer didn't attend"}
          </span>
        )
      }
    >
      {recorded && !changing && (
        <div className="space-y-3">
          {appointment.outcome_note && <p className="m-0 whitespace-pre-wrap text-sm text-[#24212B]">{appointment.outcome_note}</p>}
          <p className="m-0 text-xs text-[#8A849A]">
            The customer sees this status. {recorded === "completed" ? "Their lead in the CRM moves to Qualified." : ""}
          </p>
          <button type="button" onClick={() => setChanging(true)} className="text-sm font-bold text-[#7957FF] hover:underline">
            Change
          </button>
        </div>
      )}
      {showForm && (
        <div className="space-y-3">
          <label htmlFor="outcome-note" className="sr-only">
            Note about the session
          </label>
          <textarea
            id="outcome-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What was agreed? (optional)"
            className="w-full resize-y rounded-xl border border-[#E8E5F0] p-3 text-sm text-[#24212B]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => save("completed")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {busy === "completed" ? "Saving…" : "Mark completed"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => save("no_show")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D9D3E8] px-4 py-2 text-sm font-bold text-[#24212B] hover:border-amber-400 hover:text-amber-700 disabled:opacity-50"
            >
              <UserX className="h-4 w-4" aria-hidden="true" /> {busy === "no_show" ? "Saving…" : "Customer didn't attend"}
            </button>
            {changing && (
              <button type="button" onClick={() => setChanging(false)} className="px-3 py-2 text-sm font-semibold text-[#6F6A7C]">
                Cancel
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="m-0 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
