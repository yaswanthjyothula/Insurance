"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Accessible dialog frame: Escape closes it, focus moves in, and the page behind does not scroll. */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#24212B]/60 p-4 sm:p-8"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-4 w-full ${wide ? "max-w-6xl" : "max-w-3xl"} rounded-3xl border border-[#D9D3E8] bg-white p-6 shadow-2xl outline-none sm:p-8`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="m-0 text-2xl font-extrabold tracking-tight text-[#24212B]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-[#6F6A7C] hover:bg-[#F1EEF8]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
