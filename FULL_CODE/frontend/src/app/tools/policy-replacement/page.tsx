"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { annuityDueFutureValue, futureValueOfGoal } from "@/lib/finance-math";
import { useIndicativePremium } from "@/hooks/useIndicativePremium";
import { PREMIUM_ASSUMPTION, PremiumNotice } from "@/components/tools/PremiumNotice";
import type { Gender } from "@/types/api";
import { Assumption, Count, Figure, NumberField, Panel, Segmented, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function PolicyReplacementPage() {
  const [premium, setPremium] = useState(50000);
  const [sumAssured, setSumAssured] = useState(1000000);
  const [remaining, setRemaining] = useState(16);
  const [surrender, setSurrender] = useState(0);
  const [maturity, setMaturity] = useState(0);
  const [age, setAge] = useState(34);
  const [wantCover, setWantCover] = useState(10000000);
  const [ret, setRet] = useState(8);

  const [gender, setGender] = useState<Gender>("male");

  const premiumLookup = useIndicativePremium({ age, gender, sumAssured: wantCover, smoker: false });
  const termPremium = premiumLookup.annualPremium;
  const surplus = Math.max(0, premium - (termPremium ?? 0));
  const switched = annuityDueFutureValue(surplus, ret, remaining) + futureValueOfGoal(surrender, ret, remaining);
  const keepPayout = maturity;
  const diff = switched - keepPayout;

  return (
    <ToolShell slug="policy-replacement">
      <Verdict tone="warn">
        <span className="flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            Do not surrender or stop paying until your new term policy is issued and in force. Ask your insurer for the surrender value and
            the maturity benefit in writing. Enter them below.
          </span>
        </span>
      </Verdict>
      <div className="mt-6 grid gap-6 md:grid-cols-2 items-start">
        <Panel title="Your current policy">
          <div className="space-y-6">
            <NumberField label="Yearly premium you pay" value={premium} onChange={setPremium} />
            <NumberField label="Life cover it gives" value={sumAssured} onChange={setSumAssured} />
            <Slider
              label="Years of premiums left"
              value={remaining}
              onChange={setRemaining}
              min={1}
              max={30}
              format={(v) => `${v} years`}
            />
            <NumberField
              label="Surrender value today"
              value={surrender}
              onChange={setSurrender}
              hint="From your insurer. Leave 0 if unknown."
            />
            <NumberField
              label="Total you would get at maturity"
              value={maturity}
              onChange={setMaturity}
              hint="From your insurer's benefit illustration."
            />
          </div>
        </Panel>
        <Panel title="The alternative">
          <div className="space-y-6">
            <Slider label="Your age" value={age} onChange={setAge} min={21} max={60} format={(v) => `${v} years`} />
            <Segmented
              label="Gender (rates differ by gender)"
              value={gender}
              onChange={setGender}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
            <Slider
              label="Term cover you want"
              value={wantCover}
              onChange={setWantCover}
              min={2500000}
              max={50000000}
              step={2500000}
              format={(v) => formatINR(v, { compact: true })}
            />
            <Slider
              label="Return on invested money"
              value={ret}
              onChange={setRet}
              min={0}
              max={14}
              step={0.5}
              format={(v) => `${v}% a year`}
              hint="Your assumption. Returns are not guaranteed."
            />
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel>
          <Figure label="Cover now" sub="Your current policy">
            {formatINR(sumAssured, { compact: true })}
          </Figure>
        </Panel>
        <Panel>
          <Figure
            label="Cover if you switch"
            sub={termPremium === null ? "Term premium not available" : `Term premium about ${formatINR(termPremium)} a year`}
            tone="good"
          >
            {formatINR(wantCover, { compact: true })}
          </Figure>
        </Panel>
        <Panel>
          <Figure label="Cover multiple" sub="Switching vs now" tone="good">
            {sumAssured > 0 ? `${(wantCover / sumAssured).toFixed(1)}x` : "-"}
          </Figure>
        </Panel>
      </div>
      <div className="mt-4">
        <PremiumNotice premium={premiumLookup} />
      </div>
      <Panel className="mt-4">
        <div className="grid gap-5 sm:grid-cols-3">
          <Figure label="Keep: money at maturity">
            {maturity > 0 ? <Count value={keepPayout} format={(v) => formatINR(v, { compact: true })} /> : "Enter it"}
          </Figure>
          <Figure label="Switch: invested money, projected">
            <Count value={switched} format={(v) => formatINR(v, { compact: true })} />
          </Figure>
          <Figure label="Difference" tone={maturity > 0 ? (diff >= 0 ? "good" : "bad") : "default"}>
            {maturity > 0 ? (
              <Count value={diff} format={(v) => `${v >= 0 ? "+" : "-"}${formatINR(Math.abs(v), { compact: true })}`} />
            ) : (
              "-"
            )}
          </Figure>
        </div>
        {maturity === 0 && (
          <p className="mt-3 text-sm text-[#6F6A7C]">
            Enter the maturity amount to compare the two money outcomes. The cover difference above is shown either way.
          </p>
        )}
      </Panel>
      <div className="mt-4">
        <Assumption>
          {PREMIUM_ASSUMPTION} Premiums are paid at the start of each year. The switch figure assumes you invest the premium saved plus the
          surrender value. It ignores tax, charges and any bonus the old policy would add. Past surrender charges are already in the
          surrender value your insurer quotes.
        </Assumption>
      </div>
    </ToolShell>
  );
}
