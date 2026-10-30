import { AppointmentsPage } from "@/components/advisor/appointments/AppointmentsPage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorAppointmentsPage() {
  return <AppointmentsPage />;
}
