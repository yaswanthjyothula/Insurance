import React from "react";
import { FileText, CheckCircle2, ShieldCheck, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Claim Preparation Companion | LifeSure AI",
  description: "Step-by-step master checklist and guide for nominees to file and settle life insurance claims smoothly in India."
};

export default function ClaimCompanionPage() {
  const steps = [
    {
      step: 1,
      title: "Immediate Insurer Intimation",
      desc: "Contact the insurer's claims department or 24x7 toll-free helpline within 30 days of the unfortunate event. Quote the policy number and date of demise to initiate the claim reference docket.",
      docs: ["Policy Certificate / Schedule Number", "Death Intimation Form", "Nominee Contact Details"]
    },
    {
      step: 2,
      title: "Compiling Statutory Municipal Records",
      desc: "Gather original attested copies of official municipal death records. Digital death certificates issued by Municipal Corporations with QR codes are fully accepted.",
      docs: [
        "Certified Municipal Death Certificate (Original)",
        "Original Policy Bond / Certificate",
        "Hospital Medical Death Cause Certificate & Discharge Summary",
        "Nominee KYC (PAN Card, Aadhaar Card)",
        "Cancelled Bank Cheque of Nominee Active Account"
      ]
    },
    {
      step: 3,
      title: "Special Requirements for Accidental / Unnatural Claims",
      desc: "If the claim arises from a road accident, drowning, injury, or unnatural cause, statutory law enforcement reports are mandatory.",
      docs: [
        "First Information Report (FIR) / Police Inquest Panchnama",
        "Post-Mortem / Forensic Autopsy Report",
        "Final Police Investigation Closure Report"
      ]
    },
    {
      step: 4,
      title: "Statutory 30-Day Settlement Mandate",
      desc: "Under IRDAI (Protection of Policyholders' Interests) Regulations, insurers must settle death claims within 30 days of receiving all complete documentation. Delays beyond 30 days legally mandate the insurer to pay bank bank rate + 2% penal interest to the nominee."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          <span>Nominee Settlement Checklist</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Claim Companion™
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          A definitive, step-by-step master checklist to guide your family nominees through a seamless, 
          stress-free death claim settlement.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((s) => (
          <div
            key={s.step}
            className="p-6 rounded-2xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7957FF] text-white font-bold flex items-center justify-center text-sm">
                {s.step}
              </div>
              <h2 className="text-base font-bold text-[#24212B] dark:text-white">
                {s.title}
              </h2>
            </div>

            <p className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed pl-11">
              {s.desc}
            </p>

            {s.docs && (
              <div className="ml-11 pt-2 space-y-1.5 border-t border-[#D9D3E8]/60 dark:border-[#1E2D4A]/60">
                <span className="text-[11px] font-bold text-[#24212B] dark:text-white uppercase block mb-1">
                  Required Documentation:
                </span>
                {s.docs.map((doc, idx) => (
                  <div key={idx} className="text-xs text-[#6F6A7C] dark:text-[#A59FB5] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F7E] flex-shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[#E9E4FF]/50 dark:bg-[#1B2B4D]/50 border border-[#7957FF]/20 text-xs text-[#24212B] dark:text-[#F1F5F9] leading-relaxed space-y-1">
        <strong>Section 45 Statutory Shield:</strong> Under Section 45 of the Insurance Act 1938, after a policy has been in force for three continuous years, no life insurance policy can be called into question or repudiated by the insurer on any grounds. Ensure your nominees know where your policy bond is stored.
      </div>

    </div>
  );
}
