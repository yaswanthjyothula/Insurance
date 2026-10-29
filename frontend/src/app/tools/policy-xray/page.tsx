"use client";

import React, { useState } from "react";
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Search,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function PolicyXRayPage() {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const samplePolicyText = `POLICY SCHEDULE - HDFC Life Insurance Co. Ltd.
Policy Name: Click 2 Protect Super (Pure Term Plan)
Policy Number: POL-9921-8841-IND
Basic Sum Assured: ₹10,000,000 (One Crore Indian Rupees)
Annualized Installment Premium: ₹14,850.00
Policy Term: 30 Years
Premium Paying Term: 30 Years
Grace Period: 30 calendar days allowed from premium installment due date.
Terminal Illness Benefit: 100% accelerated payout upon diagnosis of certified illness with <6 months prognosis.
Suicide Exclusion Clause: In case of death due to suicide within 12 months from policy inception, 80% of total premiums paid shall be refunded to nominee.
Free-Look Period: 30 days from policy certificate receipt for electronic/online policies.`;

  const handleAnalyze = async (rawText?: string) => {
    setLoading(true);
    try {
      const textToSubmit = rawText || textInput || samplePolicyText;
      const res = await fetchFromAPI("/policies/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ raw_text: textToSubmit }).toString()
      });
      setAnalysisResult(res);
    } catch (err) {
      console.error("X-Ray error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setTextInput(samplePolicyText);
    setFileName("Sample_HDFC_Term_Policy.txt");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9E4FF] dark:bg-[#1B2B4D] text-[#7957FF] text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          <span>Policy Document Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Policy X-Ray™
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl mx-auto">
          Extract schedule details, hidden exclusions, waiting periods, and critical gaps 
          from your existing life or term insurance contracts.
        </p>
      </div>

      {/* Upload & Input Section */}
      <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#24212B] dark:text-white">
            Upload Schedule Document or Paste Excerpt
          </span>
          <button
            onClick={handleLoadSample}
            className="text-xs font-bold text-[#7957FF] hover:underline"
          >
            Load Sample Policy Schedule
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 text-center hover:border-[#7957FF] transition-colors cursor-pointer bg-[#FAF9F6] dark:bg-[#142447]">
            <UploadCloud className="w-8 h-8 text-[#7957FF] mx-auto mb-2" />
            <div className="text-xs font-bold text-[#24212B] dark:text-white">
              {fileName ? `Loaded: ${fileName}` : "Drag & Drop Policy Schedule PDF / Scanned Copy"}
            </div>
            <p className="text-[11px] text-[#7F8FA4] mt-1">
              Private and locally parsed. Your documents are never stored or shared with external parties.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6F6A7C] dark:text-[#A59FB5] mb-1">
              Or Paste Text Content Directly:
            </label>
            <textarea
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste text excerpt from policy schedule or terms document..."
              className="w-full p-3 text-xs rounded-xl border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447] text-[#24212B] dark:text-white font-mono"
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="w-full py-3.5 text-xs font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Extracting Clauses & Citations...</span>
            ) : (
              <>
                <span>Run Policy X-Ray Analysis</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Extracted Metrics */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
                  Verified Schedule Identification
                </span>
                <h3 className="text-xl font-bold text-[#24212B] dark:text-white">
                  {analysisResult.insurer}
                </h3>
                <span className="text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                  {analysisResult.product_name} | {analysisResult.policy_number_masked}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#7F8FA4]">Identified Basic Sum Assured</span>
                <div className="text-2xl font-black text-[#24212B] dark:text-white">
                  {formatINR(analysisResult.sum_assured, { compact: true })}
                </div>
                <span className="text-xs text-[#0E9F7E] font-bold">
                  Premium: {formatINR(analysisResult.annual_premium)}/yr
                </span>
              </div>
            </div>

            {/* Citations with Source References */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#24212B] dark:text-white">
                Extracted Clause Citations (With Page Reference & Confidence)
              </span>

              <div className="space-y-2">
                {analysisResult.citations.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#24212B] dark:text-white">{c.clause_title}</span>
                      <span className="text-[#7957FF] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-[10px]">
                        Page {c.page_reference} | Confidence: {(c.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs italic text-[#6F6A7C] dark:text-[#A59FB5] leading-relaxed">
                      &ldquo;{c.extracted_text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits & Exclusions Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E9F7E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Policy Benefits</span>
                </span>
                <ul className="space-y-2 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                  {analysisResult.key_benefits.map((b: string, i: number) => (
                    <li key={i} className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2">
                      <span className="text-[#0E9F7E] font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Exclusions & Restrictions</span>
                </span>
                <ul className="space-y-2 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                  {analysisResult.exclusions.map((e: string, i: number) => (
                    <li key={i} className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 flex items-start gap-2">
                      <span className="text-rose-500 font-bold">✗</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Questions to ask the insurer */}
            <div className="pt-4 border-t border-[#D9D3E8] dark:border-[#1E2D4A] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#24212B] dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#7957FF]" />
                <span>Suggested Questions to Ask Your Insurer or Agent</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
                {analysisResult.suggested_questions_for_insurer.map((q: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[#7957FF]">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] text-[#7F8FA4] italic pt-2">
              {analysisResult.disclaimer}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
