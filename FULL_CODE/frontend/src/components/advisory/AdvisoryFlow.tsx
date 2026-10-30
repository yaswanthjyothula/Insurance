"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useMyProfile } from "@/components/account/useMyProfile";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAssessmentStore } from "@/store/assessment-store";
import { summariseAssessment, summariseSelection } from "@/lib/my-plan";
import { BookingConfirmation } from "@/components/advisory/BookingConfirmation";
import { BookingFlow } from "@/components/advisory/BookingFlow";

/** Stage 4: shows the booking form, or the confirmation once the session store holds a booking. */
export function AdvisoryFlow() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { result, selection, booking, setBooking, clearBooking, isHydrated } = useAssessmentStore();
  const { data: account, error: accountError } = useMyProfile();
  const plan = useMemo(() => (selection.length > 0 ? summariseSelection(selection) : null), [selection]);

  // The form starts from what the customer saved in Profile and Settings, so it waits for those (or for them to fail to load)
  if (!isHydrated || !user || (!account && !accountError)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status">
        <RefreshCw className="w-6 h-6 text-[#7957FF] animate-spin" aria-label={t("advisory.loadingLabel")} />
      </div>
    );
  }

  const assessment = result ? summariseAssessment(result) : null;
  const customerName = user.user_metadata.full_name;

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={4} />
      {booking ? (
        <BookingConfirmation booking={booking} plan={plan} onBookAnother={clearBooking} />
      ) : (
        <BookingFlow
          customerName={customerName}
          assessmentId={assessment?.assessment_id}
          plan={plan}
          onBooked={setBooking}
          defaults={{
            phone: account?.preferences.phone ?? "",
            mode: account?.preferences.preferred_mode ?? "",
            shareSummary: account?.preferences.share_summary_default ?? false,
            myAdvisorId: account?.advisor?.advisor_id,
          }}
        />
      )}
    </div>
  );
}
