import React from "react";
import Link from "next/link";
import { Shield, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Layers, FileText } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { InsuranceProduct } from "@/types";

interface CategoryPageProps {
  categoryKey: string;
  categoryTitle: string;
  tagline: string;
  purpose: string;
  whoShouldConsider: string[];
  keyBenefits: string[];
  exclusions: string[];
  pricingFactors: string[];
  questionsToAsk: string[];
  products: InsuranceProduct[];
}

export function CategoryPageTemplate({
  categoryTitle,
  tagline,
  purpose,
  whoShouldConsider,
  keyBenefits,
  exclusions,
  pricingFactors,
  questionsToAsk,
  products
}: CategoryPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#FFFFFF] text-[#24212B]">
      
      {/* Category Hero */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFFFFF] border border-[#7957FF]/40 text-[#7957FF] text-xs font-extrabold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-[#7957FF]" />
          <span>Insurance Category Guide</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#24212B] leading-tight">
          {categoryTitle}
        </h1>
        <p className="text-base text-[#4A4553] leading-relaxed font-medium">
          {tagline}
        </p>
      </div>

      {/* Purpose & Target Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-3">
          <h2 className="text-base font-extrabold text-[#24212B]">
            Primary Financial Purpose
          </h2>
          <p className="text-xs text-[#4A4553] leading-relaxed font-medium">
            {purpose}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-3">
          <h2 className="text-base font-extrabold text-[#24212B]">
            Who Should Consider This?
          </h2>
          <ul className="space-y-2 text-xs text-[#4A4553] font-medium">
            {whoShouldConsider.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#7957FF] font-bold">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Benefits vs Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4">
          <div className="flex items-center gap-2 text-[#24212B] font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5 text-[#24212B]" />
            <span>Essential Benefits</span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#4A4553] font-medium">
            {keyBenefits.map((b, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] flex items-start gap-2">
                <span className="text-[#24212B] font-bold">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-4">
          <div className="flex items-center gap-2 text-[#7957FF] font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-[#7957FF]" />
            <span>Exclusions & Critical Limitations</span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#4A4553] font-medium">
            {exclusions.map((e, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#7957FF]/30 flex items-start gap-2">
                <span className="text-[#7957FF] font-bold">✗</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verified Products Showcase */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#D9D3E8] pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">MARKET OVERVIEW</span>
            <h2 className="text-2xl font-extrabold text-[#24212B]">
              Verified Regulatory Catalog Products
            </h2>
          </div>
          <span className="text-xs text-[#6F6A7C] font-medium">
            IRDAI Disclosures FY 2023-24
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] hover:border-[#7957FF] transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#24212B] uppercase">{p.insurer}</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF]/40">
                    CSR: {p.claim_settlement_ratio}%
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#24212B]">
                  {p.name}
                </h3>
                <p className="text-xs text-[#4A4553] leading-relaxed font-medium">
                  {p.tagline}
                </p>

                <div className="pt-2 space-y-1">
                  {p.key_features.slice(0, 3).map((f, i) => (
                    <div key={i} className="text-xs text-[#4A4553] flex items-center gap-1.5 font-medium">
                      <span className="text-[#24212B] font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#D9D3E8] flex items-center justify-between text-xs">
                <span className="text-[#6F6A7C] font-medium">Solvency: {p.solvency_ratio}x</span>
                <Link
                  href="/tools/life-cover-calculator"
                  className="font-extrabold text-[#24212B] hover:text-[#7957FF] flex items-center gap-1 transition-colors"
                >
                  <span>Model In Assessment</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions to Ask & Pricing Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-3">
          <h3 className="text-sm font-extrabold text-[#24212B] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#7957FF]" />
            <span>Questions to Ask Before Signing</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-[#4A4553] font-medium">
            {questionsToAsk.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#7957FF] font-bold">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-3">
          <h3 className="text-sm font-extrabold text-[#24212B] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#7957FF]" />
            <span>What Determines Your Premium?</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-[#4A4553] font-medium">
            {pricingFactors.map((pf, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#7957FF] font-bold">•</span>
                <span>{pf}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
