"use client";

import React, { useState, useEffect } from "react";
import { Shield, Building2, CheckCircle2, ExternalLink } from "lucide-react";
import { fetchFromAPI } from "@/lib/api";

export default function InsurerDirectoryPage() {
  const [insurers, setInsurers] = useState<any[]>([]);

  useEffect(() => {
    fetchFromAPI("/resources/directory").then(data => setInsurers(data || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>IRDAI Regulatory Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Insurance Company Directory
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Verified solvency ratios, 3-year Claim Settlement Ratios (CSR), and statutory registration details 
          compiled from IRDAI Annual Reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insurers.map((ins, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#7957FF] uppercase">
                  IRDAI Reg #{ins.irda_reg_no}
                </span>
                <h2 className="text-base font-bold text-[#24212B] dark:text-white mt-0.5">
                  {ins.name}
                </h2>
                <span className="text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                  {ins.type} | Est. {ins.established} | {ins.headquarters}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A]">
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">Claim Settlement (CSR)</span>
                <div className="text-xl font-extrabold text-[#0E9F7E] mt-0.5">{ins.claim_settlement_ratio}%</div>
                <span className="text-[10px] text-[#7F8FA4]">IRDAI FY 2023-24</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A]">
                <span className="text-[#6F6A7C] dark:text-[#A59FB5]">Solvency Ratio</span>
                <div className="text-xl font-extrabold text-[#7957FF] mt-0.5">{ins.solvency_ratio}x</div>
                <span className="text-[10px] text-[#7F8FA4]">Min required: 1.50x</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#7F8FA4]">Source: {ins.source}</span>
              <a
                href={ins.website}
                target="_blank"
                rel="noreferrer"
                className="text-[#7957FF] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
