import { CLAIM_DOCS, CLAIM_DOCS_NOTE, CLAIM_STEPS, SOURCES } from "@/data/resources";
import { Callout, ResourcePage, SourceLinks } from "@/components/resources/parts";

export const metadata = {
  title: "Claim guide | LifeSure AI",
  description: "What a nominee does to claim on a life policy, with IRDAI timelines.",
};

export default function ClaimsPage() {
  return (
    <ResourcePage
      eyebrow="Claim guide"
      title="Claiming on a life policy: what a nominee does"
      intro="Five steps in order, with the timelines IRDAI sets. Keep this where your family can find it."
      narrow
    >
      <ol className="space-y-4">
        {CLAIM_STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-2xl bg-white border border-[#D9D3E8] p-5 sm:p-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9E4FF] text-sm font-extrabold text-[#7957FF]">
              {i + 1}
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#24212B]">{s.title}</h2>
              <p className="mt-1 text-[15px] leading-7 text-[#4A4658]">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl font-extrabold text-[#24212B] tracking-tight">Documents to gather</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CLAIM_DOCS.map((g) => (
          <div key={g.group} className="rounded-2xl bg-white border border-[#D9D3E8] p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7957FF]">{g.group}</h3>
            <ul className="mt-2 space-y-1.5 text-[15px] leading-6 text-[#24212B]">
              {g.items.map((it) => (
                <li key={it}>• {it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6F6A7C]">{CLAIM_DOCS_NOTE}</p>

      <div className="mt-10 space-y-4">
        <Callout>
          Where to complain: first to the insurer, tracked on Bima Bharosa; then to the Insurance Ombudsman if unresolved. Both are free.
        </Callout>
        <div className="flex flex-wrap gap-3">
          <a
            href={SOURCES.bima.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#7957FF] px-4 py-2.5 text-sm font-bold text-white"
          >
            Open Bima Bharosa
          </a>
          <a
            href={SOURCES.cio.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#D9D3E8] bg-white px-4 py-2.5 text-sm font-bold text-[#24212B]"
          >
            File with the Ombudsman
          </a>
        </div>
        <SourceLinks sources={[SOURCES.ppi, SOURCES.ombudsman]} />
      </div>
    </ResourcePage>
  );
}
