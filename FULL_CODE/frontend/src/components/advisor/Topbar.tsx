"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { breadcrumbsFor } from "@/components/advisor/nav";
import { ProfileMenu } from "@/components/advisor/ProfileMenu";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const crumbs = breadcrumbsFor(usePathname());
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#E8E5F0] bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="-ml-1 rounded-lg p-2 text-[#24212B] transition-colors hover:bg-[#F4F0FF] lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="m-0 flex list-none items-center gap-1.5 p-0 text-sm">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <Fragment key={crumb.href + crumb.label}>
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#A59FB5]" aria-hidden="true" />}
                <li className="min-w-0 truncate">
                  {last ? (
                    <span aria-current="page" className="font-bold text-[#24212B]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="font-medium text-[#6F6A7C] transition-colors hover:text-[#7957FF]">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
      <ProfileMenu />
    </header>
  );
}
