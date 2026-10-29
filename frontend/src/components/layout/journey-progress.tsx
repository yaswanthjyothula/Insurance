"use client";

import Link from "next/link";
import { Check, ShieldCheck, Calculator, Award, Users } from "lucide-react";

interface JourneyProgressProps {
  currentStage: 1 | 2 | 3 | 4;
}

export function JourneyProgress({ currentStage }: JourneyProgressProps) {
  const stages = [
    {
      num: 1,
      label: "Assessment",
      shortDesc: "Financial & Family Profile",
      href: "/assessment",
      icon: Calculator
    },
    {
      num: 2,
      label: "Coverage Results",
      shortDesc: "Gap & Net Needs Breakdown",
      href: "/results",
      icon: ShieldCheck
    },
    {
      num: 3,
      label: "Product Selection",
      shortDesc: "Plan Matching & Customisation",
      href: "/products",
      icon: Award
    },
    {
      num: 4,
      label: "Digital Advisory",
      shortDesc: "Fiduciary Consultation",
      href: "/advisory",
      icon: Users
    }
  ];

  return (
    <div className="w-full border-b border-[#D9D3E8] bg-[rgba(255,255,255,0.6)]" data-no-reveal>
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-7">
        {stages.map((stage) => {
          const isCompleted = currentStage > stage.num;
          const isCurrent = currentStage === stage.num;
          return (
            <Link key={stage.num} href={stage.href} className="flex items-center gap-4 group min-w-0">
              <span
                className={`flex-none w-[52px] h-[52px] rounded-[14px] grid place-items-center font-extrabold text-[19px] border transition-transform group-hover:-translate-y-0.5 ${
                  isCurrent
                    ? "bg-[#7957FF] text-white border-[#7957FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#5B3BE6,0_12px_20px_-8px_rgba(121,87,255,0.6)]"
                    : isCompleted
                    ? "bg-[#E9E4FF] text-[#7957FF] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]"
                    : "bg-white text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8]"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : stage.num}
              </span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#7957FF]">Stage {stage.num}</span>
                <span className="text-lg font-bold tracking-[-0.01em] text-[#24212B] truncate">{stage.label}</span>
                <span className="text-sm text-[#5A5566] hidden md:block truncate">{stage.shortDesc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
