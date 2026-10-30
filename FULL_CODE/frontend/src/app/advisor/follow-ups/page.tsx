import { FollowUpsPage } from "@/components/advisor/followups/FollowUpsPage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorFollowUpsPage() {
  return <FollowUpsPage />;
}
