"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { TOOL_GUIDES } from "@/data/tools";

export function ToolShell({ slug, wide, children }: { slug: string; wide?: boolean; children: React.ReactNode }) {
  const g = TOOL_GUIDES[slug];
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-12 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>
      <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6F6A7C] hover:text-[#7957FF]">
        <ChevronLeft className="w-4 h-4" /> All tools
      </Link>
      <header className="mt-5 mb-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">{g.eyebrow}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#24212B] tracking-tight">{g.name}</h1>
        <p className="mt-3 text-base leading-7 text-[#4A4658]">{g.intro}</p>
      </header>
      {children}
      <ToolGuideSection slug={slug} />
    </div>
  );
}

function GuideBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="ls-spot rounded-2xl bg-white border border-[#D9D3E8] p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#7957FF]">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-[15px] leading-6 text-[#24212B]">{items.map((i) => <li key={i} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9D3E8]" />{i}</li>)}</ul>
    </div>
  );
}

function ToolGuideSection({ slug }: { slug: string }) {
  const g = TOOL_GUIDES[slug];
  return (
    <section className="mt-14 border-t border-[#D9D3E8] pt-8" aria-label="About this tool">
      <h2 className="text-xl font-extrabold text-[#24212B]">About this tool</h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4A4658]"><span className="font-semibold text-[#24212B]">Why use it: </span>{g.why}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <GuideBlock title="How it works" items={g.how} />
        <GuideBlock title="What it assumes" items={g.assumes} />
        <GuideBlock title="Where it stops" items={g.limits} />
      </div>
    </section>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ls-spot rounded-2xl bg-white border border-[#D9D3E8] p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold text-[#24212B]">{title}</h2>}
      {children}
    </div>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, format, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string; hint?: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-[#24212B]">{label}</label>
        <span className="text-base font-extrabold text-[#7957FF] tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label}
        className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer accent-[#7957FF]"
        style={{ background: `linear-gradient(to right,#7957FF ${pct}%,#E9E4FF ${pct}%)` }} />
      {hint && <p className="mt-1 text-sm text-[#6F6A7C]">{hint}</p>}
    </div>
  );
}

export function NumberField({ label, value, onChange, prefix = "₹", hint, min = 0 }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; hint?: string; min?: number }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#24212B]">{label}</label>
      <div className="mt-1.5 flex items-center rounded-xl border border-[#D9D3E8] bg-white focus-within:border-[#7957FF]">
        {prefix && <span className="pl-3 text-[#6F6A7C]">{prefix}</span>}
        <input type="number" inputMode="numeric" min={min} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-2.5 text-[15px] text-[#24212B] outline-none tabular-nums" />
      </div>
      {hint && <p className="mt-1 text-sm text-[#6F6A7C]">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#24212B]">{label}</p>
      <div className="mt-1.5 inline-flex rounded-xl border border-[#D9D3E8] bg-[#FAF9F6] p-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={value === o.value}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${value === o.value ? "bg-white text-[#7957FF] shadow-sm" : "text-[#6F6A7C] hover:text-[#24212B]"}`}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Number that eases to its new value */
export function Count({ value, format }: { value: number; format: (v: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage or fetched after mount
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const start = from.current, t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 450);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{format(shown)}</span>;
}

export function Figure({ label, children, sub, tone = "default" }: { label: string; children: React.ReactNode; sub?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const color = { default: "text-[#24212B]", good: "text-[#0E7A5F]", warn: "text-[#B25E09]", bad: "text-[#C0364B]" }[tone];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C]">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tracking-tight ${color}`}>{children}</p>
      {sub && <p className="mt-1 text-sm leading-5 text-[#4A4658]">{sub}</p>}
    </div>
  );
}

export function Verdict({ tone, children }: { tone: "good" | "warn" | "bad" | "info"; children: React.ReactNode }) {
  const c = { good: "bg-[#E7F6F0] border-[#BFE5D6] text-[#0B5E49]", warn: "bg-[#FFF3E0] border-[#F5D9A8] text-[#8A4B06]", bad: "bg-[#FDECEF] border-[#F3C3CC] text-[#9B2237]", info: "bg-[#E9E4FF] border-[#D9D3E8] text-[#24212B]" }[tone];
  return <div className={`ls-pop rounded-xl border px-4 py-3 text-[15px] leading-6 ${c}`}>{children}</div>;
}

export function Assumption({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-2 text-sm leading-5 text-[#6F6A7C]"><Info className="mt-0.5 w-4 h-4 shrink-0" />{children}</p>;
}
