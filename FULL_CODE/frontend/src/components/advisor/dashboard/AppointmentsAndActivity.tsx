"use client";

import Link from "next/link";
import { CalendarCheck2, History } from "lucide-react";
import { m } from "motion/react";
import { formatWhen, initials } from "@/components/advisor/format";
import { rise, stagger } from "@/components/advisor/motion";
import { EmptyState, Panel, SimulatedTag } from "@/components/advisor/dashboard/parts";
import type { ActivityItem, AppointmentItem } from "@/types/advisor";

export function UpcomingAppointments({ items }: { items: AppointmentItem[] }) {
  return (
    <Panel title="Upcoming appointments" aside={<SimulatedTag />} className="h-full">
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="Nothing booked yet"
          hint="Consultations that customers book with you will be listed here, soonest first."
        />
      ) : (
        <m.ul variants={stagger} initial="hidden" animate="show" className="m-0 list-none space-y-2 p-0">
          {items.map((item) => (
            <m.li key={item.booking_id} variants={rise}>
              <Link
                href={`/advisor/appointments/${encodeURIComponent(item.booking_id)}`}
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-[#E8E5F0] hover:bg-[#FBFAFE]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F0FF] text-xs font-bold text-[#6240E6]"
                  aria-hidden="true"
                >
                  {initials(item.customer_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#24212B]">{item.customer_name}</span>
                  <span className="block truncate text-xs text-[#6F6A7C]">
                    {item.slot_label} · {item.consultation_mode}
                  </span>
                </span>
              </Link>
            </m.li>
          ))}
        </m.ul>
      )}
    </Panel>
  );
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Panel title="Recent customer activity" className="h-full">
      {items.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" hint="Bookings and cancellations by your customers show up here." />
      ) : (
        <m.ol variants={stagger} initial="hidden" animate="show" className="m-0 list-none space-y-4 border-l border-[#E8E5F0] p-0 pl-5">
          {items.map((item, index) => (
            <m.li key={`${item.at}-${index}`} variants={rise} className="relative">
              <span
                className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${item.status === "cancelled" ? "bg-[#C4BFD3]" : "bg-[#7957FF]"}`}
                aria-hidden="true"
              />
              <p className="m-0 text-sm text-[#24212B]">{item.summary}</p>
              <p className="m-0 mt-0.5 text-xs text-[#8A849A]">{formatWhen(item.at)}</p>
            </m.li>
          ))}
        </m.ol>
      )}
    </Panel>
  );
}
