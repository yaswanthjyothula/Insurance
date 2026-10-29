"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Bell } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function InsuranceSafetyNetPage() {
  const [policies, setPolicies] = useState([
    {
      id: "pol-01",
      insurer: "HDFC Life Insurance",
      planName: "Click 2 Protect Super",
      policyNumber: "POL-9841-8842",
      sumAssured: 10000000,
      annualPremium: 14850,
      renewalDate: "2027-04-15",
      nominee: "Sneha Sharma (Spouse)",
      status: "Active"
    },
    {
      id: "pol-02",
      insurer: "HDFC ERGO General Insurance",
      planName: "Optima Secure Health",
      policyNumber: "POL-7712-4411",
      sumAssured: 2000000,
      annualPremium: 18200,
      renewalDate: "2027-08-20",
      nominee: "Family Floater",
      status: "Active"
    }
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [insurer, setInsurer] = useState("");
  const [sumAssured, setSumAssured] = useState(5000000);
  const [premium, setPremium] = useState(12000);

  const handleAddPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicies([
      ...policies,
      {
        id: `pol-0${policies.length + 1}`,
        insurer: insurer || "ICICI Prudential",
        planName: "Term Life Protection Plan",
        policyNumber: "POL-3321-7719",
        sumAssured,
        annualPremium: premium,
        renewalDate: "2027-11-01",
        nominee: "Spouse",
        status: "Active"
      }
    ]);
    setShowAdd(false);
  };

  const totalSumAssured = policies.reduce((acc, p) => acc + p.sumAssured, 0);
  const totalAnnualPremium = policies.reduce((acc, p) => acc + p.annualPremium, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF] text-[#24212B]">
      
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D3E8] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF]/40 text-xs font-extrabold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7957FF]" />
            <span>Policy Portfolio Tracker</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#24212B]">
            Insurance Safety Net™
          </h1>
          <p className="text-xs font-medium text-[#4A4553]">
            Track your active declared life and health policies, nominee allocations, and renewal calendars.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-5 py-2.5 text-xs font-extrabold text-[#FFFFFF] bg-[#7957FF] hover:bg-[#6444E6] border border-[#7957FF] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Existing Policy</span>
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
          <span className="text-xs font-bold text-[#6F6A7C] uppercase">Total Active Cover</span>
          <div className="text-3xl font-extrabold text-[#24212B]">
            {formatINR(totalSumAssured, { compact: true })}
          </div>
          <span className="text-xs text-[#4A4553] font-medium">Across {policies.length} verified policies</span>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
          <span className="text-xs font-bold text-[#6F6A7C] uppercase">Total Annual Premium Outflow</span>
          <div className="text-3xl font-extrabold text-[#24212B]">
            {formatINR(totalAnnualPremium)}/yr
          </div>
          <span className="text-xs text-[#4A4553] font-medium">~{formatINR(totalAnnualPremium / 12)}/month</span>
        </div>
      </div>

      {/* Add Policy Modal / Drawer */}
      {showAdd && (
        <form onSubmit={handleAddPolicy} className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#7957FF] space-y-4 text-xs text-[#24212B]">
          <h2 className="text-sm font-extrabold text-[#24212B] uppercase tracking-wider">Declare Policy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold block mb-1 text-[#24212B]">Insurer Name</label>
              <input
                type="text"
                placeholder="e.g. Tata AIA / ICICI"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-[#24212B] font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-[#24212B]">Sum Assured (₹)</label>
              <input
                type="number"
                value={sumAssured}
                onChange={(e) => setSumAssured(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-[#24212B] font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-[#24212B]">Annual Premium (₹)</label>
              <input
                type="number"
                value={premium}
                onChange={(e) => setPremium(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] text-[#24212B] font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-[#D9D3E8] bg-[#FFFFFF] rounded-lg text-[#24212B] font-bold hover:border-[#7957FF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] font-extrabold border border-[#7957FF] rounded-lg"
            >
              Save Policy
            </button>
          </div>
        </form>
      )}

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D9D3E8] hover:border-[#7957FF]/40 transition-all flex flex-wrap items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#24212B] border border-[#7957FF]/40">
                {p.status}
              </span>
              <h3 className="text-base font-extrabold text-[#24212B]">
                {p.planName}
              </h3>
              <div className="text-[#4A4553] font-medium">
                {p.insurer} | {p.policyNumber}
              </div>
              <div className="text-[11px] text-[#6F6A7C] font-medium">
                Nominee: {p.nominee}
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-[#6F6A7C] uppercase">Sum Assured</span>
              <div className="text-xl font-extrabold text-[#24212B]">
                {formatINR(p.sumAssured, { compact: true })}
              </div>
              <div className="text-[#24212B] font-bold">
                {formatINR(p.annualPremium)}/yr
              </div>
              <div className="text-[10px] text-[#7957FF] font-bold flex items-center gap-1 justify-end">
                <Bell className="w-3 h-3 text-[#7957FF]" />
                <span>Next Renewal: {p.renewalDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
