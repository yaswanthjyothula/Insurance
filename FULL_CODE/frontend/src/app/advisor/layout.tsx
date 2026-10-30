import { Suspense } from "react";
import type { Metadata } from "next";
import { AdvisorGuard } from "@/components/advisor/AdvisorGuard";
import { AdvisorShell } from "@/components/advisor/AdvisorShell";

export const metadata: Metadata = {
  title: "Advisor workspace | LifeSure AI",
  description: "Customers, protection gaps and consultations for LifeSure AI advisors.",
  robots: { index: false, follow: false },
};

// Every page here sits behind the advisor sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AdvisorGuard>
        <AdvisorShell>{children}</AdvisorShell>
      </AdvisorGuard>
    </Suspense>
  );
}
