"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  RotateCcw
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function ProtectionPassportPage() {
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromAPI("/passport")
      .then(data => setPassport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-xs text-[#24212B] font-bold">
        Loading Protection Passport...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF] text-[#24212B]">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF]/40 text-xs font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7957FF]" />
          <span>Verified Family Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] tracking-tight">
          My Protection Passport™
        </h1>
        <p className="text-sm font-medium text-[#4A4553]">
          Your persistent financial safety record: declared active policies, calculated gap, 
          and nominee preparedness checklist.
        </p>
      </div>

      {/* Main Passport Card in Charcoal */}
      <div className="p-8 rounded-xl bg-[#FFFFFF] text-[#24212B] border border-[#7957FF]/40 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D3E8] pb-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#6F6A7C] font-bold">Holder Name</span>
            <div className="text-2xl font-black mt-0.5 text-[#24212B]">{passport.full_name}</div>
            <span className="text-xs font-medium text-[#7957FF]">{passport.email}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-[#6F6A7C]">Emergency Readiness Score</span>
            <div className="text-3xl font-black text-[#7957FF] mt-0.5">
              {passport.emergency_readiness_score}%
            </div>
            <span className="text-xs font-medium text-[#6F6A7C]">Last Reviewed: {passport.last_health_check_date}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
            <span className="text-[#6F6A7C] font-medium">Total Protection Gap</span>
            <div className="text-2xl font-black text-[#24212B]">
              {formatINR(passport.total_coverage_gap, { compact: true })}
            </div>
            <span className="text-xs text-[#6F6A7C]">Recommended: {formatINR(passport.recommended_sum_assured, { compact: true })}</span>
          </div>

          <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
            <span className="text-[#6F6A7C] font-medium">Active Declared Policies</span>
            <div className="text-2xl font-black text-[#24212B]">
              {passport.active_policies_count} Active
            </div>
            <span className="text-xs text-[#6F6A7C]">Logged in Safety Net</span>
          </div>

          <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
            <span className="text-[#6F6A7C] font-medium">Mapped Dependents</span>
            <div className="text-2xl font-black text-[#24212B]">
              {passport.dependents_mapped} Members
            </div>
            <span className="text-xs text-[#6F6A7C]">Spouse + 2 Children</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#6F6A7C] font-medium">Verified under Capital Needs Analysis standard</span>
          <Link
            href="/assessment"
            className="px-4 py-2 bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] font-extrabold rounded border border-[#7957FF] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>Recalculate Assessment</span>
          </Link>
        </div>
      </div>

      {/* Declared Policies Section */}
      <div className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9D3E8] pb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#24212B]">
            Declared Active Policies in Safety Net
          </span>
          <Link href="/dashboard/policies" className="text-xs font-extrabold text-[#7957FF] hover:underline">
            Manage All Policies →
          </Link>
        </div>

        <div className="divide-y divide-[#000000]">
          {passport.declared_policies.map((pol: any, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-[#24212B]">{pol.insurer} Term Plan</div>
                <div className="text-[#4A4553] font-medium">Sum Assured: {formatINR(pol.sum_assured, { compact: true })}</div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-[#24212B]">{formatINR(pol.annual_premium)}/yr</span>
                <div className="text-xs font-medium text-[#6F6A7C]">Renewal Due: {pol.due_date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
