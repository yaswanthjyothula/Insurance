import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const metadata: Metadata = {
  title: "Admin console | LifeSure AI",
  description: "Live rules, rates and analytics for LifeSure AI administrators.",
  robots: { index: false, follow: false },
};

// Every page here sits behind the administrator sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
