import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { Booking } from "@/types/api";
import { CARD_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { formatSavedDate, splitBookings } from "@/components/dashboard/dashboard-helpers";
import { modeDetails } from "@/components/advisory/consultation-modes";

function AppointmentRow({ booking, onCancel }: { booking: Booking; onCancel: (bookingId: string) => void }) {
  const cancelled = booking.status === "cancelled";
  const confirmCancel = () => {
    if (window.confirm("Cancel this appointment?")) onCancel(booking.booking_id);
  };
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9D3E8] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[#E9E4FF] text-[#7957FF]">
          <CalendarClock className="w-5 h-5" />
        </span>
        <div>
          <div className="font-bold text-[#24212B]">{booking.advisor_name}</div>
          <div className="text-[14px] text-[#5A5566]">
            {booking.slot_label} · {modeDetails(booking.consultation_mode).label}
          </div>
          <div className="text-[12.5px] text-[#6F6A7C]">
            Booked {formatSavedDate(booking.created_at)} · ref {booking.booking_id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
      {cancelled ? (
        <span className="text-[13px] font-semibold text-[#6F6A7C]">Cancelled</span>
      ) : (
        <button
          type="button"
          onClick={confirmCancel}
          className="h-10 px-4 rounded-lg border border-[#D9D3E8] text-[14px] font-semibold hover:border-[#C23B3B] hover:text-[#C23B3B]"
        >
          Cancel
        </button>
      )}
    </li>
  );
}

interface AppointmentsCardProps {
  bookings: Booking[];
  onCancel: (bookingId: string) => void;
}

export function AppointmentsCard({ bookings, onCancel }: AppointmentsCardProps) {
  const { upcoming, cancelled } = splitBookings(bookings);
  const groups: [string, Booking[]][] = [
    ["Upcoming", upcoming],
    ["Cancelled", cancelled],
  ];
  return (
    <section className={CARD_CLASS} aria-label="Appointments">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={SECTION_HEADING_CLASS}>3. Your appointments</h2>
        <Link href="/advisory" className="text-[14px] font-bold text-[#7957FF] hover:underline">
          Book {bookings.length > 0 ? "another" : "an advisor"}
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="m-0 mt-3 text-[16px] text-[#5A5566]">No appointments yet. Book a session and it will appear here.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-5">
          {groups.map(
            ([title, list]) =>
              list.length > 0 && (
                <div key={title}>
                  <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">{title}</div>
                  <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-2.5">
                    {list.map((booking) => (
                      <AppointmentRow key={booking.booking_id} booking={booking} onCancel={onCancel} />
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
      <p className="m-0 mt-4 text-[12.5px] text-[#6F6A7C]">Bookings are a simulation: no real advisor is notified.</p>
    </section>
  );
}
