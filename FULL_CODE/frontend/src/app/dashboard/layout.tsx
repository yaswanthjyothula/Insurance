import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "My plan | LifeSure AI",
  description: "Your saved cover need, chosen plan and advisor appointments.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <AuthGuard>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-24">{children}</div>
      </AuthGuard>
    </Suspense>
  );
}
