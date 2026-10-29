"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BadgeCheck, FileText, Vault, CalendarClock, SlidersHorizontal, Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const groups = [
  {
    label: "Workspace",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Protection Passport", href: "/dashboard/protection-passport", icon: BadgeCheck },
      { name: "Policies", href: "/dashboard/policies", icon: FileText },
      { name: "Emergency Vault", href: "/dashboard/insurance-vault", icon: Vault },
    ],
  },
  {
    label: "Advice",
    items: [
      { name: "Appointments", href: "/dashboard/appointments", icon: CalendarClock },
      { name: "Scenario Studio", href: "/tools/scenario-studio", icon: SlidersHorizontal },
      { name: "All Tools", href: "/tools", icon: Wrench },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Account";

  return (
    <aside className="md:w-[clamp(200px,22vw,280px)] shrink-0 md:sticky md:top-28 md:self-start flex flex-col gap-7">
      <div className="hidden md:flex items-center gap-3.5 pb-6 border-b border-[#D9D3E8]">
        <span
          className="flex-none w-[52px] h-[52px] rounded-full grid place-items-center text-white font-extrabold text-xl uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_12px_20px_-8px_rgba(121,87,255,0.6)]"
          style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}
        >
          {name[0]}
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-[17px] truncate">{name}</span>
          <span className="text-sm text-[#5A5566] truncate">{user?.email}</span>
        </div>
      </div>

      <nav className="flex md:flex-col gap-1.5 md:gap-7 overflow-x-auto md:overflow-visible pb-2 md:pb-0" aria-label="Dashboard">
        {groups.map((g) => (
          <div key={g.label} className="flex md:flex-col gap-1.5">
            <span className="hidden md:block text-[12.5px] font-bold tracking-[0.2em] uppercase text-[#7957FF] px-3.5 pb-1.5">{g.label}</span>
            {g.items.map(({ name: n, href, icon: Icon, exact }) => {
              const on = active(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3.5 h-[50px] px-3.5 rounded-[10px] text-base font-semibold whitespace-nowrap border transition-all ${
                    on
                      ? "bg-[#7957FF] text-white border-[#7957FF]"
                      : "border-transparent text-[#24212B] hover:bg-white hover:border-[#D9D3E8]"
                  }`}
                >
                  <span className={`w-[30px] h-[30px] rounded-lg grid place-items-center text-[13px] font-extrabold ${on ? "bg-[rgba(255,255,255,0.2)] text-white" : "bg-white text-[#7957FF]"}`}><Icon className="w-[17px] h-[17px]" strokeWidth={1.9} /></span>
                  {n}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button onClick={signOut} className="hidden md:flex items-center gap-3.5 h-[50px] px-3.5 text-base font-semibold text-[#5A5566] hover:text-[#24212B]">
        <span className="w-[30px] h-[30px] rounded-lg grid place-items-center bg-white border border-[#D9D3E8] text-[#7957FF]"><LogOut className="w-[17px] h-[17px]" strokeWidth={1.9} /></span>
        Sign out
      </button>
    </aside>
  );
}
