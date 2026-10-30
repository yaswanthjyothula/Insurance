"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAssessmentStore } from "@/store/assessment-store";
import { summariseAssessment, summariseSelection } from "@/lib/my-plan";
import { BookingConfirmation } from "@/components/advisory/BookingConfirmation";
import { BookingFlow } from "@/components/advisory/BookingFlow";

/** Stage 4: shows the booking form, or the confirmation once the session store holds a booking. */
export function AdvisoryFlow() {
  const { user } = useAuth();
  const { result, selection, booking, setBooking, clearBooking, isHydrated } = useAssessmentStore();
  const plan = useMemo(() => (selection.length > 0 ? summariseSelection(selection) : null), [selection]);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status">
        <RefreshCw className="w-6 h-6 text-[#7957FF] animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const assessment = result ? summariseAssessment(result) : null;
  const customerName = user.user_metadata.full_name;

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={4} />
      {booking ? (
        <BookingConfirmation
          booking={booking}
          customerName={customerName}
          coverGap={assessment?.net_coverage_gap ?? null}
          plan={plan}
          onBookAnother={clearBooking}
        />
      ) : (
        <BookingFlow customerName={customerName} assessmentId={assessment?.assessment_id} plan={plan} onBooked={setBooking} />
      )}
    </div>
  );
}
