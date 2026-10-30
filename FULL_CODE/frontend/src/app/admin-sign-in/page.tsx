import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminSignIn } from "@/components/admin/AdminSignIn";

export const metadata: Metadata = {
  title: "Admin sign in | LifeSure AI",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminSignIn />
    </Suspense>
  );
}
