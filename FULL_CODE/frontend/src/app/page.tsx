"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Calculator,
  Shield,
  Activity,
  HelpCircle,
  IndianRupee,
  ListChecks,
  Headset,
  ArrowRight,
  LogIn,
  Compass,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIndicativePremium } from "@/hooks/useIndicativePremium";
import { useI18n, useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";

const HERO_COVER_STEP = 500000;

export default function HomePage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [heroAge, setHeroAge] = useState(32);
  const [heroIncome, setHeroIncome] = useState(1500000);
  const heroDependents = 2;
  const heroLiabilities = 4000000;

  const [activeScenario, setActiveScenario] = useState<"another_child" | "retire_55" | "loan_cleared">("another_child");

  const heroExpenses = heroIncome * 0.55;
  const heroIncomePV = heroExpenses * Math.max(5, 60 - heroAge) * 0.72;
  const heroImmediate = Math.max(300000, heroExpenses * 0.5);
  const heroGoals = heroDependents * 2500000;
  const heroGrossNeed = heroIncomePV + heroLiabilities + heroGoals + heroImmediate;
  const heroEligibleAssets = heroIncome * 1.5;
  const heroExistingCover = 2500000;
  const heroNetGap = Math.max(0, heroGrossNeed - heroEligibleAssets - heroExistingCover);

  // Quoted in 5 lakh steps, like the pack's cover amounts, so dragging a slider does not fire a request per rupee
  const heroCover = Math.max(HERO_COVER_STEP, Math.ceil(heroNetGap / HERO_COVER_STEP) * HERO_COVER_STEP);
  const heroPremium = useIndicativePremium({ age: heroAge, gender: "male", sumAssured: heroCover, smoker: false });

  const scenarioDiffs: Record<
    "another_child" | "retire_55" | "loan_cleared",
    { titleKey: MessageKey; descKey: MessageKey; tagKey: MessageKey; deltaCover: number; deltaPremium: number }
  > = {
    another_child: {
      titleKey: "home.scenario.another.title",
      descKey: "home.scenario.another.desc",
      deltaCover: 3750000,
      deltaPremium: 3800,
      tagKey: "home.scenario.another.tag",
    },
    retire_55: {
      titleKey: "home.scenario.retire.title",
      descKey: "home.scenario.retire.desc",
      deltaCover: -1800000,
      deltaPremium: -1850,
      tagKey: "home.scenario.retire.tag",
    },
    loan_cleared: {
      titleKey: "home.scenario.loan.title",
      descKey: "home.scenario.loan.desc",
      deltaCover: -heroLiabilities,
      deltaPremium: -4200,
      tagKey: "home.scenario.loan.tag",
    },
  };

  const categories: { titleKey: MessageKey; tagKey: MessageKey; descKey: MessageKey; href: string; metricKey: MessageKey }[] = [
    {
      titleKey: "home.cat.term.title",
      tagKey: "home.cat.term.tag",
      descKey: "home.cat.term.desc",
      href: "/insurance/term",
      metricKey: "home.cat.term.metric",
    },
    {
      titleKey: "home.cat.life.title",
      tagKey: "home.cat.life.tag",
      descKey: "home.cat.life.desc",
      href: "/insurance/life",
      metricKey: "home.cat.life.metric",
    },
    {
      titleKey: "home.cat.health.title",
      tagKey: "home.cat.health.tag",
      descKey: "home.cat.health.desc",
      href: "/insurance/health",
      metricKey: "home.cat.health.metric",
    },
    {
      titleKey: "home.cat.general.title",
      tagKey: "home.cat.general.tag",
      descKey: "home.cat.general.desc",
      href: "/insurance/general",
      metricKey: "home.cat.general.metric",
    },
    {
      titleKey: "home.cat.ulip.title",
      tagKey: "home.cat.ulip.tag",
      descKey: "home.cat.ulip.desc",
      href: "/insurance/investment-linked",
      metricKey: "home.cat.ulip.metric",
    },
    {
      titleKey: "home.cat.business.title",
      tagKey: "home.cat.business.tag",
      descKey: "home.cat.business.desc",
      href: "/insurance/business",
      metricKey: "home.cat.business.metric",
    },
    {
      titleKey: "home.cat.other.title",
      tagKey: "home.cat.other.tag",
      descKey: "home.cat.other.desc",
      href: "/insurance/other",
      metricKey: "home.cat.other.metric",
    },
  ];

  const insuranceQuestions: { qKey: MessageKey; href: string; tagKey: MessageKey }[] = [
    { qKey: "home.ask.term.q", href: "/insurance/term", tagKey: "home.ask.term.tag" },
    { qKey: "home.ask.health.q", href: "/insurance/health", tagKey: "home.ask.health.tag" },
    { qKey: "home.ask.life.q", href: "/insurance/life", tagKey: "home.ask.life.tag" },
    { qKey: "home.ask.ulip.q", href: "/insurance/investment-linked", tagKey: "home.ask.ulip.tag" },
    { qKey: "home.ask.general.q", href: "/insurance/general", tagKey: "home.ask.general.tag" },
    { qKey: "home.ask.business.q", href: "/insurance/business", tagKey: "home.ask.business.tag" },
    { qKey: "home.ask.other.q", href: "/insurance/other", tagKey: "home.ask.other.tag" },
  ];

  const tools: { nameKey: MessageKey; descKey: MessageKey; icon: typeof Calculator; href: string }[] = [
    {
      nameKey: "home.tool.stage1.name",
      descKey: "home.tool.stage1.desc",
      icon: Calculator,
      href: "/assessment",
    },
    {
      nameKey: "home.tool.stage2.name",
      descKey: "home.tool.stage2.desc",
      icon: Shield,
      href: "/results",
    },
    {
      nameKey: "home.tool.stage3.name",
      descKey: "home.tool.stage3.desc",
      icon: Layers,
      href: "/products",
    },
    {
      nameKey: "home.tool.stage4.name",
      descKey: "home.tool.stage4.desc",
      icon: Activity,
      href: "/advisory",
    },
    {
      nameKey: "home.tool.scenario.name",
      descKey: "home.tool.scenario.desc",
      icon: Layers,
      href: "/tools/scenario-studio",
    },
    {
      nameKey: "home.tool.survival.name",
      descKey: "home.tool.survival.desc",
      icon: Activity,
      href: "/tools/family-survival-simulator",
    },
  ];

  const faqs: { qKey: MessageKey; aKey: MessageKey }[] = [
    {
      qKey: "home.faq.gap.q",
      aKey: "home.faq.gap.a",
    },
    {
      qKey: "home.faq.scenario.q",
      aKey: "home.faq.scenario.a",
    },
    {
      qKey: "home.faq.broker.q",
      aKey: "home.faq.broker.a",
    },
  ];

  const eyebrow = "text-[13px] font-semibold tracking-[0.24em] uppercase text-[#7957FF]";
  const h2 = "m-0 font-extrabold tracking-[-0.04em] leading-[1.02] text-[clamp(30px,3.4vw,50px)]";
  const label = "text-[13px] font-bold tracking-[0.12em] uppercase";

  const howSteps: { n: string; href: string; tKey: MessageKey; dKey: MessageKey }[] = [
    {
      n: "01",
      href: "/assessment",
      tKey: "home.how.assess.title",
      dKey: "home.how.assess.desc",
    },
    {
      n: "02",
      href: "/results",
      tKey: "home.how.engine.title",
      dKey: "home.how.engine.desc",
    },
    {
      n: "03",
      href: "/products",
      tKey: "home.how.match.title",
      dKey: "home.how.match.desc",
    },
    {
      n: "04",
      href: "/advisory",
      tKey: "home.how.advisory.title",
      dKey: "home.how.advisory.desc",
    },
  ];

  const heroFeatures: HeroFeature[] = [
    { k: IndianRupee, tKey: "home.hero.feature.coverage" },
    { k: ListChecks, tKey: "home.hero.feature.recs" },
    { k: Headset, tKey: "home.hero.feature.advisory" },
  ];

  return (
    <div className="overflow-x-hidden text-[#24212B]">
      {/* 1. HERO */}
      <section
        data-no-reveal
        className="relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse 55% 65% at 78% 45%,#E9E4FF 0%,rgba(233,228,255,0) 70%)" }}
      >
        <div className="max-w-[1360px] mx-auto relative lg:min-h-[560px] flex items-center">
          <div className="w-full lg:w-[42%] px-6 sm:px-10 py-12 flex flex-col gap-6 relative z-[3] min-w-0">
            <span className={eyebrow}>{t("home.hero.eyebrow")}</span>
            <h1 className="m-0 font-extrabold text-[clamp(36px,3.9vw,58px)] leading-[1] tracking-[-0.04em]" style={{ color: "#24212B" }}>
              <span className="block">{t("home.hero.title1")}</span>
              <span className="block">{t("home.hero.title2")}</span>
              <span className="block ls-extrude">{t("home.hero.title3")}</span>
            </h1>
            <p className="m-0 max-w-[440px] text-base leading-[1.55] text-[#5A5566]">{t("home.hero.body")}</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/assessment"
                className="h-[52px] px-6 bg-[#7957FF] text-white rounded-md flex items-center gap-3 font-semibold text-[15px]"
              >
                {t("home.hero.cta")} <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
              {!loading && !user && (
                <Link
                  href="/sign-in"
                  className="h-[52px] px-5 bg-white/80 backdrop-blur-md text-[#24212B] hover:text-[#7957FF] border border-[#D9D3E8] hover:border-[#7957FF] rounded-md flex items-center gap-3 font-semibold text-[15px] shadow-[0_4px_0_#D9D3E8,0_16px_30px_-14px_rgba(36,33,43,0.18)] hover:-translate-y-0.5 active:translate-y-[3px] transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-[#E9E4FF] text-[#7957FF] flex items-center justify-center">
                    <LogIn className="w-3.5 h-3.5" />
                  </span>
                  <span>{t("common.signIn")}</span>
                </Link>
              )}
            </div>
          </div>
          <HeroScene features={heroFeatures} />
        </div>
        <HeroScene features={heroFeatures} mobile />
      </section>

      {/* 2. TRUST STRIP */}
      <section className="max-w-[1280px] mx-auto px-6 sm:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(
            [
              ["home.trust.deterministic", "home.trust.deterministicDesc"],
              ["home.trust.explainable", "home.trust.explainableDesc"],
              ["home.trust.noHype", "home.trust.noHypeDesc"],
            ] as [MessageKey, MessageKey][]
          ).map(([a, b], i) => (
            <div key={a} className="bg-white border border-[#D9D3E8] rounded-2xl px-7 py-6 flex flex-col gap-1">
              <span className={`text-2xl font-extrabold tracking-[-0.03em] ${i === 2 ? "text-[#7957FF]" : ""}`}>{t(a)}</span>
              <span className="text-sm text-[#5A5566]">{t(b)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="px-6 sm:px-10 pt-16 pb-28">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-4 text-center items-center">
            <span className={eyebrow}>{t("home.how.eyebrow")}</span>
            <h2 className={h2}>{t("home.how.title")}</h2>
            <p className="m-0 max-w-[560px] text-lg leading-[1.55] text-[#5A5566]">{t("home.how.subtitle")}</p>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ls-persp">
            {howSteps.map((x) => (
              <Link
                key={x.n}
                href={x.href}
                className="ls-lip ls-tilt-card bg-white border border-[#D9D3E8] rounded-[20px] px-[30px] pt-9 pb-[34px] flex flex-col gap-4"
              >
                <span className="ls-extrude-num font-black text-[56px] leading-none tracking-[-0.05em]">{x.n}</span>
                <h3 className="mt-2 text-[23px] font-bold tracking-[-0.02em]">{t(x.tKey)}</h3>
                <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566]">{t(x.dKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE NEEDS PREVIEW */}
      <section className="px-6 sm:px-10 pb-28">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-16 items-center">
          <div className="flex-[1_1_420px] flex flex-col gap-6 min-w-0">
            <span className={eyebrow}>{t("home.preview.eyebrow")}</span>
            <h2 className={h2}>{t("home.preview.title")}</h2>
            <p className="m-0 max-w-[520px] text-lg leading-[1.6] text-[#5A5566]">{t("home.preview.body")}</p>
            <Link
              href="/assessment"
              className="self-start h-14 px-7 bg-[#7957FF] text-white rounded-md flex items-center gap-3 font-semibold text-base"
            >
              {t("home.preview.cta")} <ArrowRight className="w-[18px] h-[18px]" />
            </Link>
          </div>
          <div className="flex-[1_1_460px] min-w-0 ls-persp">
            <div
              data-scroll-tilt="10"
              className="ls-lip bg-white border border-[#D9D3E8] rounded-3xl p-9 flex flex-col gap-7 [rotate:x_4deg]"
            >
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="text-xl font-bold tracking-[-0.01em]">{t("home.preview.cardTitle")}</span>
                <span className="text-sm font-bold text-white bg-[#7957FF] px-3 py-1.5 rounded-md shadow-[0_3px_0_#5B3BE6]">
                  {t("home.preview.badge")}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <label className={label} htmlFor="hero-age">
                  {t("home.preview.age")} <span className="text-[#7957FF]">{t("home.preview.ageValue", { count: heroAge })}</span>{" "}
                  <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">· {t("home.preview.retirement")}</span>
                </label>
                <input
                  id="hero-age"
                  type="range"
                  min="21"
                  max="55"
                  value={heroAge}
                  onChange={(e) => setHeroAge(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className={label} htmlFor="hero-income">
                  {t("home.preview.income")} <span className="text-[#7957FF]">{formatINR(heroIncome, { compact: true })}</span>{" "}
                  <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">
                    · {t("home.preview.dependents", { count: heroDependents })}
                  </span>
                </label>
                <input
                  id="hero-income"
                  type="range"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={heroIncome}
                  onChange={(e) => setHeroIncome(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
              <div
                className="rounded-[18px] p-7 text-white flex flex-col gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_8px_0_#5B3BE6,0_30px_50px_-24px_rgba(121,87,255,0.6)]"
                style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
              >
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#E9E4FF]">{t("home.preview.gapLabel")}</span>
                <span className="ls-extrude-on-violet font-black text-[clamp(44px,5vw,64px)] tracking-[-0.045em] leading-none tabular-nums text-white">
                  {formatINR(heroNetGap, { compact: true })}
                </span>
                <span className="text-sm text-[#F1EEFF] tabular-nums">
                  {t("home.preview.breakdown", {
                    gross: formatINR(heroGrossNeed, { compact: true }),
                    offset: formatINR(heroEligibleAssets + heroExistingCover, { compact: true }),
                  })}
                </span>
              </div>
              <div className="flex justify-between text-[15px] pt-1">
                <span className="text-[#5A5566]">{t("home.preview.premiumLabel")}</span>
                <span className="font-bold tabular-nums">
                  {heroNetGap > 0 && heroPremium.annualPremium !== null
                    ? t("home.preview.premiumValue", { amount: formatINR(heroPremium.annualPremium, { compact: true }) })
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SMART TOOLS */}
      <section className="px-6 sm:px-10 pb-28">
        <div className="max-w-[1280px] mx-auto bg-[#E9E4FF] rounded-[32px] px-6 sm:px-16 py-16 sm:py-20 flex flex-col gap-12 ls-lip-lilac">
          <div className="flex flex-wrap gap-5 justify-between items-end">
            <div className="flex flex-col gap-4 max-w-[760px]">
              <span className={eyebrow}>{t("home.tools.eyebrow")}</span>
              <h2 className={h2}>{t("home.tools.title")}</h2>
            </div>
            <p className="m-0 max-w-[400px] text-[17px] leading-[1.55] text-[#5A5566]">{t("home.tools.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px] ls-persp">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.nameKey}
                  href={tool.href}
                  className="ls-lift bg-white rounded-[18px] px-[30px] py-8 flex flex-col gap-3.5 shadow-[inset_0_1px_0_#fff,0_5px_0_#D9D3E8,0_24px_40px_-22px_rgba(36,33,43,0.3)]"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="w-[52px] h-[52px] rounded-[14px] grid place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_#5B3BE6,0_12px_20px_-8px_rgba(121,87,255,0.7)]"
                      style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7957FF]">
                      {i < 4 ? t("home.tools.stage", { n: i + 1 }) : t("home.tools.tool")}
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-[22px] font-bold tracking-[-0.02em]">{t(tool.nameKey)}</h3>
                  <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566]">{t(tool.descKey)}</p>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 justify-between items-center pt-7 border-t border-[#D9D3E8]">
            <span className="text-base font-semibold">{t("home.tools.more")}</span>
            <Link href="/tools" className="font-bold text-base text-[#7957FF]">
              {t("home.tools.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SCENARIO STUDIO */}
      <section className="px-6 sm:px-10 pb-32">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-16 items-center">
          <div className="flex-[1_1_460px] flex flex-col gap-7 min-w-0">
            <span className="self-start text-[12.5px] font-bold tracking-[0.2em] uppercase text-[#7957FF] bg-[#E9E4FF] px-3.5 py-2.5 rounded-md shadow-[0_3px_0_#D9D3E8]">
              {t("home.scenario.eyebrow")}
            </span>
            <h2 className="m-0 font-extrabold text-[clamp(30px,3.4vw,50px)] leading-[1.02] tracking-[-0.04em]">
              {t("home.scenario.title1")}
              <span className="block text-[#7957FF]">{t("home.scenario.title2")}</span>
            </h2>
            <p className="m-0 max-w-[540px] text-lg leading-[1.6] text-[#5A5566]">{t("home.scenario.body")}</p>
            <div className="flex flex-col gap-3.5">
              <span className="text-[13px] font-bold tracking-[0.16em] uppercase">{t("home.scenario.select")}</span>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["another_child", "home.scenario.chip.another"],
                    ["retire_55", "home.scenario.chip.retire"],
                    ["loan_cleared", "home.scenario.chip.loan"],
                  ] as const
                ).map(([k, l]) => {
                  const on = activeScenario === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveScenario(k)}
                      className={`h-[50px] px-[22px] rounded-lg font-semibold text-base cursor-pointer transition-all border ${on ? "bg-[#7957FF] text-white border-[#7957FF]" : "bg-white text-[#24212B] border-[#D9D3E8] shadow-[0_4px_0_#D9D3E8,0_12px_20px_-12px_rgba(36,33,43,0.25)] hover:-translate-y-0.5"}`}
                    >
                      {t(l)}
                    </button>
                  );
                })}
              </div>
            </div>
            <Link href="/tools/scenario-studio" className="self-start font-bold text-base text-[#7957FF]">
              {t("home.scenario.launch")}
            </Link>
          </div>
          <div className="flex-[1_1_500px] min-w-0 ls-persp">
            <div className="bg-white border border-[#D9D3E8] rounded-3xl [rotate:y_-10deg_x_4deg] [transform-style:preserve-3d] transition-[rotate] duration-500 hover:[rotate:y_-3deg_x_1deg] shadow-[inset_0_1px_0_#fff,-10px_10px_0_#E9E4FF,-11px_11px_0_#D9D3E8,-40px_50px_80px_-30px_rgba(121,87,255,0.45)]">
              <div className="px-8 py-7 flex justify-between items-center gap-4 border-b border-[#D9D3E8] flex-wrap">
                <span className="font-bold text-[21px] tracking-[-0.01em]">{t(scenarioDiffs[activeScenario].titleKey)}</span>
                <span className="text-sm font-bold text-white bg-[#7957FF] px-3 py-[7px] rounded-md shadow-[0_3px_0_#5B3BE6]">
                  {t(scenarioDiffs[activeScenario].tagKey)}
                </span>
              </div>
              <p className="m-0 px-8 pt-6 pb-2 text-base leading-[1.6] text-[#5A5566] min-h-[100px]">
                {t(scenarioDiffs[activeScenario].descKey)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-8 pt-4 pb-7">
                <div className="bg-[#FAF9F6] border border-[#D9D3E8] rounded-[14px] px-6 py-[22px] flex flex-col gap-2.5 shadow-[0_4px_0_#D9D3E8]">
                  <span className="text-sm font-semibold text-[#5A5566]">{t("home.scenario.coverShift")}</span>
                  <span className="font-extrabold text-[34px] tracking-[-0.03em] tabular-nums">
                    {scenarioDiffs[activeScenario].deltaCover > 0 ? "+" : ""}
                    {formatINR(scenarioDiffs[activeScenario].deltaCover, { compact: true })}
                  </span>
                </div>
                <div className="bg-[#E9E4FF] border border-[#D9D3E8] rounded-[14px] px-6 py-[22px] flex flex-col gap-2.5 shadow-[0_4px_0_#CFC5F5]">
                  <span className="text-sm font-semibold text-[#5A5566]">{t("home.scenario.premiumShift")}</span>
                  <span className="font-extrabold text-[34px] tracking-[-0.03em] text-[#7957FF] tabular-nums">
                    {scenarioDiffs[activeScenario].deltaPremium > 0 ? "+" : ""}
                    {t("home.scenario.perYear", { amount: formatINR(scenarioDiffs[activeScenario].deltaPremium) })}
                  </span>
                </div>
              </div>
              <div className="px-8 py-5 flex justify-between gap-3 flex-wrap border-t border-[#D9D3E8] text-[15px]">
                <span className="text-[#5A5566] font-medium">{t("home.scenario.baseline")}</span>
                <span className="font-bold">{t("home.scenario.recalc")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSURANCE DISCIPLINES */}
      <section className="px-6 sm:px-10 pb-32">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-14">
          <div className="flex flex-wrap gap-5 items-end justify-between">
            <div className="flex flex-col gap-4">
              <span className={eyebrow}>{t("home.disc.eyebrow")}</span>
              <h2 className={h2}>{t("home.disc.title")}</h2>
            </div>
            <p className="m-0 max-w-[460px] text-[17px] leading-[1.55] text-[#5A5566]">{t("home.disc.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ls-persp">
            {categories.map((c) => (
              <Link
                key={c.titleKey}
                href={c.href}
                className="ls-lift bg-white border border-[#D9D3E8] rounded-[20px] px-7 py-[30px] flex flex-col gap-3.5 shadow-[inset_0_1px_0_#fff,0_5px_0_#D9D3E8,0_26px_40px_-24px_rgba(36,33,43,0.28)]"
              >
                <span className="self-start text-[11.5px] font-bold tracking-[0.16em] uppercase text-[#7957FF] bg-[#E9E4FF] px-2.5 py-1.5 rounded-[5px]">
                  {t(c.tagKey)}
                </span>
                <span className="mt-1.5 font-extrabold text-[27px] tracking-[-0.035em]">{t(c.titleKey)}</span>
                <p className="m-0 text-[15.5px] leading-[1.6] text-[#5A5566] flex-1">{t(c.descKey)}</p>
                <div className="flex justify-between gap-3 pt-[18px] border-t border-[#D9D3E8] text-[15px] font-bold">
                  <span>{t(c.metricKey)}</span>
                  <span className="text-[#7957FF]">{t("home.disc.explore")}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Not sure where to start? */}
          <div className="flex flex-col gap-5 pt-10 border-t border-[#D9D3E8]">
            <h3 className="m-0 text-[22px] font-extrabold tracking-[-0.025em] flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#E9E4FF] text-[#7957FF] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </span>
              {t("home.disc.start")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {insuranceQuestions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2.5 min-h-12 px-5 py-2.5 rounded-2xl border border-[#D9D3E8] bg-white font-semibold text-[15px] shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5 hover:border-[#7957FF] hover:shadow-[0_4px_0_#7957FF,0_8px_16px_rgba(121,87,255,0.12)] transition-all"
                >
                  <span>{t(item.qKey)}</span>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-lg bg-[#E9E4FF] text-[#7957FF]">{t(item.tagKey)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-32">
        <div className="text-center flex flex-col gap-4 items-center mb-12">
          <span className={eyebrow}>{t("home.faq.eyebrow")}</span>
          <h2 className={h2}>{t("home.faq.title")}</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-7 rounded-[18px] bg-white border border-[#D9D3E8] space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#7957FF] flex-shrink-0" />
                <span>{t(faq.qKey)}</span>
              </h3>
              <p className="text-[15px] leading-[1.65] text-[#5A5566] ps-[30px]">{t(faq.aKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="px-6 sm:px-10 pb-32 ls-persp" data-no-reveal>
        <div
          data-scroll-tilt="8"
          className="max-w-[1280px] mx-auto rounded-[32px] px-6 sm:px-12 py-24 flex flex-col items-center text-center gap-7 text-white [transform-origin:top_center] shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_12px_0_#5B3BE6,0_60px_90px_-30px_rgba(121,87,255,0.6)]"
          style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}
        >
          <h2
            className="m-0 font-extrabold text-[clamp(30px,3.8vw,56px)] leading-[1.05] tracking-[-0.04em] max-w-[760px]"
            style={{ color: "#FFFFFF" }}
          >
            {t("home.cta.title")}
          </h2>
          <p className="m-0 max-w-[600px] text-[19px] leading-[1.55] text-[#F1EEFF]">{t("home.cta.body")}</p>
          <Link
            href="/assessment"
            className="mt-3 h-[66px] px-9 bg-white text-[#7957FF] rounded-lg flex items-center gap-3.5 font-bold text-lg shadow-[0_6px_0_#D9D3E8,0_24px_40px_-14px_rgba(36,33,43,0.45)] hover:-translate-y-[3px] active:translate-y-[5px] active:shadow-[0_1px_0_#D9D3E8] transition-all"
          >
            {t("home.cta.button")} <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

type HeroFeature = { k: React.ComponentType<{ className?: string; strokeWidth?: number }>; tKey: MessageKey };

function FeatureCard({ k: Icon, tKey }: HeroFeature) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[rgba(255,255,255,0.86)] backdrop-blur-md border border-[#D9D3E8] px-4 py-3 shadow-[inset_0_1px_0_#fff,0_4px_0_#E9E4FF,0_5px_0_#D9D3E8,0_22px_36px_-18px_rgba(121,87,255,0.5)]">
      <span
        className="flex-none w-11 h-11 rounded-xl grid place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_3px_0_#5B3BE6]"
        style={{ background: "linear-gradient(160deg,#9A80FF,#7957FF)" }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.9} />
      </span>
      <span className="text-[13.5px] leading-[1.3] font-semibold text-[#24212B]">{t(tKey)}</span>
    </div>
  );
}

/** Hero scene: the banner image (features and copy are part of the artwork) tilts toward the cursor. */
function HeroScene({ features, mobile }: { features: HeroFeature[]; mobile?: boolean }) {
  const t = useT();
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (mobile) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const target = { x: 0, y: 0 },
      cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      if (imgRef.current) {
        imgRef.current.style.transform = `perspective(1400px) rotateY(${(cur.x * 9).toFixed(2)}deg) rotateX(${(cur.y * -6).toFixed(2)}deg) translate3d(${(cur.x * -26).toFixed(1)}px, ${(cur.y * -14).toFixed(1)}px, 0)`;
      }
    };
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mobile]);

  const fade = {
    WebkitMaskImage:
      "linear-gradient(90deg,transparent 0%,#000 3%),linear-gradient(270deg,transparent 0%,#000 3%),linear-gradient(0deg,transparent 0%,#000 5%),linear-gradient(180deg,transparent 0%,#000 3%)",
    WebkitMaskComposite: "source-in",
    maskImage:
      "linear-gradient(90deg,transparent 0%,#000 3%),linear-gradient(270deg,transparent 0%,#000 3%),linear-gradient(0deg,transparent 0%,#000 5%),linear-gradient(180deg,transparent 0%,#000 3%)",
    maskComposite: "intersect",
  } as React.CSSProperties;

  const alt = t("home.hero.alt");

  if (mobile)
    return (
      <div className="lg:hidden px-4 pb-12 flex flex-col gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-banner-final.webp" alt={alt} width={1672} height={941} className="w-full h-auto" style={fade} />
        <div className="grid gap-3 sm:grid-cols-3 px-2">
          {features.map((f) => (
            <FeatureCard key={f.tKey} {...f} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="hidden lg:block absolute right-0 top-1/2 w-[64%] [translate:0_-50%]" style={{ perspective: "1400px" }}>
      <div ref={imgRef} className="relative [transform-style:preserve-3d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-banner-final.webp"
          alt={alt}
          width={1672}
          height={941}
          decoding="async"
          className="block w-full h-auto select-none"
          style={fade}
          draggable={false}
        />
      </div>
    </div>
  );
}
