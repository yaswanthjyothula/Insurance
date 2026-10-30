"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Info, MessageSquare, X } from "lucide-react";
import type { Booking } from "@/types/api";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CARD_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { splitBookings } from "@/components/dashboard/dashboard-helpers";
import { modeDetails } from "@/components/advisory/consultation-modes";
import { useAppointmentCopy } from "@/i18n/appointment";
import { formatDate, formatTime } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";

const STARTER_KEYS: MessageKey[] = [
  "account.appointments.starter.budget",
  "account.appointments.starter.rider",
  "account.appointments.starter.bring",
];

function DateTile({ start, muted }: { start: string; muted: boolean }) {
  const { lang } = useI18n();
  const date = new Date(start);
  const valid = !Number.isNaN(date.getTime());
  return (
    <span
      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${muted ? "bg-[#F1EEF8] text-[#6F6A7C]" : "bg-[#F4F0FF] text-[#6240E6]"}`}
      aria-hidden="true"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{valid ? formatDate(lang, date, { month: "short" }) : ""}</span>
      <span className="text-2xl font-extrabold leading-none">{valid ? date.getDate() : ""}</span>
    </span>
  );
}

function AppointmentRow({ booking, onCancel }: { booking: Booking; onCancel: (bookingId: string) => void }) {
  const cancelled = booking.status === "cancelled";
  const phase = booking.phase ?? "upcoming";
  const past = phase === "past" || phase === "completed" || phase === "no_show";
  const [chatOpen, setChatOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { t, lang } = useI18n();
  const { relativeStart, howItWorks, modeLabel } = useAppointmentCopy();
  const first = booking.advisor_name.split(" ")[0];
  const mode = modeDetails(booking.consultation_mode);
  const ModeIcon = mode.icon;
  const clock = (value: string) => formatTime(lang, value).replace(/\s?(am|pm)/i, (m) => m.toUpperCase());
  const slotText = (start: string, end: string) => {
    if (Number.isNaN(new Date(start).getTime())) return start;
    const day = formatDate(lang, start, { weekday: "short", day: "numeric", month: "short" });
    return Number.isNaN(new Date(end).getTime()) ? `${day}, ${clock(start)}` : `${day}, ${clock(start)} – ${clock(end)}`;
  };
  const modeText = modeLabel(booking.consultation_mode);
  const when = booking.slot_end ? slotText(booking.slot_start, booking.slot_end) : booking.slot_label;

  const status = cancelled
    ? {
        text:
          booking.cancelled_by === "advisor" ? t("common.appointment.status.cancelledByAdvisor") : t("common.appointment.status.cancelled"),
        tone: "bg-[#FDF2F2] text-[#C23B3B]",
      }
    : phase === "completed"
      ? { text: t("common.appointment.status.completed"), tone: "bg-emerald-50 text-emerald-700" }
      : phase === "no_show"
        ? { text: t("common.appointment.status.missed"), tone: "bg-amber-50 text-amber-700" }
        : phase === "past"
          ? { text: t("common.appointment.status.passed"), tone: "bg-[#F1EEF8] text-[#6F6A7C]" }
          : {
              text:
                booking.starts_in_minutes !== undefined
                  ? t("common.appointment.status.starts", { when: relativeStart(booking.starts_in_minutes) })
                  : t("common.appointment.status.upcoming"),
              tone: "bg-emerald-50 text-emerald-700",
            };

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-[#D9D3E8] bg-white p-4 sm:p-5">
      <div className="flex gap-4">
        <DateTile start={booking.slot_start} muted={cancelled || past} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={`m-0 text-[17px] font-extrabold ${cancelled ? "text-[#6F6A7C] line-through" : "text-[#24212B]"}`}>
              {booking.advisor_name}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-[12px] font-bold text-[#6240E6]">
              <ModeIcon className="h-3.5 w-3.5" aria-hidden="true" /> {modeText}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${status.tone}`}>{status.text}</span>
          </div>
          <p className="m-0 mt-1 text-[15px] text-[#24212B]">{when}</p>
          <p className="m-0 mt-0.5 text-[12.5px] text-[#6F6A7C]">
            {t("account.appointments.ref", { id: booking.booking_id.slice(0, 8).toUpperCase() })}
          </p>
        </div>
      </div>

      {!cancelled && !past && (
        <p className="m-0 flex items-start gap-2 rounded-2xl bg-[#FAF9FE] px-4 py-3 text-[14px] text-[#4A4553]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7957FF]" aria-hidden="true" />
          {howItWorks(booking.consultation_mode)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          aria-expanded={chatOpen}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-bold transition-colors ${chatOpen ? "bg-[#7957FF] text-white" : "border border-[#D9D3E8] text-[#24212B] hover:border-[#7957FF] hover:text-[#7957FF]"}`}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {chatOpen ? t("account.appointments.hideChat") : t("account.appointments.messageAdvisor", { name: first })}
        </button>
        {!cancelled &&
          !past &&
          (confirming ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCancel(booking.booking_id)}
                className="h-10 rounded-xl bg-[#C23B3B] px-4 text-[14px] font-bold text-white hover:bg-[#A82F2F]"
              >
                {t("account.appointments.yesCancel")}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex h-10 items-center gap-1 px-2 text-[14px] font-semibold text-[#5A5566]"
              >
                <X className="h-4 w-4" aria-hidden="true" /> {t("account.appointments.keep")}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 rounded-xl border border-[#D9D3E8] px-4 text-[14px] font-semibold text-[#24212B] transition-colors hover:border-[#C23B3B] hover:text-[#C23B3B]"
            >
              {t("account.appointments.cancel")}
            </button>
          ))}
      </div>

      {chatOpen && (
        <ChatPanel
          endpoint={`/advisory/bookings/${booking.booking_id}/messages`}
          viewer="customer"
          otherName={booking.advisor_name}
          subtitle={t("account.appointments.chatSubtitle", { mode: modeText, slot: booking.slot_label })}
          starters={STARTER_KEYS.map((key) => t(key))}
          closed={cancelled}
        />
      )}
    </li>
  );
}

interface AppointmentsCardProps {
  bookings: Booking[];
  onCancel: (bookingId: string) => void;
}

export function AppointmentsCard({ bookings, onCancel }: AppointmentsCardProps) {
  const { t } = useI18n();
  const { upcoming, cancelled } = splitBookings(bookings);
  const ahead = upcoming.filter((b) => !b.phase || b.phase === "upcoming");
  const past = upcoming.filter((b) => b.phase === "past" || b.phase === "completed" || b.phase === "no_show");
  const groups: [MessageKey, Booking[]][] = [
    ["common.appointment.status.upcoming", ahead],
    ["account.appointments.past", past],
    ["common.appointment.status.cancelled", cancelled],
  ];
  return (
    <section className={CARD_CLASS} aria-label={t("account.appointments.label")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={SECTION_HEADING_CLASS}>{t("account.appointments.heading")}</h2>
        <Link href="/advisory" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#7957FF] hover:underline">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />{" "}
          {bookings.length > 0 ? t("account.appointments.bookAnother") : t("account.appointments.bookAdvisor")}
        </Link>
      </div>
      {bookings.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D9D3E8] bg-[#FAF9FE] px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#F4F0FF] text-[#7957FF]" aria-hidden="true">
            <CalendarPlus className="h-6 w-6" />
          </span>
          <p className="m-0 text-[17px] font-extrabold text-[#24212B]">{t("account.appointments.emptyTitle")}</p>
          <p className="m-0 max-w-sm text-[14.5px] text-[#5A5566]">{t("account.appointments.emptyBody")}</p>
          <Link
            href="/advisory"
            className="inline-flex h-11 items-center rounded-lg bg-[#7957FF] px-5 font-bold text-white hover:bg-[#6444E6]"
          >
            {t("account.appointments.choose")}
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {groups.map(
            ([titleKey, list]) =>
              list.length > 0 && (
                <div key={titleKey}>
                  <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">{t(titleKey)}</div>
                  <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
                    {list.map((booking) => (
                      <AppointmentRow key={booking.booking_id} booking={booking} onCancel={onCancel} />
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
      <p className="m-0 mt-5 text-[12.5px] text-[#6F6A7C]">{t("account.appointments.simulation")}</p>
    </section>
  );
}
