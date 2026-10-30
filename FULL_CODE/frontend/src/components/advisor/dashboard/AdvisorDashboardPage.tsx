"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { m } from "motion/react";
import { Reveal, rise, stagger } from "@/components/advisor/motion";
import { AppointmentLoad } from "@/components/advisor/dashboard/AppointmentLoad";
import { RecentActivity, UpcomingAppointments } from "@/components/advisor/dashboard/AppointmentsAndActivity";
import { GapDistribution } from "@/components/advisor/dashboard/GapDistribution";
import { KpiGrid } from "@/components/advisor/dashboard/KpiGrid";
import { Skeleton } from "@/components/advisor/dashboard/parts";
import { useAdvisorDashboard } from "@/components/advisor/dashboard/useAdvisorDashboard";

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[122px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function AdvisorDashboardPage() {
  const { data, loading, error, reload } = useAdvisorDashboard();

  if (loading && !data) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div role="alert" className="mx-auto mt-10 max-w-md space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
        <p className="m-0 text-sm font-semibold text-rose-800">{error ?? "Your dashboard isn't available right now."}</p>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#232857]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  const { advisor } = data;
  return (
    <div className="space-y-6">
      <m.header variants={stagger} initial="hidden" animate="show" className="space-y-1">
        <m.h1 variants={rise} className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">
          Welcome back, {advisor.advisor_name.split(" ")[0]}
        </m.h1>
        <m.p variants={rise} className="m-0 text-sm text-[#6F6A7C]">
          {advisor.specialisations.map((s) => s.replace(/_/g, " ")).join(" · ")} · {advisor.years_experience} years · rated {advisor.rating}
        </m.p>
        <m.p variants={rise} className="m-0 text-xs text-[#8A849A]">
          Demo workspace: customers and the calendar are synthetic, and appointments are simulated. Nobody is notified.
        </m.p>
      </m.header>

      <KpiGrid kpis={data.kpis} />

      <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <AppointmentLoad days={data.appointment_load} openSlots={data.open_slots} note={data.calendar_note} />
        </div>
        <GapDistribution bands={data.gap_distribution} totalGap={data.total_protection_gap_inr} />
      </Reveal>

      <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingAppointments items={data.upcoming_appointments} />
        <RecentActivity items={data.recent_activity} />
      </Reveal>
    </div>
  );
}
