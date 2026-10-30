import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { categoryList } from "@/data/categories/guides";

export const metadata = {
  title: "Insurance categories | LifeSure AI",
  description: "The seven main kinds of insurance in India, what each one is for, and real plans to look at in each.",
};

const eyebrow = "text-[13px] font-bold tracking-[0.2em] uppercase text-[#7957FF]";

const CATEGORY_IMAGES: Record<string, string> = {
  term: "/images/categories/term.jpg",
  life: "/images/categories/life.jpg",
  health: "/images/categories/health.jpg",
  general: "/images/categories/general.jpg",
  "investment-linked": "/images/categories/investment-linked.jpg",
  business: "/images/categories/business.jpg",
  other: "/images/categories/other.jpg",
};

const finder = [
  ["My family depends on my income", "/insurance/term", "Term"],
  ["I want hospital bills covered", "/insurance/health", "Health"],
  ["I want guaranteed savings for a goal", "/insurance/life", "Life"],
  ["I want to invest long term and have cover", "/insurance/investment-linked", "ULIP"],
  ["I own a home or drive a vehicle", "/insurance/general", "General"],
  ["I run a company", "/insurance/business", "Business"],
  ["I worry about online fraud", "/insurance/other", "Other"],
] as const;

export default function InsuranceHubPage() {
  return (
    <div className="text-[#24212B]">
      <section className="bg-[#E9E4FF] border-b border-[#D9D3E8]" data-no-reveal>
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 sm:py-20 flex flex-col gap-5">
          <span className={eyebrow}>Insurance guide</span>
          <h1 className="m-0 text-[clamp(36px,4.8vw,60px)] leading-[1.02] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>
            The 7 kinds of insurance
          </h1>
          <p className="m-0 text-[19px] leading-[1.55] text-[#4A4553] max-w-[720px]">
            Each kind covers a different risk. Start with what protects your family and your health, then look at savings and investing.
            Each guide explains how the cover works, what to watch for, and shows real plans with their sources.
          </p>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 flex flex-col gap-16">
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 ls-persp" aria-label="Categories">
          {categoryList.map((c, i) => {
            const imageSrc = CATEGORY_IMAGES[c.key] || "/images/categories/term.jpg";
            return (
              <Link
                key={c.key}
                href={c.href}
                className="ls-lift group bg-white border border-[#D9D3E8] rounded-3xl overflow-hidden flex flex-col shadow-[inset_0_1px_0_#fff,0_5px_0_#D9D3E8,0_26px_40px_-24px_rgba(36,33,43,0.28)] hover:border-[#7957FF] transition-all"
              >
                {/* Background image container for card texts replacing the previous symbol */}
                <div className="relative overflow-hidden min-h-[220px] p-6 sm:p-7 flex flex-col justify-between text-white isolate">
                  <Image
                    src={imageSrc}
                    alt={c.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover -z-20 group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  {/* High contrast gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171329] via-[#171329]/80 to-[#171329]/45 -z-10" />

                  {/* Top Bar: Tag pill and Counter */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-sm">
                      {c.tag}
                    </span>
                    <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-white/90 font-mono border border-white/10">
                      0{i + 1}
                    </span>
                  </div>

                  {/* Card Texts: Title & Tagline over the background image */}
                  <div className="mt-5">
                    <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.025em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      {c.title}
                    </h2>
                    <p className="m-0 mt-2 text-[14.5px] leading-[1.5] text-[#ECE7F8] line-clamp-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {c.tagline}
                    </p>
                  </div>
                </div>

                {/* Card body below image */}
                <div className="p-6 sm:p-7 flex flex-col gap-4 flex-1 justify-between bg-white">
                  <div className="rounded-xl bg-[#F7F4FF] px-4 py-3 text-[14px]">
                    <span className="font-bold text-[#7957FF]">Good fit if: </span>
                    <span className="text-[#4A4553]">{c.forYou}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#D9D3E8] text-[14.5px] font-bold">
                    <span className="text-[#5A5566] font-semibold">{c.plans.length ? `${c.plans.length} real plans` : "Guide"}</span>
                    <span className="text-[#7957FF] inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Read the guide
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Not sure where to start placed down on the insurances */}
        <section className="flex flex-col gap-5 pt-8 border-t border-[#D9D3E8]" aria-label="Not sure where to start">
          <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.025em] flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#E9E4FF] text-[#7957FF] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </span>
            Not sure where to start?
          </h2>
          <div className="flex flex-wrap gap-3">
            {finder.map(([label, href, tag]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2.5 min-h-12 px-5 py-2.5 rounded-2xl border border-[#D9D3E8] bg-white font-semibold text-[15px] shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5 hover:border-[#7957FF] hover:shadow-[0_4px_0_#7957FF,0_8px_16px_rgba(121,87,255,0.12)] transition-all"
              >
                <span>{label}</span>
                <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-lg bg-[#E9E4FF] text-[#7957FF]">{tag}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
