"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarClock, Link2, Phone, RefreshCw } from "lucide-react";
import { m } from "motion/react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { Panel, SimulatedTag, Skeleton } from "@/components/advisor/dashboard/parts";
import { MODE_LABEL, formatSlot, howItWorks, relativeStart } from "@/components/advisor/appointments/appointment-time";
import { ModeBadge } from "@/components/advisor/appointments/ModeBadge";
import { OutcomeCard } from "@/components/advisor/appointments/OutcomeCard";
import { RescheduleCard } from "@/components/advisor/appointments/RescheduleCard";
import { useAppointment } from "@/components/advisor/appointments/useAppointments";
import { rise, stagger } from "@/components/advisor/motion";
import type { AppointmentDetail } from "@/types/advisor";

function BackLink() {
  return (
    <Link
      href="/advisor/appointments"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6F6A7C] transition-colors hover:text-[#7957FF]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All appointments
    </Link>
  );
}

function Notes({ detail, onSaved }: { detail: AppointmentDetail; onSaved: (d: AppointmentDetail) => void }) {
  const [text, setText] = useState(detail.advisor_notes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const save = async () => {
    setStatus("saving");
    try {
      onSaved(
        await fetchFromAPI<AppointmentDetail>(`/advisor/appointments/${encodeURIComponent(detail.booking_id)}/notes`, {
          method: "PUT",
          body: JSON.stringify({ advisor_notes: text }),
        }),
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  return (
    <Panel title="Your private notes" aside={<span className="text-[11px] font-semibold text-[#8A849A]">Not shown to the customer</span>}>
      <label htmlFor="advisor-notes" className="sr-only">
        Private notes about this appointment
      </label>
      <textarea
        id="advisor-notes"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setStatus("idle");
        }}
        maxLength={2000}
        rows={4}
        placeholder="Talking points, follow-ups, what the customer prefers…"
        className="w-full resize-y rounded-xl border border-[#E8E5F0] p-3 text-sm text-[#24212B]"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving" || text === detail.advisor_notes}
          className="rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : "Save notes"}
        </button>
        <span role="status" className={`text-xs font-semibold ${status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
          {status === "saved" ? "Saved" : status === "error" ? "Couldn't save. Try again." : ""}
        </span>
      </div>
    </Panel>
  );
}

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, setData, error, notFound, reload } = useAppointment(id);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!data && !error) {
    return (
      <div role="status" aria-label="Loading appointment" className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto mt-6 max-w-md space-y-4">
        <BackLink />
        <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
          <p className="m-0 text-sm font-semibold text-rose-800">{notFound ? "This appointment isn't in your list." : error}</p>
          {!notFound && (
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const cancelled = data.phase === "cancelled";
  const cancel = async () => {
    setActionError(null);
    try {
      setData(await postJSON<AppointmentDetail>(`/advisor/appointments/${encodeURIComponent(data.booking_id)}/cancel`, {}));
      setConfirming(false);
    } catch (failure) {
      setActionError(errorMessage(failure, "We couldn't cancel the appointment."));
    }
  };

  return (
    <div className="space-y-6">
      <m.header variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <m.div variants={rise}>
          <BackLink />
        </m.div>
        <m.div variants={rise} className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">{data.customer_name}</h1>
          <ModeBadge mode={data.consultation_mode} />
          <SimulatedTag />
        </m.div>
      </m.header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="When and how">
            <p className="m-0 flex items-start gap-2 text-lg font-extrabold tracking-tight text-[#171B3D]">
              <CalendarClock className="mt-1 h-5 w-5 shrink-0 text-[#7957FF]" aria-hidden="true" />
              {formatSlot(data.slot_start, data.slot_end)}
            </p>
            <p className="m-0 mt-1 text-sm font-semibold text-[#6F6A7C]">
              {cancelled
                ? `Cancelled by the ${data.cancelled_by || "customer"}`
                : data.phase === "upcoming"
                  ? `Starts ${relativeStart(data.starts_in_minutes)}`
                  : data.phase === "completed"
                    ? "Completed"
                    : data.phase === "no_show"
                      ? "The customer didn't attend"
                      : "The session time has passed. Mark how it went below."}
              {data.rescheduled && !cancelled ? " · moved from another time" : ""}
            </p>
            <p className="m-0 mt-4 rounded-xl bg-[#F8F7FC] px-3 py-2.5 text-sm text-[#24212B]">
              {howItWorks(data.consultation_mode, "advisor")}
            </p>
            {data.customer_phone && !cancelled && (
              <p className="m-0 mt-3 flex items-center gap-2 text-sm text-[#24212B]">
                <Phone className="h-4 w-4 text-[#7957FF]" aria-hidden="true" /> Customer&apos;s number:{" "}
                <strong className="tabular-nums">{data.customer_phone}</strong>
              </p>
            )}
            {data.meeting_link && !cancelled && (
              <p className="m-0 mt-3 flex items-start gap-2 break-all text-sm text-[#24212B]">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7957FF]" aria-hidden="true" />
                <span>
                  Meeting link: <span className="font-semibold">{data.meeting_link}</span>
                  <span className="block text-xs text-[#8A849A]">A placeholder address: no real meeting is created.</span>
                </span>
              </p>
            )}
            {data.customer_note && (
              <p className="m-0 mt-4 text-sm text-[#24212B]">
                <span className="block text-xs font-bold uppercase tracking-wide text-[#8A849A]">Note from the customer</span>
                {data.customer_note}
              </p>
            )}
            {data.phase === "upcoming" && (
              <div className="mt-5 flex flex-wrap items-start gap-2 border-t border-[#F1EDFC] pt-4">
                <RescheduleCard bookingId={data.booking_id} onMoved={setData} />
                {confirming ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancel}
                      className="rounded-xl bg-[#C23B3B] px-4 py-2 text-sm font-bold text-white hover:bg-[#A82F2F]"
                    >
                      Yes, cancel it
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-[#6F6A7C]"
                    >
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="rounded-xl border border-[#D9D3E8] px-4 py-2 text-sm font-bold text-[#24212B] transition-colors hover:border-[#C23B3B] hover:text-[#C23B3B]"
                  >
                    Cancel appointment
                  </button>
                )}
                {actionError && (
                  <p role="alert" className="m-0 w-full text-xs font-semibold text-rose-700">
                    {actionError}
                  </p>
                )}
              </div>
            )}
          </Panel>
          <OutcomeCard key={`${data.outcome}-${data.outcome_note}`} appointment={data} onSaved={setData} />
          <Notes key={data.advisor_notes} detail={data} onSaved={setData} />
        </div>

        <Panel title={`Chat with ${data.customer_name.split(" ")[0]}`}>
          <ChatPanel
            endpoint={`/advisor/appointments/${encodeURIComponent(data.booking_id)}/messages`}
            viewer="advisor"
            subtitle={`${MODE_LABEL[data.consultation_mode]} · ${data.slot_label}`}
            starters={[
              "Hello! Is there anything you'd like to go through before we meet?",
              "Thanks for booking. What would you like to cover?",
            ]}
            otherName={data.customer_name.split(" ")[0]}
            closed={cancelled}
          />
          <p className="m-0 mt-3 text-xs text-[#8A849A]">
            The customer sees these messages on their My plan page. Nothing is sent by SMS or email.
          </p>
        </Panel>
      </div>
    </div>
  );
}
