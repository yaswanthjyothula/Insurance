"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/** Sends signed-out visitors to /sign-in and brings them back afterwards. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  const ready = !loading && Boolean(user);

  return (
    <>
      {!ready && (
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#6F6A7C]">
          Checking your session…
        </div>
      )}
      <div hidden={!ready}>{children}</div>
    </>
  );
}
