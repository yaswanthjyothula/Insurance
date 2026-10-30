import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  HelpCircle,
  Wallet,
  ShieldCheck,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  XCircle,
  Scale,
  Shield,
  PiggyBank,
  HeartPulse,
  Home,
  TrendingUp,
  Briefcase,
  Lock,
} from "lucide-react";
import type { CategoryGuide, CategoryKey, CategoryPlan } from "@/data/categories/types";

export const CATEGORY_ICONS: Record<CategoryKey, typeof Shield> = {
  term: Shield,
  life: PiggyBank,
  health: HeartPulse,
  general: Home,
  "investment-linked": TrendingUp,
  business: Briefcase,
  other: Lock,
};

const dateFmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const eyebrow = "text-[13px] font-bold tracking-[0.2em] uppercase text-[#7957FF]";
const card =
  "bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl shadow-[0_4px_0_#E9E4FF,0_5px_0_#D9D3E8,0_24px_40px_-28px_rgba(36,33,43,0.2)]";

const STATUS = {
  sourced: { label: "Checked against the insurer's documents", cls: "bg-[#E9E4FF] text-[#7957FF]" },
  partially_sourced: { label: "Partly verified", cls: "bg-[#FFF4D6] text-[#8A6100]" },
} as const;

function Bullets({ items, tone }: { items: string[]; tone: "good" | "warn" | "plain" }) {
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-3">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3 text-[16px] leading-[1.55] text-[#4A4553]">
          <span
            className={`mt-[3px] flex-none w-[22px] h-[22px] rounded-full grid place-items-center ${tone === "good" ? "bg-[#E9E4FF] text-[#7957FF]" : tone === "warn" ? "bg-[#FFF4D6] text-[#8A6100]" : "bg-[#F1EEF8] text-[#6F6A7C]"}`}
          >
            {tone === "good" ? (
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            ) : tone === "warn" ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({ p }: { p: CategoryPlan }) {
  const st = STATUS[p.status];
  return (
    <article className={`${card} p-6 sm:p-7 flex flex-col gap-5`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#7957FF]">{p.insurer}</div>
          <h3 className="m-0 mt-0.5 text-[22px] font-extrabold tracking-[-0.02em]">{p.name}</h3>
          <div className="text-[13px] text-[#6F6A7C] mt-0.5">
            {p.uin ? `Product number (UIN) ${p.uin}` : "Product number not confirmed"}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-md ${st.cls}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {st.label}
        </span>
      </header>

      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4553]">{p.summary}</p>

      {p.stats && p.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {p.stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-[#F7F4FF] px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">{s.label}</div>
              <div className="text-xl font-extrabold tabular-nums mt-0.5">{s.value}</div>
              {s.note && (
                <div className="text-[12px] text-[#6F6A7C] leading-snug mt-0.5">
                  {s.note}
                  {s.source_url && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={s.source_url} target="_blank" rel="noreferrer" className="text-[#7957FF] font-semibold hover:underline">
                        source
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3.5">
        {p.facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">{f.label}</dt>
            <dd className="m-0 mt-0.5 text-[15px] font-semibold leading-snug">{f.value}</dd>
          </div>
        ))}
      </dl>

      {p.highlights.length > 0 && <Bullets items={p.highlights} tone="good" />}
      {p.limits.length > 0 && (
        <div className="rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] p-4">
          <div className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#8A6100] mb-2.5">Limits to know</div>
          <Bullets items={p.limits} tone="warn" />
        </div>
      )}
      {p.unconfirmed && p.unconfirmed.length > 0 && (
        <p className="m-0 text-[13.5px] text-[#7A5600] bg-[#FFF4D6] rounded-xl px-4 py-3 leading-snug">
          Not confirmed from official documents: {p.unconfirmed.join(", ")}.
        </p>
      )}

      <footer className="flex flex-wrap gap-x-5 gap-y-2 pt-4 mt-auto border-t border-[#D9D3E8] text-[14px] font-semibold">
        {p.plan_url && (
          <a href={p.plan_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#7957FF] hover:underline">
            Plan page
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {p.brochure_url && (
          <a
            href={p.brochure_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[#7957FF] hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            Brochure
          </a>
        )}
      </footer>
    </article>
  );
}

export function CategoryGuidePage({
  guide,
  others,
}: {
  guide: CategoryGuide;
  others: { key: CategoryKey; href: string; shortTitle: string }[];
}) {
  const Icon = CATEGORY_ICONS[guide.key];
  return (
    <div className="text-[#24212B]">
      {/* Hero */}
      <section className="bg-[#E9E4FF] border-b border-[#D9D3E8]" data-no-reveal>
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-6">
          <Link
            href="/insurance"
            className="inline-flex items-center gap-2 self-start text-[14.5px] font-semibold text-[#5A5566] hover:text-[#7957FF]"
          >
            <ArrowLeft className="w-4 h-4" />
            All 7 categories
          </Link>
          <div className="flex flex-wrap items-start gap-6">
            <span
              className="flex-none w-[72px] h-[72px] rounded-2xl grid place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_5px_0_#5B3BE6,0_16px_26px_-10px_rgba(121,87,255,0.7)]"
              style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}
            >
              <Icon className="w-8 h-8" strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-[260px] flex flex-col gap-3">
              <span className={eyebrow}>Insurance guide · {guide.tag}</span>
              <h1
                className="m-0 text-[clamp(34px,4.4vw,56px)] leading-[1.02] font-extrabold tracking-[-0.04em]"
                style={{ color: "#24212B" }}
              >
                {guide.title}
              </h1>
              <p className="m-0 text-[19px] leading-[1.55] text-[#4A4553] max-w-[720px]">{guide.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 flex flex-col gap-16">
        {/* Overview */}
        <section className="grid md:grid-cols-2 gap-6" aria-label="Overview">
          <div className={`${card} p-7 sm:p-8 flex flex-col gap-3`}>
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">What it does</h2>
            <p className="m-0 text-[16.5px] leading-[1.65] text-[#4A4553]">{guide.purpose}</p>
          </div>
          <div className={`${card} p-7 sm:p-8 flex flex-col gap-4`}>
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Who it&apos;s for</h2>
            <Bullets items={guide.whoFor} tone="plain" />
          </div>
        </section>

        {/* Benefits and limits */}
        <section className="grid md:grid-cols-2 gap-6" aria-label="Benefits and limits">
          <div className={`${card} p-7 sm:p-8 flex flex-col gap-5`}>
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-[#E9E4FF] text-[#7957FF]">
                <Check className="w-5 h-5" strokeWidth={3} />
              </span>
              What you get
            </h2>
            <Bullets items={guide.benefits} tone="good" />
          </div>
          <div className={`${card} p-7 sm:p-8 flex flex-col gap-5`}>
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-[#FFF4D6] text-[#8A6100]">
                <AlertTriangle className="w-5 h-5" />
              </span>
              What to watch for
            </h2>
            <Bullets items={guide.limits} tone="warn" />
          </div>
        </section>

        {/* How to choose */}
        <section className="flex flex-col gap-6" aria-label="How to choose">
          <div className="flex flex-col gap-2">
            <span className={eyebrow}>Choosing well</span>
            <h2 className="m-0 text-[clamp(28px,3.2vw,40px)] leading-[1.05] font-extrabold tracking-[-0.035em]">How to choose</h2>
          </div>
          <ol className="m-0 p-0 list-none grid md:grid-cols-2 gap-4">
            {guide.howToChoose.map((s, i) => (
              <li key={s} className="flex items-start gap-4 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl p-5 shadow-[0_3px_0_#E9E4FF]">
                <span className="flex-none w-9 h-9 rounded-full grid place-items-center font-extrabold text-white bg-[#7957FF] shadow-[0_3px_0_#5B3BE6]">
                  {i + 1}
                </span>
                <span className="text-[16px] leading-[1.55] text-[#4A4553] pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Plans */}
        <section className="flex flex-col gap-6" aria-label="Real plans">
          <div className="flex flex-col gap-3">
            <span className={eyebrow}>Real plans on sale</span>
            <h2 className="m-0 text-[clamp(28px,3.2vw,40px)] leading-[1.05] font-extrabold tracking-[-0.035em]">Plans we looked at</h2>
            <p className="m-0 text-[17px] leading-[1.55] text-[#5A5566] max-w-[760px]">{guide.plansIntro}</p>
          </div>
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] text-[14.5px] leading-normal text-[#4A4553]">
            <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
            <div>
              These are examples of real products, not a ranking or a recommendation. Every fact comes from the insurer&apos;s own documents
              or a regulator, with a link to check it{guide.asOf && <> (checked {dateFmt(guide.asOf)})</>}. Insurers change plans and
              figures, so confirm with the insurer before you buy. We don&apos;t sell insurance.
            </div>
          </div>
          {guide.plans.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {guide.plans.map((p) => (
                <PlanCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className={`${card} p-8 text-center text-[#5A5566]`}>We haven&apos;t added verified plans for this category yet.</div>
          )}
        </section>

        {/* Questions, price, mistakes */}
        <section className="grid lg:grid-cols-3 gap-6" aria-label="Before you buy">
          {(
            [
              ["Questions to ask", HelpCircle, guide.questions],
              ["What sets the price", Wallet, guide.pricingFactors],
              ["Common mistakes", XCircle, guide.mistakes],
            ] as const
          ).map(([title, I, items]) => (
            <div key={title} className={`${card} p-7 flex flex-col gap-4`}>
              <h3 className="m-0 text-[20px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
                <I className="w-5 h-5 text-[#7957FF]" />
                {title}
              </h3>
              <Bullets items={[...items]} tone="plain" />
            </div>
          ))}
        </section>

        {/* Rules */}
        {guide.rules.length > 0 && (
          <section className={`${card} p-7 sm:p-9 flex flex-col gap-5`} aria-label="Rules and tax">
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.025em] flex items-center gap-3">
                <Scale className="w-6 h-6 text-[#7957FF]" />
                Rules and tax
              </h2>
              <p className="m-0 text-[14.5px] text-[#6F6A7C]">
                Rules change. Check the linked source and confirm with a tax professional for your own case.
              </p>
            </div>
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[#D9D3E8]">
              {guide.rules.map((r) => (
                <li key={r.text} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                  <span className="text-[16px] leading-[1.55] text-[#4A4553]">{r.text}</span>
                  {r.source_url && (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-[#7957FF] hover:underline"
                    >
                      Source{r.as_of ? `, ${dateFmt(r.as_of)}` : ""}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <section
          className="rounded-[32px] px-7 sm:px-12 py-12 sm:py-14 text-white flex flex-col md:flex-row md:items-center justify-between gap-7 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_10px_0_#5B3BE6,0_50px_80px_-34px_rgba(121,87,255,0.6)]"
          style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
          aria-label="Next step"
        >
          <div className="flex flex-col gap-3 max-w-[620px]">
            <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-extrabold tracking-[-0.03em]" style={{ color: "#FFFFFF" }}>
              {guide.cta.title}
            </h2>
            <p className="m-0 text-[17px] leading-[1.55] text-[#F1EEFF]">{guide.cta.body}</p>
          </div>
          <Link
            href={guide.cta.href}
            className="h-[60px] px-8 bg-white text-[#7957FF] rounded-lg inline-flex items-center gap-3 font-bold text-[17px] shadow-[0_6px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[4px] transition-all whitespace-nowrap self-start"
          >
            {guide.cta.label}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Other categories */}
        <section className="flex flex-col gap-4" aria-label="Other categories">
          <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.02em] flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-[#7957FF]" />
            Other insurance categories
          </h2>
          <div className="flex flex-wrap gap-3">
            {others.map((o) => {
              const I = CATEGORY_ICONS[o.key];
              return (
                <Link
                  key={o.key}
                  href={o.href}
                  className="inline-flex items-center gap-2.5 h-12 px-5 rounded-xl border border-[#D9D3E8] bg-white font-semibold shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5 hover:text-[#7957FF] transition-all"
                >
                  <I className="w-4 h-4 text-[#7957FF]" />
                  {o.shortTitle}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
