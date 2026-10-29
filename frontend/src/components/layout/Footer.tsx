import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Shield, Lock, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-transparent border-t border-[#D9D3E8] text-[#24212B] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#D9D3E8]">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo />
            <p className="text-sm font-bold leading-relaxed max-w-sm text-[#24212B]">
              Plan Better. Choose Smarter. Protect What Matters.
            </p>
            <p className="text-xs leading-relaxed max-w-sm text-[#4A4553] font-medium">
              LifeSure AI connects deterministic financial needs assessment, transparent plan matching on real insurer data, 
              scenario simulation, and policy document intelligence for Indian retail banking customers.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-[#24212B]">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#24212B]" /> Explainable Matching</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-[#24212B]" /> Private by default</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#24212B]" /> IRDAI Benchmarks</span>
            </div>
          </div>

          {/* Insurance Categories */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">
              Insurance
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li><Link href="/insurance/term" className="hover:text-[#7957FF]">Term Insurance</Link></li>
              <li><Link href="/insurance/life" className="hover:text-[#7957FF]">Life Insurance</Link></li>
              <li><Link href="/insurance/health" className="hover:text-[#7957FF]">Health Insurance</Link></li>
              <li><Link href="/insurance/general" className="hover:text-[#7957FF]">General & Property</Link></li>
              <li><Link href="/insurance/investment-linked" className="hover:text-[#7957FF]">Investment-Linked (ULIP)</Link></li>
              <li><Link href="/insurance/business" className="hover:text-[#7957FF]">Business & Keyman</Link></li>
              <li><Link href="/insurance/other" className="hover:text-[#7957FF]">Cyber & Accident</Link></li>
            </ul>
          </div>

          {/* Smart Tools */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">
              Core Journey & Tools
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li><Link href="/assessment" className="hover:text-[#7957FF]">Stage 1: Needs Assessment</Link></li>
              <li><Link href="/results" className="hover:text-[#7957FF]">Stage 2: Coverage Results</Link></li>
              <li><Link href="/products" className="hover:text-[#7957FF]">Stage 3: Plan Matching</Link></li>
              <li><Link href="/advisory" className="hover:text-[#7957FF]">Stage 4: Digital Advisory</Link></li>
              <li><Link href="/tools/scenario-studio" className="hover:text-[#7957FF]">Scenario Studio</Link></li>
              <li><Link href="/tools/family-survival-simulator" className="hover:text-[#7957FF]">Survival Simulator</Link></li>
              <li><Link href="/tools" className="hover:text-[#7957FF] font-extrabold">All 12 Smart Tools →</Link></li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[1.6px] text-[#7957FF] mb-4">
              Governance & Legal
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-[#24212B]">
              <li><Link href="/privacy-policy" className="hover:text-[#7957FF]">DPDP Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-[#7957FF]">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-[#7957FF]">Cookie Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[#7957FF]">Cancellation & Refunds</Link></li>
              <li><Link href="/resources/claims" className="hover:text-[#7957FF]">Claims Companion</Link></li>
              <li><Link href="/contact" className="hover:text-[#7957FF]">Grievance Officer</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-bold text-[#24212B] gap-4">
          <div>
            © 2026 LifeSure AI Technologies. Blue & White Design System. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#24212B]" /> IRDAI Regulated Products Catalogue
            </span>
            <span>•</span>
            <span>Digital Personal Data Protection Act (2023) Aligned</span>
          </div>
        </div>

        {/* Regulatory & Disclaimer Notice */}
        <div className="mt-8 pt-6 border-t border-[#D9D3E8] text-[11px] leading-relaxed text-[#4A4553] font-medium">
          <p className="mb-2">
            <strong>Statutory Disclaimer:</strong> LifeSure AI provides educational financial calculation tools, capital needs assessments, and algorithm-based product rankings for informational evaluation. We do not provide authorized underwriting guarantees or execute direct policy bound contracts. Premium figures are illustrative estimates based on regulatory tariff rates.
          </p>
          <p>
            Insurance is the subject matter of solicitation. Please read all sales literature and policy schedules carefully before concluding a purchase. Grievance escalation under IRDAI Bima Bharosa token registry.
          </p>
        </div>

      </div>
    </footer>
  );
}
