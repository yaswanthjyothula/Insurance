"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { initials } from "@/components/advisor/format";

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => !wrapRef.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = user.user_metadata.full_name;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-[#E8E5F0] bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-[#D2C8F5]"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171B3D] text-xs font-bold text-white"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-[#24212B] sm:block">{name}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#6F6A7C] transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right rounded-2xl border border-[#E8E5F0] bg-white p-2 shadow-[0_20px_50px_-12px_rgba(23,27,61,0.25)]"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 py-2">
              <p className="m-0 truncate text-sm font-bold text-[#24212B]">{name}</p>
              <p className="m-0 mt-0.5 text-xs text-[#6F6A7C]">
                {user.advisorId ?? "Advisor"}
                {user.demo ? " · demo account" : ""}
              </p>
            </div>
            <div className="my-1 h-px bg-[#F1EDFC]" />
            <Link
              href="/"
              role="menuitem"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#24212B] transition-colors hover:bg-[#F8F7FC]"
            >
              <ExternalLink className="h-4 w-4 text-[#6F6A7C]" aria-hidden="true" />
              Customer site
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                signOut();
                router.replace("/advisor-sign-in");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#C23B3B] transition-colors hover:bg-[#FDF2F2]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
