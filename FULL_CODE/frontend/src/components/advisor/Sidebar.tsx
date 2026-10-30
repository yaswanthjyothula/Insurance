"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "lucide-react";
import { m } from "motion/react";
import { ADVISOR_HOME, ADVISOR_NAV, isActive } from "@/components/advisor/nav";
import { ShieldIcon } from "@/components/brand/Logo";

interface SidebarNavProps {
  /** Icons only. The mobile drawer is never collapsed. */
  collapsed?: boolean;
  /** Distinguishes the two copies (desktop rail, mobile drawer) so their active markers animate independently. */
  group: string;
  onNavigate?: () => void;
}

/** The navigation list, shared by the desktop rail and the mobile drawer. */
export function SidebarNav({ collapsed = false, group, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Advisor" className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="m-0 list-none space-y-1 p-0">
        {ADVISOR_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.ready && isActive(item.href, pathname);
          const body = (
            <>
              {active && (
                <m.span
                  layoutId={`${group}-active`}
                  className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-inset ring-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  aria-hidden="true"
                >
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#9A80FF]" />
                </m.span>
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className={`relative truncate ${collapsed ? "sr-only" : ""}`}>{item.label}</span>
              {!item.ready && !collapsed && (
                <span className="relative ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  Soon
                </span>
              )}
            </>
          );
          const base = `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${collapsed ? "justify-center" : ""}`;
          return (
            <li key={item.href}>
              {item.ready ? (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`${base} transition-colors ${active ? "text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  {body}
                </Link>
              ) : (
                <span aria-disabled="true" title={`${item.label} (coming soon)`} className={`${base} cursor-not-allowed text-white/35`}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href={ADVISOR_HOME} className="flex items-center gap-3 px-5 py-5 text-white" aria-label="LifeSure AI advisor workspace">
      <ShieldIcon className="h-11 w-auto shrink-0 drop-shadow-[0_0_14px_rgba(121,87,255,0.5)]" />
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-base font-extrabold tracking-tight">LifeSure AI</span>
          <span className="block text-[11px] font-medium text-white/55">Advisor workspace</span>
        </span>
      )}
    </Link>
  );
}

export function DesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0E1330] transition-[width] duration-300 ease-out motion-reduce:transition-none lg:flex ${collapsed ? "w-[76px]" : "w-[280px]"}`}
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} group="rail" />
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronsLeft
            className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${collapsed ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
