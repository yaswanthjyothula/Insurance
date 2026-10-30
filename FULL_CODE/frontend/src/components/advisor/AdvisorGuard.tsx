"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { advisorSignInPathFor } from "@/components/auth/session-helpers";

/**
 * Keeps the advisor area to signed-in advisors. This only decides what the browser shows:
 * every /advisor API call is checked again on the server, so a customer who gets past this still receives nothing.
 */
export function AdvisorGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(advisorSignInPathFor(pathname));
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#6F6A7C]" role="status">
        Checking your session…
      </div>
    );
  }

  if (user.role !== "advisor") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center space-y-4 rounded-3xl border border-[#E8E5F0] bg-white p-8 shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0FF] text-[#7957FF]" aria-hidden="true">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <h1 className="m-0 text-xl font-extrabold text-[#24212B]">The advisor workspace is for advisors</h1>
          <p className="m-0 text-sm text-[#6F6A7C]">You are signed in as a customer. Sign in with an advisor account to open it.</p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace(advisorSignInPathFor(pathname));
              }}
              className="rounded-2xl bg-[#171B3D] px-5 py-3 text-sm font-bold text-white hover:bg-[#232857] transition-colors"
            >
              Sign in as an advisor
            </button>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#D9D3E8] px-5 py-3 text-sm font-semibold text-[#24212B] hover:bg-[#FAF9F6]"
            >
              Back to my plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
