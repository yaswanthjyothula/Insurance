import { CalendarX2 } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#ECE8F6] motion-reduce:animate-none ${className}`} />;
}

/** The white card every dashboard section sits in. */
export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-[0_1px_2px_rgba(23,27,61,0.04)] sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-bold tracking-tight text-[#24212B]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, hint, icon: Icon = CalendarX2 }: { title: string; hint: string; icon?: typeof CalendarX2 }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#D9D3E8] bg-[#FBFAFE] px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F0FF] text-[#7957FF]" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <p className="m-0 text-sm font-semibold text-[#24212B]">{title}</p>
      <p className="m-0 max-w-xs text-xs text-[#6F6A7C]">{hint}</p>
    </div>
  );
}

export function SimulatedTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      Simulated
    </span>
  );
}
