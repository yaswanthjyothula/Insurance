import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdvisoryFlow } from "@/components/advisory/AdvisoryFlow";

export const metadata: Metadata = {
  title: "Book an advisor | LifeSure AI",
  description: "Book a simulated session with one of our sample advisors.",
};

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisoryPage() {
  return (
    <AuthGuard>
      <AdvisoryFlow />
    </AuthGuard>
  );
}
