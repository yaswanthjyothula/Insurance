"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY } from "@/data/resources";
import { ResourcePage, SourceLinks } from "@/components/resources/parts";

const GROUPS = ["All", ...Array.from(new Set(GLOSSARY.map((g) => g.group)))];

export default function GlossaryPage() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return GLOSSARY.filter(
      (g) => (group === "All" || g.group === group) && (!s || g.term.toLowerCase().includes(s) || g.meaning.toLowerCase().includes(s)),
    ).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, group]);

  return (
    <ResourcePage
      eyebrow="Glossary"
      title="Insurance terms, in plain words"
      intro="What each term means and why it matters when you compare or claim."
      narrow
    >
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6A7C]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a term"
          aria-label="Search glossary"
          className="w-full rounded-xl border border-[#D9D3E8] bg-white py-3 pl-10 pr-4 text-[15px] text-[#24212B] placeholder:text-[#8C879A] focus:outline-none focus:border-[#7957FF]"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${group === g ? "bg-[#7957FF] border-[#7957FF] text-white" : "bg-white border-[#D9D3E8] text-[#24212B] hover:border-[#7957FF]"}`}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="mt-5 text-sm text-[#6F6A7C]">
        {items.length} {items.length === 1 ? "term" : "terms"}
      </p>
      <dl className="mt-3 space-y-3">
        {items.map((g) => (
          <div key={g.term} className="rounded-2xl bg-white border border-[#D9D3E8] p-5">
            <dt className="text-lg font-bold text-[#24212B]">{g.term}</dt>
            <dd className="mt-1.5 text-[15px] leading-7 text-[#24212B]">{g.meaning}</dd>
            <dd className="mt-2 text-[15px] leading-7 text-[#4A4658]">
              <span className="font-semibold text-[#7957FF]">Why it matters: </span>
              {g.why}
            </dd>
            {g.source && (
              <dd className="mt-2">
                <SourceLinks sources={[g.source]} label="Source" />
              </dd>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl bg-white border border-[#D9D3E8] p-6 text-[15px] text-[#4A4658]">No term matches that search.</p>
        )}
      </dl>
    </ResourcePage>
  );
}
