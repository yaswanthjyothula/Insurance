import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import type { Source } from "@/data/resources";

export function ResourcePage({ eyebrow, title, intro, children, narrow }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-12 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>
      <Link href="/resources" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6F6A7C] hover:text-[#7957FF]">
        <ChevronLeft className="w-4 h-4" /> All resources
      </Link>
      <header className="mt-5 mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#24212B] tracking-tight">{title}</h1>
        <p className="mt-3 text-base leading-7 text-[#4A4658]">{intro}</p>
      </header>
      {children}
    </div>
  );
}

export function SourceLinks({ sources, label = "Sources" }: { sources: Source[]; label?: string }) {
  if (!sources.length) return null;
  return (
    <p className="text-sm text-[#6F6A7C] leading-6">
      <span className="font-semibold text-[#24212B]">{label}: </span>
      {sources.map((s, i) => (
        <span key={s.href}>
          {i > 0 && " · "}
          <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[#7957FF] underline underline-offset-2 hover:text-[#5E3FE0] inline-flex items-center gap-0.5">
            {s.label}
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </span>
      ))}
    </p>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#E9E4FF] border border-[#D9D3E8] px-5 py-4 text-sm leading-6 text-[#24212B]">{children}</div>;
}
