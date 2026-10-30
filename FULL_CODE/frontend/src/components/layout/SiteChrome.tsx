"use client";

import { usePathname } from "next/navigation";

/** The customer site's header and footer. The advisor workspace has its own shell, so they are left out there. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/advisor") || pathname.startsWith("/admin") ? null : <>{children}</>;
}
