"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";
import { X } from "lucide-react";
import { EASE } from "@/components/advisor/motion";
import { SidebarBrand, SidebarNav } from "@/components/advisor/Sidebar";

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Advisor navigation">
          <m.div
            className="absolute inset-0 bg-[#0E1330]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <m.aside
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-[#0E1330] shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav group="drawer" onNavigate={onClose} />
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
