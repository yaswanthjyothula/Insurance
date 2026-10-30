"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppointmentsCard } from "@/components/dashboard/AppointmentsCard";
import { CoverNeedCard } from "@/components/dashboard/CoverNeedCard";
import { SavedPlanCard } from "@/components/dashboard/SavedPlanCard";
import { CARD_CLASS } from "@/components/dashboard/cards";
import { useMyPlan } from "@/components/dashboard/useMyPlan";

export function MyPlanPage() {
  const { user } = useAuth();
  const { saved, bookings, loading, error, reload, removePlan, cancelBooking } = useMyPlan();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#24212B]">My plan</h1>
        <p className="m-0 mt-2 text-[16px] text-[#5A5566]">
          {user ? `Hi ${user.user_metadata.full_name}. ` : ""}Your cover need, the plan you chose and your advisor appointments, all in one
          place.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[#C23B3B] text-[#C23B3B] font-semibold"
        >
          <span>{error}</span>
          <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 underline">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className={`${CARD_CLASS} flex items-center gap-3 text-[#5A5566]`} role="status">
          <Loader2 className="w-5 h-5 animate-spin text-[#7957FF]" />
          Loading your plan…
        </div>
      ) : (
        saved && (
          <>
            <CoverNeedCard assessment={saved.assessment} />
            <SavedPlanCard plan={saved.plan} hasAssessment={Boolean(saved.assessment)} onRemove={removePlan} />
            <AppointmentsCard bookings={bookings} onCancel={cancelBooking} />
          </>
        )
      )}
    </div>
  );
}
