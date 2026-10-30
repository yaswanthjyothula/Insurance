"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";
import { amortisationBalances, monthlyEmi } from "@/lib/finance-math";
import { useIndicativePremium } from "@/hooks/useIndicativePremium";
import { PREMIUM_ASSUMPTION, PremiumNotice } from "@/components/tools/PremiumNotice";
import type { Gender } from "@/types/api";
import { Assumption, Count, Figure, NumberField, Panel, Segmented, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function EmiPage() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [age, setAge] = useState(32);

  const [gender, setGender] = useState<Gender>("male");

  const calc = useMemo(() => {
    const emi = monthlyEmi(principal, rate, years);
    const total = emi * years * 12;
    return { emi, total, interest: total - principal, yearly: amortisationBalances(principal, rate, years) };
  }, [principal, rate, years]);

  const premium = useIndicativePremium({ age, gender, sumAssured: principal, smoker: false });
  const annualPremium = premium.annualPremium;
  const max = principal;

  return (
    <ToolShell slug="emi-calculator">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <Panel title="Loan details">
          <div className="space-y-6">
            <NumberField label="Loan amount" value={principal} onChange={setPrincipal} />
            <Slider
              label="Interest rate"
              value={rate}
              onChange={setRate}
              min={5}
              max={16}
              step={0.1}
              format={(v) => `${v.toFixed(1)}% a year`}
            />
            <Slider label="Loan tenure" value={years} onChange={setYears} min={1} max={30} format={(v) => `${v} years`} />
            <Slider
              label="Your age"
              value={age}
              onChange={setAge}
              min={21}
              max={60}
              format={(v) => `${v} years`}
              hint="Used to estimate the cover cost"
            />
            <Segmented
              label="Gender (rates differ by gender)"
              value={gender}
              onChange={setGender}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <div className="grid grid-cols-2 gap-5">
              <Figure label="Monthly EMI">
                <Count value={calc.emi} format={(v) => formatINR(Math.round(v))} />
              </Figure>
              <Figure label="Total interest" tone="warn">
                <Count value={calc.interest} format={(v) => formatINR(v, { compact: true })} />
              </Figure>
            </div>
            <p className="mt-3 text-sm text-[#4A4658]">
              You repay {formatINR(calc.total, { compact: true })} in all, which is {(calc.total / principal).toFixed(2)}x the amount
              borrowed.
            </p>
          </Panel>
          <Verdict tone="info">
            To clear this loan from a life cover payout, you need cover of at least {formatINR(principal, { compact: true })} today.{" "}
            {annualPremium !== null && (
              <>
                Indicative cost for a non-smoker: about {formatINR(annualPremium)} a year ({formatINR(annualPremium / 12)} a month).{" "}
              </>
            )}
            Add your family&apos;s living costs on top.
          </Verdict>
          <PremiumNotice premium={premium} />
        </div>
      </div>
      <Panel title="What you still owe, year by year" className="mt-6">
        <div className="flex items-end gap-1 h-40" role="img" aria-label="Outstanding loan balance by year">
          {calc.yearly.map((y) => (
            <div
              key={y.year}
              className="group relative flex-1 min-w-0 rounded-t bg-[#D9D3E8] hover:bg-[#7957FF] transition-colors"
              style={{ height: `${Math.max(2, (y.balance / max) * 100)}%` }}
            >
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#24212B] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                Yr {y.year}: {formatINR(y.balance, { compact: true })}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-[#6F6A7C]">
          Early on, most of the EMI is interest, so the balance falls slowly. Hover a bar to read it.
        </p>
      </Panel>
      <div className="mt-4">
        <Assumption>Fixed rate for the full tenure, standard EMI formula. {PREMIUM_ASSUMPTION}</Assumption>
      </div>
    </ToolShell>
  );
}
