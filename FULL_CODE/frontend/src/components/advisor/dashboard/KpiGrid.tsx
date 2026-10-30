"use client";

import Link from "next/link";
import { CalendarClock, ClipboardCheck, ClipboardList, Users, type LucideIcon } from "lucide-react";
import { m } from "motion/react";
import { AnimatedNumber } from "@/components/advisor/AnimatedNumber";
import { rise, stagger } from "@/components/advisor/motion";
import type { Kpi } from "@/types/advisor";

const ICONS: Record<string, LucideIcon> = {
  customers: Users,
  appointments: CalendarClock,
  to_update: ClipboardCheck,
  follow_ups: ClipboardList,
};

const HREFS: Record<string, string> = {
  customers: "/advisor/customers",
  appointments: "/advisor/appointments",
  to_update: "/advisor/appointments?scope=past",
  follow_ups: "/advisor/follow-ups",
};

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <m.ul
      variants={stagger}
      initial="hidden"
      animate="show"
      className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const Icon = ICONS[kpi.key] ?? ClipboardList;
        const tracked = kpi.value !== null;
        return (
          <m.li
            key={kpi.key}
            variants={rise}
            className="group relative rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-[0_1px_2px_rgba(23,27,61,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D2C8F5] hover:shadow-[0_12px_28px_-12px_rgba(121,87,255,0.25)] motion-reduce:hover:translate-y-0"
          >
            {HREFS[kpi.key] && <Link href={HREFS[kpi.key]} aria-label={`${kpi.label}: open`} className="absolute inset-0 rounded-2xl" />}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6F6A7C]">{kpi.label}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${tracked ? "bg-[#F4F0FF] text-[#7957FF]" : "bg-[#F4F3F7] text-[#A59FB5]"}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className={`m-0 mt-3 text-3xl font-extrabold tracking-tight ${tracked ? "text-[#171B3D]" : "text-[#C4BFD3]"}`}>
              {tracked ? <AnimatedNumber value={kpi.value as number} /> : <span aria-label="Not tracked yet">—</span>}
            </p>
            {kpi.note && <p className="m-0 mt-1 text-xs text-[#8A849A]">{kpi.note}</p>}
          </m.li>
        );
      })}
    </m.ul>
  );
}
