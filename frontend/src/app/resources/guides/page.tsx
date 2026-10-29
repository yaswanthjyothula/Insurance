import Link from "next/link";
import { GUIDES } from "@/data/resources";
import { ResourcePage } from "@/components/resources/parts";

export const metadata = { title: "Checklists | LifeSure AI", description: "Step lists for a first policy, loans and claim readiness." };

export default function GuidesPage() {
  return (
    <ResourcePage eyebrow="Checklists" title="Do it in this order" intro="Three short checklists. Tick them off as you go." narrow>
      <div className="space-y-5">
        {GUIDES.map((g) => (
          <section key={g.title} className="rounded-2xl bg-white border border-[#D9D3E8] p-6">
            <h2 className="text-xl font-extrabold text-[#24212B]">{g.title}</h2>
            <p className="mt-1 text-[15px] text-[#4A4658]">{g.intro}</p>
            <ol className="mt-4 space-y-2.5">
              {g.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-[15px] leading-6 text-[#24212B]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9E4FF] text-xs font-bold text-[#7957FF]">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
            <Link href={g.tool.href} className="mt-5 inline-flex rounded-xl bg-[#7957FF] px-4 py-2.5 text-sm font-bold text-white">{g.tool.label}</Link>
          </section>
        ))}
      </div>
    </ResourcePage>
  );
}
