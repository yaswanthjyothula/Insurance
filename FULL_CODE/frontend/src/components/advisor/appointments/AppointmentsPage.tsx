"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarX2, MessageSquare, RefreshCw } from "lucide-react";
import { m } from "motion/react";
import { initials } from "@/components/advisor/format";
import { rise, stagger } from "@/components/advisor/motion";
import { EmptyState, Skeleton } from "@/components/advisor/dashboard/parts";
import { groupByDay, relativeStart } from "@/components/advisor/appointments/appointment-time";
import { ModeBadge } from "@/components/advisor/appointments/ModeBadge";
import { useAppointments, type Scope } from "@/components/advisor/appointments/useAppointments";
import type { AppointmentSummary } from "@/types/advisor";

const TABS: { scope: Scope; label: string }[] = [
  { scope: "upcoming", label: "Upcoming" },
  { scope: "past", label: "Past" },
  { scope: "cancelled", label: "Cancelled" },
];

const EMPTY: Record<Scope, string> = {
  upcoming: "Consultations that customers book with you appear here, soonest first.",
  past: "Appointments whose time has passed appear here.",
  cancelled: "Cancelled appointments appear here.",
};

function Row({ item }: { item: AppointmentSummary }) {
  const time = new Date(item.slot_start)
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    .replace(/\s?(am|pm)/i, (s) => s.toUpperCase());
  return (
    <m.li variants={rise}>
      <Link
        href={`/advisor/appointments/${encodeURIComponent(item.booking_id)}`}
        className="flex items-center gap-4 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-[#E8E5F0] hover:bg-[#FBFAFE]"
      >
        <span className="w-[72px] shrink-0 text-sm font-bold tabular-nums text-[#171B3D]">{time}</span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F0FF] text-xs font-bold text-[#6240E6]"
          aria-hidden="true"
        >
          {initials(item.customer_name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[#24212B]">{item.customer_name}</span>
          <span className="block truncate text-xs text-[#6F6A7C]">
            {item.phase === "upcoming"
              ? relativeStart(item.starts_in_minutes)
              : item.phase === "cancelled"
                ? `Cancelled by the ${item.cancelled_by || "customer"}`
                : item.phase === "completed"
                  ? "Completed"
                  : item.phase === "no_show"
                    ? "Customer didn't attend"
                    : `Started ${relativeStart(item.starts_in_minutes).replace("started ", "")}`}
            {item.last_message_preview ? ` · “${item.last_message_preview}”` : ""}
          </span>
        </span>
        {item.message_count > 0 && (
          <span className="hidden items-center gap-1 text-xs font-semibold text-[#6F6A7C] sm:flex" title={`${item.message_count} messages`}>
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> {item.message_count}
          </span>
        )}
        {item.phase === "past" && (
          <span className="hidden shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200 sm:inline">
            Mark outcome
          </span>
        )}
        <ModeBadge mode={item.consultation_mode} />
      </Link>
    </m.li>
  );
}

export function AppointmentsPage() {
  const asked = useSearchParams().get("scope");
  const [scope, setScope] = useState<Scope>(asked === "past" || asked === "cancelled" ? asked : "upcoming");
  const { data, error, reload } = useAppointments(scope);
  const days = data ? groupByDay(data) : [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">Appointments</h1>
        <p className="m-0 text-sm text-[#6F6A7C]">
          Consultations your customers booked with you. Once one has started, mark it completed or missed. They see the same appointment and
          chat on their side. Calls and video are simulated: nothing is dialled and nobody outside this app is notified.
        </p>
      </header>

      <div role="tablist" aria-label="Appointment status" className="inline-flex rounded-2xl border border-[#E8E5F0] bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.scope}
            type="button"
            role="tab"
            aria-selected={scope === tab.scope}
            onClick={() => setScope(tab.scope)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-colors ${scope === tab.scope ? "bg-[#171B3D] text-white" : "text-[#6F6A7C] hover:text-[#24212B]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
          <p className="m-0 text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        </div>
      ) : !data ? (
        <div role="status" aria-label="Loading appointments" className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <EmptyState icon={CalendarX2} title={`No ${scope} appointments`} hint={EMPTY[scope]} />
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <section key={day.date} aria-label={day.label} className="rounded-2xl border border-[#E8E5F0] bg-white p-2 sm:p-3">
              <h2 className="m-0 px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">{day.label}</h2>
              <m.ul key={`${scope}-${day.date}`} variants={stagger} initial="hidden" animate="show" className="m-0 list-none space-y-1 p-0">
                {day.items.map((item) => (
                  <Row key={item.booking_id} item={item} />
                ))}
              </m.ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
