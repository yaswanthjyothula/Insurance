"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInPathFor } from "@/components/auth/session-helpers";
import { useT } from "@/i18n/I18nProvider";

/** Sends signed-out visitors to /sign-in and brings them back afterwards. Children mount only once signed in, so they never fetch as a guest. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();

  useEffect(() => {
    if (!loading && !user) router.replace(signInPathFor(pathname));
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#6F6A7C]" role="status">
        {t("auth.session.checking")}
      </div>
    );
  }
  return <>{children}</>;
}
