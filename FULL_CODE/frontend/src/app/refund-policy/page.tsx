import React from "react";

export const metadata = {
  title: "Refund Policy | LifeSure AI",
  description: "Transparency regarding consumer fee structures and advisory billing.",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-xs leading-relaxed text-[#6F6A7C]">
      <div className="space-y-3 border-b border-[#D9D3E8] pb-6">
        <h1 className="text-3xl font-extrabold text-[#24212B]">Refund Policy</h1>
        <p className="text-xs text-[#7F8FA4]">Clear Consumer Disclosure | Effective October 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">1. Free Consumer Advisory & Calculation Tools</h2>
        <p>
          LifeSure AI provides its core financial engineering suite—including the AI Life-Cover Calculator, Scenario Studio, Family Survival
          Simulator, Policy X-Ray, and Protection Passport—as a <strong>100% complimentary digital public resource</strong> for Indian
          citizens and households.
        </p>
        <p>
          Because we do not charge users any upfront subscription or usage fee to calculate needs, run scenarios, or inspect documents, no
          billing transactions occur on our primary consumer platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">2. Free-Look statutory Cancellation for Insurance Policies</h2>
        <p>If you subsequently choose to purchase an insurance policy from a licensed insurer:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Every policyholder in India is protected by the statutory <strong>30-Day Free-Look Period</strong> mandated by IRDAI.
          </li>
          <li>
            If you are dissatisfied with the policy contract or terms upon receiving the official policy bond, you are legally entitled to
            return the policy to the insurer within 30 days for a 100% full refund of the premium paid (minus proportionate risk premium for
            the period on cover and statutory stamp duty).
          </li>
        </ul>
      </section>
    </div>
  );
}
