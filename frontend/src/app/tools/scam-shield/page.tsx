"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, PhoneCall, HelpCircle } from "lucide-react";

export default function ScamShieldPage() {
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  const redFlags = [
    {
      id: "caller_claims_irdai",
      title: "Caller claims to be an 'Official IRDAI Officer / Ombudsman'",
      desc: "IRDAI is a statutory regulator and NEVER calls citizens directly to distribute bonuses, refund lapsed money, or sell policies."
    },
    {
      id: "unclaimed_bonus",
      title: "Promises 'Unclaimed bonus' or 'Surrender fund release' if you buy a new policy",
      desc: "Classic scam tactic. Insurers never demand you buy a new policy to release funds from an old policy."
    },
    {
      id: "interest_free_loan",
      title: "Promises interest-free personal loan against an insurance policy purchase",
      desc: "Zero-interest loan promises tied to instant policy purchase are fraudulent misrepresentations."
    },
    {
      id: "personal_account_transfer",
      title: "Asks for premium payment into an individual's personal bank account or UPI handle",
      desc: "All genuine insurance premiums in India are paid directly to the registered Insurer's official payment gateway."
    }
  ];

  const toggleFlag = (id: string) => {
    if (selectedFlags.includes(id)) {
      setSelectedFlags(selectedFlags.filter(f => f !== id));
    } else {
      setSelectedFlags([...selectedFlags, id]);
    }
  };

  const threatLevel = selectedFlags.length === 0 ? "Safe" : selectedFlags.length === 1 ? "Moderate Risk" : "Severe Fraud Risk";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Consumer Defense</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Insurance Scam Shield™
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Identify predatory caller tactics, fake IRDAI impersonations, and fraudulent bonus promises.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
          Check Any Behaviors You Have Encountered:
        </h2>

        <div className="space-y-3">
          {redFlags.map((flag) => {
            const isChecked = selectedFlags.includes(flag.id);
            return (
              <div
                key={flag.id}
                onClick={() => toggleFlag(flag.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
                    : "border-[#D9D3E8] dark:border-[#1E2D4A] hover:bg-[#FAF9F6] dark:hover:bg-[#142447]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 mt-0.5 accent-rose-500 rounded"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-[#24212B] dark:text-white mb-1">
                      {flag.title}
                    </h3>
                    <p className="text-[11px] text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                      {flag.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Threat Level Verdict */}
        <div className={`p-4 rounded-xl text-xs font-medium space-y-2 ${
          selectedFlags.length > 0
            ? "bg-rose-100/70 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
            : "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {selectedFlags.length > 0 ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span>Verdict: {threatLevel}</span>
          </div>
          {selectedFlags.length > 0 ? (
            <p>
              CRITICAL: Do NOT share OTPs, policy certificates, or bank account credentials. Report this incident immediately to the IRDAI Grievance Portal (toll-free 155255 / 1800 4254 732) and the National Cyber Crime portal at cybercrime.gov.in.
            </p>
          ) : (
            <p>
              No high-risk scam indicators selected. Always ensure any premium is paid directly on the insurer&apos;s verified web portal with HTTPS.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
