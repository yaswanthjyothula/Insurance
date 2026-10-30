import Link from "next/link";
import { ARTICLES } from "@/data/resources";
import { ResourcePage, SourceLinks } from "@/components/resources/parts";

export const metadata = { title: "Learning centre | LifeSure AI", description: "Short, sourced insurance explainers." };

export default function LearningCentrePage() {
  return (
    <ResourcePage
      eyebrow="Learning centre"
      title="Short explainers, no fluff"
      intro="Each one is a few minutes. We avoid made-up statistics and link to the official document when a rule is quoted."
    >
      <nav aria-label="Articles" className="mb-10 flex flex-wrap gap-2">
        {ARTICLES.map((a) => (
          <a
            key={a.id}
            href={`#${a.id}`}
            className="rounded-full bg-white border border-[#D9D3E8] px-3.5 py-1.5 text-sm font-semibold text-[#24212B] hover:border-[#7957FF]"
          >
            {a.title.split(":")[0]}
          </a>
        ))}
      </nav>
      <div className="space-y-6">
        {ARTICLES.map((a) => (
          <article key={a.id} id={a.id} className="scroll-mt-24 rounded-2xl bg-white border border-[#D9D3E8] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
              {a.kind} · {a.minutes} min read
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#24212B] tracking-tight">{a.title}</h2>
            <p className="mt-3 text-base leading-7 text-[#4A4658]">{a.intro}</p>
            <ul className="mt-4 space-y-3">
              {a.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-7 text-[#24212B]">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7957FF]" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-3">
              <SourceLinks sources={a.sources} />
              {a.tool && (
                <Link href={a.tool.href} className="inline-flex rounded-xl bg-[#7957FF] px-4 py-2.5 text-sm font-bold text-white">
                  {a.tool.label}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </ResourcePage>
  );
}
