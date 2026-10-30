import { Suspense } from "react";
import type { Metadata } from "next";
import { AdvisorSignIn } from "@/components/advisor/AdvisorSignIn";

export const metadata: Metadata = {
  title: "Advisor sign in | LifeSure AI",
  description: "Sign in to the LifeSure AI advisor portal.",
  robots: { index: false, follow: false },
};

export default function AdvisorSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdvisorSignIn />
    </Suspense>
  );
}
