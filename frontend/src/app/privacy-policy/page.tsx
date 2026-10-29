import React from "react";
import { Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | LifeSure AI",
  description: "Data privacy practices, Digital Personal Data Protection (DPDP) Act 2023 alignment, and user rights."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-xs leading-relaxed text-[#6F6A7C]">
      
      <div className="space-y-3 border-b border-[#D9D3E8] pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>DPDP Act 2023 Aligned</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#24212B]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#7F8FA4]">
          Last Updated: October 2026 | Effective Date: October 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">1. Introduction & Scope</h2>
        <p>
          LifeSure AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your financial and personal data in strict compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian cybersecurity guidelines. This Privacy Policy details the categories of personal data collected, processing justifications, security safeguards, and your statutory rights as a Data Principal.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">2. Categories of Data Collected</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Financial & Demographic Planning Inputs:</strong> Age, approximate annual take-home income, household expenditure, financial liabilities, dependent counts, and future education targets provided for needs calculation.</li>
          <li><strong>Document Text Excerpts:</strong> Excerpts uploaded to Policy X-Ray or secured in the Emergency Insurance Vault. Documents are parsed client-side or in isolated in-memory containers and never shared with commercial telemarketers.</li>
          <li><strong>Contact Information:</strong> Name, email address, and phone number provided voluntarily when booking an accredited fiduciary advisor or creating a Protection Passport.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">3. Purpose of Processing & Plan Matching</h2>
        <p>
          Your data is processed exclusively to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Execute deterministic Capital Needs Analysis and Human Life Value (HLV) algorithms.</li>
          <li>Use only the profile details needed (such as age, income and cover need) to filter and score real term plans with our published scoring rules.</li>
          <li>Deliver grounded AI conversational explanations without exposing personal identifiable information (PII) to training corpora.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">4. Zero Sale of Personal Data</h2>
        <p>
          We do <strong>not</strong> sell, rent, monetize, or broker your personal financial records or phone numbers to third-party telemarketing agencies, insurance agents, or commercial lead-generation aggregators.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">5. Data Principal Rights & Erasure Workflow</h2>
        <p>
          Under the DPDP Act 2023, you have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access a summary of your personal data processed by our systems.</li>
          <li>Request correction of inaccurate or misleading financial assumptions.</li>
          <li>Request permanent erasure of your Protection Passport, saved scenarios, and vault documents.</li>
          <li>Nominate an individual to exercise these rights in the event of demise or incapacity.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">6. Grievance Redressal Officer</h2>
        <p>
          In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and DPDP Act 2023, our designated Grievance Officer is:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-[#D9D3E8] space-y-1">
          <div className="font-bold text-[#24212B]">Grievance Redressal Officer: Priya Raman</div>
          <div>LifeSure AI Technologies Private Limited</div>
          <div>Email: grievance@lifesure.ai | Physical Address: Bengaluru, Karnataka - 560103, India</div>
          <div>Response Timeline: Within 48 hours acknowledgement, 15 business days resolution.</div>
        </div>
      </section>

    </div>
  );
}
