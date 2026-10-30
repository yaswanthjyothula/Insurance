"use client";

import { CalendarRange } from "lucide-react";
import { m } from "motion/react";
import { EASE } from "@/components/advisor/motion";
import { EmptyState, Panel, SimulatedTag } from "@/components/advisor/dashboard/parts";
import type { DayLoad } from "@/types/advisor";

const BAR_AREA_PX = 120;

/** Booked consultations per day. Bars grow with a transform, so nothing reflows while they animate. */
export function AppointmentLoad({ days, openSlots, note }: { days: DayLoad[]; openSlots: number; note: string | null }) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const peak = Math.max(1, ...days.map((d) => d.count));
  const summary = `Booked consultations over the next ${days.length} days: ${total} in total.`;

  return (
    <Panel title="Appointment load" aside={<SimulatedTag />} className="h-full">
      {total === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title={`No consultations booked in the next ${days.length} days`}
          hint="When customers book you in the customer app, the days fill in here."
        />
      ) : (
        <div role="img" aria-label={summary} className="flex items-end gap-1.5 sm:gap-2" style={{ height: BAR_AREA_PX + 28 }}>
          {days.map((day, index) => (
            <div
              key={day.date}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              title={`${day.label}: ${day.count}`}
            >
              <span className="text-[10px] font-semibold text-[#6F6A7C]">{day.count || ""}</span>
              <m.div
                className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-[#6240E6] to-[#9A80FF]"
                style={{ height: Math.max(day.count ? 6 : 2, (day.count / peak) * BAR_AREA_PX), opacity: day.count ? 1 : 0.25 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.05 * Math.min(index, 8) }}
              />
              <span className="hidden text-[10px] text-[#8A849A] sm:block">{day.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      )}
      <p className="m-0 mt-4 text-xs text-[#6F6A7C]">
        <strong className="font-bold text-[#24212B]">{openSlots}</strong> open slots left in the sample calendar.
        {note ? ` ${note}` : ""}
      </p>
    </Panel>
  );
}
