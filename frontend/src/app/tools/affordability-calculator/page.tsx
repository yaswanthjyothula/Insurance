"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { indicativeAnnualPremium } from "@/lib/premium";
import { Assumption, Count, Figure, NumberField, Panel, Segmented, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function AffordabilityPage() {
  const [income, setIncome] = useState(100000);
  const [cover, setCover] = useState(10000000);
  const [age, setAge] = useState(30);
  const [smoker, setSmoker] = useState<"no" | "yes">("no");

  const annual = indicativeAnnualPremium(cover, age, smoker === "yes");
  const monthly = annual / 12;
  const share = income > 0 ? (monthly / income) * 100 : 0;
  const tone = share <= 3 ? "good" : share <= 6 ? "warn" : "bad";

  return (
    <ToolShell slug="affordability-calculator">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <Panel title="Your numbers">
          <div className="space-y-6">
            <NumberField label="Monthly take-home income" value={income} onChange={setIncome} />
            <Slider label="Cover you want" value={cover} onChange={setCover} min={2500000} max={50000000} step={2500000} format={(v) => formatINR(v, { compact: true })} />
            <Slider label="Your age" value={age} onChange={setAge} min={18} max={60} format={(v) => `${v} years`} />
            <Segmented label="Do you smoke or chew tobacco?" value={smoker} onChange={setSmoker} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <Figure label="Estimated yearly premium" sub={`About ${formatINR(monthly)} a month`}><Count value={annual} format={(v) => formatINR(v)} /></Figure>
            <div className="mt-5">
              <div className="flex justify-between text-sm font-semibold text-[#24212B]"><span>Share of monthly income</span><span>{share.toFixed(1)}%</span></div>
              <div className="mt-2 h-3 rounded-full bg-[#E9E4FF] overflow-hidden"><div className="h-full rounded-full bg-[#7957FF] transition-all duration-500" style={{ width: `${Math.min(100, share * 8)}%` }} /></div>
            </div>
          </Panel>
          <Verdict tone={tone}>
            {tone === "good" && "Comfortable. This is a small part of your income, so the policy is unlikely to strain your budget."}
            {tone === "warn" && "Noticeable. It is affordable but worth planning for. A longer-pay plan or slightly lower cover would cost less."}
            {tone === "bad" && "A stretch. A lapsed policy pays nothing, so consider lower cover for now and raise it later."}
          </Verdict>
          <Assumption>Estimate for a male, calibrated to ICICI's published premiums at ages 30, 40 and 50. Your real quote depends on health, occupation and insurer. The bands (3% and 6%) are a planning guideline, not a rule.</Assumption>
        </div>
      </div>
    </ToolShell>
  );
}
