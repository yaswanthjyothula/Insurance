"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MessageKey } from "@/i18n/en";
import { useT } from "@/i18n/I18nProvider";

const TABS: { href: string; labelKey: MessageKey }[] = [
  { href: "/dashboard", labelKey: "account.tabs.myPlan" },
  { href: "/dashboard/profile", labelKey: "account.tabs.profile" },
  { href: "/dashboard/settings", labelKey: "account.tabs.settings" },
];

export function AccountTabs() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav aria-label={t("account.tabs.label")} className="inline-flex gap-1 rounded-2xl border border-[#D9D3E8] bg-white p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-[#7957FF] text-white" : "text-[#5A5566] hover:bg-[#F4F0FF] hover:text-[#7957FF]"}`}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
