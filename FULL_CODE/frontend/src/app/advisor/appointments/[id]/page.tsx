import { AppointmentDetailPage } from "@/components/advisor/appointments/AppointmentDetailPage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorAppointmentPage() {
  return <AppointmentDetailPage />;
}
