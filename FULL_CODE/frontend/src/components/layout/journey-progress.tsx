"use client";

import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import { Check, ShieldCheck, Calculator, Award, Users } from "lucide-react";

interface JourneyProgressProps {
  currentStage: 1 | 2 | 3 | 4;
}

export function JourneyProgress({ currentStage }: JourneyProgressProps) {
  const t = useT();
  const stages: { num: number; labelKey: MessageKey; descKey: MessageKey; href: string; icon: typeof Check }[] = [
    {
      num: 1,
      labelKey: "layout.journey.assessment",
      descKey: "layout.journey.assessmentDesc",
      href: "/assessment",
      icon: Calculator,
    },
    {
      num: 2,
      labelKey: "layout.journey.results",
      descKey: "layout.journey.resultsDesc",
      href: "/results",
      icon: ShieldCheck,
    },
    {
      num: 3,
      labelKey: "layout.journey.products",
      descKey: "layout.journey.productsDesc",
      href: "/products",
      icon: Award,
    },
    {
      num: 4,
      labelKey: "layout.journey.advisory",
      descKey: "layout.journey.advisoryDesc",
      href: "/advisory",
      icon: Users,
    },
  ];

  return (
    <div className="w-full border-b border-[#D9D3E8] bg-[rgba(255,255,255,0.6)]" data-no-reveal>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {stages.map((stage) => {
          const isCompleted = currentStage > stage.num;
          const isCurrent = currentStage === stage.num;
          return (
            <Link key={stage.num} href={stage.href} className="flex items-center gap-3.5 group min-w-0">
              <span
                className={`flex-none w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] grid place-items-center font-extrabold text-[17px] border transition-transform group-hover:-translate-y-0.5 ${
                  isCurrent
                    ? "bg-[#7957FF] text-white border-[#7957FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#5B3BE6,0_12px_20px_-8px_rgba(121,87,255,0.6)]"
                    : isCompleted
                      ? "bg-[#E9E4FF] text-[#7957FF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]"
                      : "bg-white text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : stage.num}
              </span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#7957FF]">
                  {t("layout.journey.stage", { n: stage.num })}
                </span>
                <span className="text-[15px] sm:text-[16px] font-bold tracking-[-0.01em] text-[#24212B] truncate">{t(stage.labelKey)}</span>
                <span className="text-[12px] text-[#5A5566] hidden md:block truncate">{t(stage.descKey)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
