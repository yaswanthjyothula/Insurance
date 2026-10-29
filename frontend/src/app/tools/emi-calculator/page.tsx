"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";
import { indicativeAnnualPremium } from "@/lib/premium";
import { Assumption, Count, Figure, NumberField, Panel, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function EmiPage() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [age, setAge] = useState(32);

  const calc = useMemo(() => {
    const n = years * 12, r = rate / 1200;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let bal = principal;
    const yearly: { year: number; balance: number }[] = [{ year: 0, balance: principal }];
    for (let m = 1; m <= n; m++) {
      bal = bal * (1 + r) - emi;
      if (m % 12 === 0) yearly.push({ year: m / 12, balance: Math.max(0, bal) });
    }
    return { emi, total: emi * n, interest: emi * n - principal, yearly };
  }, [principal, rate, years]);

  const premium = indicativeAnnualPremium(principal, age, false);
  const max = principal;

  return (
    <ToolShell slug="emi-calculator">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <Panel title="Loan details">
          <div className="space-y-6">
            <NumberField label="Loan amount" value={principal} onChange={setPrincipal} />
            <Slider label="Interest rate" value={rate} onChange={setRate} min={5} max={16} step={0.1} format={(v) => `${v.toFixed(1)}% a year`} />
            <Slider label="Loan tenure" value={years} onChange={setYears} min={1} max={30} format={(v) => `${v} years`} />
            <Slider label="Your age" value={age} onChange={setAge} min={21} max={60} format={(v) => `${v} years`} hint="Used to estimate the cover cost" />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <div className="grid grid-cols-2 gap-5">
              <Figure label="Monthly EMI"><Count value={calc.emi} format={(v) => formatINR(Math.round(v))} /></Figure>
              <Figure label="Total interest" tone="warn"><Count value={calc.interest} format={(v) => formatINR(v, { compact: true })} /></Figure>
            </div>
            <p className="mt-3 text-sm text-[#4A4658]">You repay {formatINR(calc.total, { compact: true })} in all, which is {(calc.total / principal).toFixed(2)}x the amount borrowed.</p>
          </Panel>
          <Verdict tone="info">
            To clear this loan from a life cover payout, you need cover of at least {formatINR(principal, { compact: true })} today. Indicative cost: about {formatINR(premium)} a year ({formatINR(premium / 12)} a month). Add your family's living costs on top.
          </Verdict>
        </div>
      </div>
      <Panel title="What you still owe, year by year" className="mt-6">
        <div className="flex items-end gap-1 h-40" role="img" aria-label="Outstanding loan balance by year">
          {calc.yearly.map((y) => (
            <div key={y.year} className="group relative flex-1 min-w-0 rounded-t bg-[#D9D3E8] hover:bg-[#7957FF] transition-colors" style={{ height: `${Math.max(2, (y.balance / max) * 100)}%` }}>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#24212B] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">Yr {y.year}: {formatINR(y.balance, { compact: true })}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-[#6F6A7C]">Early on, most of the EMI is interest, so the balance falls slowly. Hover a bar to read it.</p>
      </Panel>
      <div className="mt-4"><Assumption>Fixed rate for the full tenure, standard EMI formula. Cover cost is an indicative estimate for a non-smoker male, not an insurer quote.</Assumption></div>
    </ToolShell>
  );
}
