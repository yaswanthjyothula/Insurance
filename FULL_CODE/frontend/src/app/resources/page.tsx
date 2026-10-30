import Link from "next/link";
import { BookOpen, Building2, FileText, Languages, ListChecks, MessageSquareQuote, ArrowRight } from "lucide-react";
import { ResourcePage, Callout } from "@/components/resources/parts";

export const metadata = {
  title: "Resources | LifeSure AI",
  description: "Plain-language insurance explainers, glossary, insurer facts and a claim guide, checked against IRDAI documents.",
};

const HUBS = [
  {
    title: "Learning centre",
    desc: "Short explainers on cover sizing, disclosure, riders, health policies and home insurance.",
    href: "/resources/learning-centre",
    icon: BookOpen,
  },
  { title: "Glossary", desc: "Plain definitions of the terms you meet in policy documents.", href: "/resources/glossary", icon: Languages },
  {
    title: "Insurer directory",
    desc: "Claim settlement ratio and solvency for the insurers we compare, each with its source.",
    href: "/resources/insurance-companies",
    icon: Building2,
  },
  {
    title: "Claim guide",
    desc: "What a nominee does, in order, with IRDAI's timelines and where to escalate.",
    href: "/resources/claims",
    icon: FileText,
  },
  {
    title: "Checklists",
    desc: "Step lists for a first policy, loans, and getting your family claim-ready.",
    href: "/resources/guides",
    icon: ListChecks,
  },
  { title: "Reviews", desc: "How to judge an insurer from real, public data.", href: "/resources/reviews", icon: MessageSquareQuote },
];

export default function ResourcesHubPage() {
  return (
    <ResourcePage
      eyebrow="Resources"
      title="Insurance, explained with sources"
      intro="Regulatory points here are taken from IRDAI documents and linked so you can read them yourself. Where we could not confirm something, we say to check your policy."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {HUBS.map((h) => (
          <Link
            key={h.href}
            href={h.href}
            className="group rounded-2xl bg-white border border-[#D9D3E8] p-6 hover:border-[#7957FF] transition-colors"
          >
            <h.icon className="w-5 h-5 text-[#7957FF]" />
            <h2 className="mt-3 text-lg font-bold text-[#24212B]">{h.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#4A4658]">{h.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#7957FF]">
              Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <Callout>
          This is general information, not legal, tax or investment advice. Rules change, so confirm current terms with your insurer or
          IRDAI.
        </Callout>
      </div>
    </ResourcePage>
  );
}
