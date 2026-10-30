"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Assumption, Count, NumberField, Panel, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function ProtectionGapPage() {
  const [expenses, setExpenses] = useState(600000);
  const [horizon, setHorizon] = useState(15);
  const [debt, setDebt] = useState(0);
  const [goals, setGoals] = useState(0);
  const [emergMonths, setEmergMonths] = useState(6);
  const [cover, setCover] = useState(0);
  const [savings, setSavings] = useState(0);
  const [emergency, setEmergency] = useState(0);

  const needs = [
    { key: "Family income", need: expenses * horizon },
    { key: "Debts", need: debt },
    { key: "Future goals", need: goals },
    { key: "Emergency fund", need: (expenses / 12) * emergMonths },
  ];
  // life cover goes to debts first (they are due immediately), then income, then goals; savings fill whatever is left; emergency money is separate
  let pool = cover + savings;
  const order = [1, 0, 2];
  const funded: number[] = [0, 0, 0, 0];
  order.forEach((i) => {
    const take = Math.min(pool, needs[i].need);
    funded[i] = take;
    pool -= take;
  });
  funded[3] = Math.min(emergency, needs[3].need);
  const rows = needs.map((n, i) => ({ ...n, funded: funded[i], pct: n.need > 0 ? Math.round((funded[i] / n.need) * 100) : 100 }));
  const totalNeed = needs.reduce((s, n) => s + n.need, 0);
  const totalFunded = funded.reduce((s, v) => s + v, 0);
  const overall = totalNeed > 0 ? Math.round((totalFunded / totalNeed) * 100) : 0;
  const worst = [...rows].filter((r) => r.need > 0).sort((a, b) => a.pct - b.pct)[0];

  // radar
  const size = 260,
    c = size / 2,
    R = 100;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 4;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v];
  };
  const poly = rows.map((r, i) => pt(i, r.pct / 100).join(",")).join(" ");

  return (
    <ToolShell slug="protection-gap">
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        <div className="lg:col-span-3 space-y-6">
          <Panel title="What your family would need">
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Yearly household expenses" value={expenses} onChange={setExpenses} />
              <Slider label="Years to support" value={horizon} onChange={setHorizon} min={1} max={40} format={(v) => `${v} years`} />
              <NumberField label="Debts outstanding" value={debt} onChange={setDebt} hint="Home, car, personal loans" />
              <NumberField label="Future goals (today's cost)" value={goals} onChange={setGoals} hint="Education, marriage" />
              <Slider
                label="Emergency fund target"
                value={emergMonths}
                onChange={setEmergMonths}
                min={0}
                max={12}
                format={(v) => `${v} months`}
              />
            </div>
          </Panel>
          <Panel title="What you already have">
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Life cover (all policies)" value={cover} onChange={setCover} />
              <NumberField label="Savings and investments for the family" value={savings} onChange={setSavings} />
              <NumberField label="Emergency money set aside" value={emergency} onChange={setEmergency} />
            </div>
          </Panel>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[260px]" role="img" aria-label="Coverage radar">
              {[0.25, 0.5, 0.75, 1].map((k) => (
                <polygon key={k} points={[0, 1, 2, 3].map((i) => pt(i, k).join(",")).join(" ")} fill="none" stroke="#D9D3E8" />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="#D9D3E8" />
              ))}
              <polygon points={poly} fill="rgba(121,87,255,.25)" stroke="#7957FF" strokeWidth="2" style={{ transition: "all .4s" }} />
              {rows.map((r, i) => {
                const [x, y] = pt(i, 1.2);
                return (
                  <text key={r.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#24212B" fontWeight="600">
                    {r.key}
                  </text>
                );
              })}
            </svg>
            <p className="mt-2 text-center text-sm text-[#6F6A7C]">Outer edge is fully covered</p>
          </Panel>
          <Panel>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6F6A7C]">Overall covered</p>
            <p className="mt-1 text-4xl font-extrabold text-[#24212B]">
              <Count value={overall} format={(v) => `${Math.round(v)}%`} />
            </p>
            <ul className="mt-4 space-y-3">
              {rows.map((r) => (
                <li key={r.key}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-[#24212B]">{r.key}</span>
                    <span className="text-[#4A4658]">
                      {r.pct}% · gap {formatINR(Math.max(0, r.need - r.funded), { compact: true })}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#E9E4FF]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${r.pct >= 100 ? "bg-[#0E7A5F]" : r.pct >= 50 ? "bg-[#7957FF]" : "bg-[#C0364B]"}`}
                      style={{ width: `${Math.min(100, r.pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          {worst && worst.pct < 100 && (
            <Verdict tone={worst.pct < 50 ? "bad" : "warn"}>
              Biggest gap: {worst.key.toLowerCase()}, with {formatINR(worst.need - worst.funded, { compact: true })} not covered.
            </Verdict>
          )}
          <Assumption>
            Life cover and savings are applied to debts first, then family income, then goals. Emergency money counts only toward the
            emergency fund. Figures are in today&apos;s rupees, with no inflation.
          </Assumption>
        </div>
      </div>
    </ToolShell>
  );
}
