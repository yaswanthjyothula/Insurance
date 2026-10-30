"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Printer } from "lucide-react";
import type { Booking } from "@/types/api";
import type { SavedPlan } from "@/lib/my-plan";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAppointmentCopy } from "@/i18n/appointment";
import { useI18n } from "@/i18n/I18nProvider";
import { PlanSummary } from "@/components/advisory/PlanSummary";
import { SimulationNote } from "@/components/advisory/SimulationNote";
import { modeDetails } from "@/components/advisory/consultation-modes";
import { CARD_CLASS } from "@/components/advisory/styles";

interface BookingConfirmationProps {
  booking: Booking;
  plan: SavedPlan | null;
  onBookAnother: () => void;
}

const referenceOf = (booking: Booking) => booking.booking_id.slice(0, 8).toUpperCase();

export function BookingConfirmation({ booking, plan, onBookAnother }: BookingConfirmationProps) {
  const { t } = useI18n();
  const { howItWorks } = useAppointmentCopy();
  const firstName = booking.advisor_name.split(" ")[0];
  const mode = modeDetails(booking.consultation_mode);
  const modeText = t(mode.labelKey);
  const ModeIcon = mode.icon;
  const facts: { id: string; label: string; value: string }[] = [
    { id: "advisor", label: t("advisory.label.advisor"), value: booking.advisor_name },
    { id: "when", label: t("advisory.label.when"), value: booking.slot_label },
    { id: "how", label: t("advisory.label.how"), value: modeText },
    { id: "reference", label: t("advisory.label.reference"), value: referenceOf(booking) },
  ];

  return (
    <main className="flex-1 max-w-[1000px] w-full mx-auto px-5 sm:px-8 pt-10 pb-20 flex flex-col gap-7">
      <div
        className="rounded-3xl p-8 sm:p-10 text-white flex flex-col gap-5 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_8px_0_#5B3BE6,0_40px_70px_-34px_rgba(121,87,255,0.6)]"
        style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
      >
        <span className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#E9E4FF]">
          <CalendarCheck className="w-4 h-4" />
          {t("advisory.confirmation.badge")}
        </span>
        <h1 className="m-0 text-[clamp(28px,3.4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em]" style={{ color: "#FFFFFF" }}>
          {t("advisory.confirmation.title", { name: booking.advisor_name })}
        </h1>
        <dl className="m-0 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {facts.map(({ id, label, value }) => (
            <div key={id} className="rounded-xl bg-white/15 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E9E4FF]">{label}</dt>
              <dd className="m-0 text-lg font-extrabold mt-0.5 flex items-center gap-2">
                {id === "how" && <ModeIcon className="w-4 h-4" />}
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <SimulationNote />

      <section aria-label={t("advisory.confirmation.nextAria")} className={`${CARD_CLASS} p-6`}>
        <h2 className="m-0 text-lg font-extrabold">{t("advisory.confirmation.nextTitle")}</h2>
        <ol className="m-0 mt-4 grid list-none gap-4 p-0 sm:grid-cols-3">
          {[
            [t("advisory.confirmation.step1Title"), t("advisory.confirmation.step1Text", { name: firstName })],
            [t("advisory.confirmation.step2Title", { slot: booking.slot_label }), howItWorks(booking.consultation_mode)],
            [t("advisory.confirmation.step3Title"), t("advisory.confirmation.step3Text")],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F4F0FF] text-[13px] font-extrabold text-[#6240E6]"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span>
                <span className="block text-[15px] font-bold text-[#24212B]">{title}</span>
                <span className="block text-[14px] leading-relaxed text-[#5A5566]">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-7 items-start">
        <section aria-label={t("advisory.confirmation.chatAria")} className={`${CARD_CLASS} p-5 flex flex-col gap-3`} data-no-reveal>
          <h2 className="m-0 text-lg font-extrabold">{t("advisory.confirmation.chatTitle", { name: firstName })}</h2>
          <p className="m-0 text-[14px] text-[#5A5566]">{t("advisory.confirmation.chatIntro", { name: firstName })}</p>
          <ChatPanel
            endpoint={`/advisory/bookings/${booking.booking_id}/messages`}
            viewer="customer"
            otherName={booking.advisor_name}
            subtitle={t("advisory.confirmation.chatSubtitle", { mode: modeText, slot: booking.slot_label })}
            starters={[t("advisory.confirmation.starter1"), t("advisory.confirmation.starter2"), t("advisory.confirmation.starter3")]}
          />
        </section>
        <aside className="flex flex-col gap-4">
          <div className={`${CARD_CLASS} p-6`}>
            <PlanSummary plan={plan} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              className="h-12 rounded-lg bg-[#7957FF] text-white font-bold inline-flex items-center justify-center gap-2"
            >
              {t("advisory.confirmation.viewPlan")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-12 rounded-lg border border-[#D9D3E8] bg-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_0_#D9D3E8]"
            >
              <Printer className="w-4 h-4 text-[#7957FF]" />
              {t("advisory.confirmation.print")}
            </button>
            <button type="button" onClick={onBookAnother} className="text-[14px] font-semibold text-[#7957FF] hover:underline py-1">
              {t("advisory.confirmation.bookAnother")}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
