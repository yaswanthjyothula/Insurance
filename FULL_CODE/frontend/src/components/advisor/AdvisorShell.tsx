"use client";

import { useCallback, useState } from "react";
import { AdvisorMotion } from "@/components/advisor/motion";
import { MobileDrawer } from "@/components/advisor/MobileDrawer";
import { DesktopSidebar } from "@/components/advisor/Sidebar";
import { Topbar } from "@/components/advisor/Topbar";

/** Sidebar, sticky header and content area. The page itself scrolls normally; only the rail and header stay put. */
export function AdvisorShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    // data-no-reveal keeps the customer site's scroll-reveal script away from this area, which animates itself
    <AdvisorMotion>
      <div data-no-reveal className="flex min-h-screen bg-[#F8F7FC]">
        <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} />
          <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </AdvisorMotion>
  );
}
