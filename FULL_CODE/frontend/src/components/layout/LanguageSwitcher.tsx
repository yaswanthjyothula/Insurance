"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, languageInfo } from "@/i18n/languages";
import { useI18n } from "@/i18n/I18nProvider";

/** Picks the language the whole customer site is shown in. Every name is written in its own script so people can find theirs. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => !wrap.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${languageInfo(lang).name}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D3E8] bg-white px-3 py-1.5 text-xs font-bold text-[#24212B] transition-colors hover:border-[#7957FF]"
      >
        <Globe className="h-3.5 w-3.5 text-[#7957FF]" aria-hidden="true" />
        <span>{languageInfo(lang).native}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Choose a language"
          className="absolute end-0 top-[calc(100%+8px)] z-[70] m-0 max-h-[70vh] w-52 list-none overflow-y-auto rounded-2xl border border-[#D9D3E8] bg-white p-1.5 shadow-[0_20px_50px_rgba(121,87,255,0.2)]"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                lang={l.code}
                dir={l.dir}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-sm transition-colors ${l.code === lang ? "bg-[#F4F0FF] font-bold text-[#6240E6]" : "text-[#24212B] hover:bg-[#F8F7FC]"}`}
              >
                <span>
                  {l.native}
                  {l.code !== "en" && <span className="ms-2 text-[11px] font-normal text-[#8A849A]">{l.name}</span>}
                </span>
                {l.code === lang && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
