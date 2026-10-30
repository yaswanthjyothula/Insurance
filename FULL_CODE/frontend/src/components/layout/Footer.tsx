"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useT } from "@/i18n/I18nProvider";

export function Footer() {
  const t = useT();
  return (
    <footer className="bg-transparent border-t border-[#D9D3E8] text-[#24212B] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#D9D3E8]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo />
            <p className="text-sm font-bold leading-relaxed max-w-sm text-[#24212B]">{t("layout.footer.tagline")}</p>
            <p className="text-xs leading-relaxed max-w-sm text-[#4A4553] font-medium">{t("layout.footer.about")}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-[#24212B]">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#24212B]" /> {t("layout.footer.badge.explainable")}
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#24212B]" /> {t("layout.footer.badge.private")}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24212B]" /> {t("layout.footer.badge.irdai")}
              </span>
            </div>
          </div>

          {/* Insurance Categories */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">
              {t("layout.footer.insurance")}
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li>
                <Link href="/insurance/term" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.term")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/life" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.life")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/health" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.health")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/general" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.general")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/investment-linked" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.ulip")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/business" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.business")}
                </Link>
              </li>
              <li>
                <Link href="/insurance/other" className="hover:text-[#7957FF]">
                  {t("layout.footer.insurance.other")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Smart Tools */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">
              {t("layout.footer.journey")}
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li>
                <Link href="/assessment" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.stage1")}
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.stage2")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.stage3")}
                </Link>
              </li>
              <li>
                <Link href="/advisory" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.stage4")}
                </Link>
              </li>
              <li>
                <Link href="/tools/scenario-studio" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.scenario")}
                </Link>
              </li>
              <li>
                <Link href="/tools/family-survival-simulator" className="hover:text-[#7957FF]">
                  {t("layout.footer.journey.survival")}
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-[#7957FF] font-extrabold">
                  {t("layout.footer.journey.allTools")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">{t("layout.footer.legal")}</h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li>
                <Link href="/privacy-policy" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.terms")}
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.cookies")}
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.refunds")}
                </Link>
              </li>
              <li>
                <Link href="/resources/claims" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.claims")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#7957FF]">
                  {t("layout.footer.legal.grievance")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex justify-start">
          <LanguageSwitcher />
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-bold text-[#24212B] gap-4">
          <div>{t("layout.footer.copyright")}</div>
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#24212B]" /> {t("layout.footer.syntheticPack")}
            </span>
            <span>•</span>
            <span>{t("layout.footer.dpdp")}</span>
          </div>
        </div>

        {/* Regulatory & Disclaimer Notice */}
        <div className="mt-8 pt-6 border-t border-[#D9D3E8] text-[11px] leading-relaxed text-[#4A4553] font-medium">
          <p className="mb-2">
            <strong>{t("layout.footer.disclaimerLabel")}</strong> {t("layout.footer.disclaimerBody")}
          </p>
          <p>{t("layout.footer.solicitation")}</p>
        </div>
      </div>
    </footer>
  );
}
