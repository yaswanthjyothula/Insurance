import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = {
  title: "Dashboard | LifeSure AI",
  description: "Manage your Protection Passport, policies, vault and advisor appointments.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <AuthGuard>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 pt-11 pb-24 flex flex-col md:flex-row gap-8 md:gap-[clamp(24px,3vw,48px)] items-start">
          <DashboardSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </AuthGuard>
    </Suspense>
  );
}
