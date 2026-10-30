import { AdvisorSettingsPage } from "@/components/advisor/settings/SettingsPage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorMySettingsPage() {
  return <AdvisorSettingsPage />;
}
