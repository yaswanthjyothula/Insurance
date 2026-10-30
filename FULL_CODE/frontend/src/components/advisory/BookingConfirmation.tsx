import Link from "next/link";
import { ArrowRight, CalendarCheck, Printer } from "lucide-react";
import type { Booking } from "@/types/api";
import type { SavedPlan } from "@/lib/my-plan";
import { DemoChat } from "@/components/advisory/DemoChat";
import { PlanSummary } from "@/components/advisory/PlanSummary";
import { SimulationNote } from "@/components/advisory/SimulationNote";
import { modeDetails } from "@/components/advisory/consultation-modes";
import { CARD_CLASS } from "@/components/advisory/styles";

interface BookingConfirmationProps {
  booking: Booking;
  customerName: string;
  coverGap: number | null;
  plan: SavedPlan | null;
  onBookAnother: () => void;
}

const referenceOf = (booking: Booking) => booking.booking_id.slice(0, 8).toUpperCase();

export function BookingConfirmation({ booking, customerName, coverGap, plan, onBookAnother }: BookingConfirmationProps) {
  const mode = modeDetails(booking.consultation_mode);
  const ModeIcon = mode.icon;
  const facts: [string, string][] = [
    ["Advisor", booking.advisor_name],
    ["When", booking.slot_label],
    ["How", mode.label],
    ["Reference", referenceOf(booking)],
  ];

  return (
    <main className="flex-1 max-w-[1000px] w-full mx-auto px-5 sm:px-8 pt-10 pb-20 flex flex-col gap-7">
      <div
        className="rounded-3xl p-8 sm:p-10 text-white flex flex-col gap-5 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_8px_0_#5B3BE6,0_40px_70px_-34px_rgba(121,87,255,0.6)]"
        style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
      >
        <span className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#E9E4FF]">
          <CalendarCheck className="w-4 h-4" />
          Session booked (simulation)
        </span>
        <h1 className="m-0 text-[clamp(28px,3.4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em]" style={{ color: "#FFFFFF" }}>
          You&apos;re booked with {booking.advisor_name}
        </h1>
        <dl className="m-0 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {facts.map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white/15 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E9E4FF]">{key}</dt>
              <dd className="m-0 text-lg font-extrabold mt-0.5 flex items-center gap-2">
                {key === "How" && <ModeIcon className="w-4 h-4" />}
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <SimulationNote />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-7 items-start">
        <DemoChat advisorName={booking.advisor_name} customerName={customerName} coverGap={coverGap} plan={plan} />
        <aside className="flex flex-col gap-4">
          <div className={`${CARD_CLASS} p-6`}>
            <PlanSummary plan={plan} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              className="h-12 rounded-lg bg-[#7957FF] text-white font-bold inline-flex items-center justify-center gap-2"
            >
              View my plan
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-12 rounded-lg border border-[#D9D3E8] bg-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_0_#D9D3E8]"
            >
              <Printer className="w-4 h-4 text-[#7957FF]" />
              Print this summary
            </button>
            <button type="button" onClick={onBookAnother} className="text-[14px] font-semibold text-[#7957FF] hover:underline py-1">
              Book another session
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
