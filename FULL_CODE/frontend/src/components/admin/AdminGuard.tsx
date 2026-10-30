"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const ADMIN_SIGN_IN = "/admin-sign-in";

/** Keeps the console to signed-in administrators. This only decides what the browser shows: every /admin API call is checked again on the server. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`${ADMIN_SIGN_IN}?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[#6F6A7C]" role="status">
        Checking your session…
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-[#E8E5F0] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0FF] text-[#7957FF]" aria-hidden="true">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h1 className="m-0 text-xl font-extrabold text-[#24212B]">The admin console is for administrators</h1>
          <p className="m-0 text-sm text-[#6F6A7C]">You are signed in with a different kind of account.</p>
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace(`${ADMIN_SIGN_IN}?next=${encodeURIComponent(pathname)}`);
            }}
            className="w-full rounded-2xl bg-[#0E1330] px-5 py-3 text-sm font-bold text-white hover:bg-[#171B3D]"
          >
            Sign in as an administrator
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
