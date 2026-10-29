import { ArrowUpRight } from "lucide-react";
import catalogue from "@/data/term_catalogue.json";
import { SOURCES } from "@/data/resources";
import { Callout, ResourcePage, SourceLinks } from "@/components/resources/parts";

export const metadata = { title: "Insurer directory | LifeSure AI", description: "Claim settlement ratio and solvency for the life insurers we compare, each with its source." };

type Fig = { value: number | null; basis: string | null; fy?: string | null; source_url: string | null; note?: string };
type Insurer = { name: string; claim_settlement_ratio: Fig; solvency_ratio: Fig };

function Figure({ label, fig, suffix }: { label: string; fig: Fig; suffix: string }) {
  const known = fig.value != null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6F6A7C]">{label}</p>
      <p className={`mt-0.5 text-2xl font-extrabold ${known ? "text-[#24212B]" : "text-[#8C879A]"}`}>{known ? `${fig.value}${suffix}` : "Not confirmed"}</p>
      {known && <p className="mt-1 text-sm leading-5 text-[#4A4658]">{[fig.basis, fig.fy].filter(Boolean).join(" · ")}</p>}
      {known && fig.source_url && (
        <a href={fig.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-0.5 text-sm font-semibold text-[#7957FF] underline underline-offset-2">Source<ArrowUpRight className="w-3 h-3" /></a>
      )}
    </div>
  );
}

export default function InsurersPage() {
  const insurers = Object.values(catalogue.insurers as unknown as Record<string, Insurer>);
  return (
    <ResourcePage eyebrow="Insurer directory" title="Life insurers we compare" intro={`Figures come from each insurer's own pages and filings, as of ${catalogue.as_of}. Where we could not confirm a figure, it says so. We do not fill gaps with estimates.`}>
      <div className="mb-8"><Callout>Compare like with like: the year and the basis (by number of claims or by amount) differ between insurers, and are shown with each figure. A higher claim ratio is better, but one year is a thin guide.</Callout></div>
      <div className="grid gap-4 md:grid-cols-2">
        {insurers.map((ins) => (
          <section key={ins.name} className="rounded-2xl bg-white border border-[#D9D3E8] p-6">
            <h2 className="text-lg font-bold text-[#24212B]">{ins.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-5">
              <Figure label="Claims paid" fig={ins.claim_settlement_ratio} suffix="%" />
              <Figure label="Solvency ratio" fig={ins.solvency_ratio} suffix="x" />
            </div>
          </section>
        ))}
      </div>
      <div className="mt-8 space-y-2">
        <p className="text-sm leading-6 text-[#4A4658]">This list covers the insurers whose term plans we compare, not every insurer. IRDAI keeps the complete list of registered life insurers.</p>
        <SourceLinks sources={[SOURCES.lifeList, SOURCES.lifeFaq]} label="Official lists" />
      </div>
    </ResourcePage>
  );
}
