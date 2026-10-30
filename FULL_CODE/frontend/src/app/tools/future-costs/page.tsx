"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { futureValueOfGoal, monthlySavingNeeded } from "@/lib/finance-math";
import { Assumption, Count, Figure, NumberField, Panel, Segmented, Slider, ToolShell, Verdict } from "@/components/tools/kit";

const PRESETS = {
  education: { cost: 2500000, years: 14, infl: 8 },
  medical: { cost: 1000000, years: 10, infl: 10 },
  wedding: { cost: 2000000, years: 8, infl: 7 },
  custom: { cost: 1000000, years: 10, infl: 6 },
} as const;

export default function FutureCostsPage() {
  const [goal, setGoal] = useState<keyof typeof PRESETS>("education");
  const [cost, setCost] = useState<number>(PRESETS.education.cost);
  const [years, setYears] = useState<number>(PRESETS.education.years);
  const [infl, setInfl] = useState<number>(PRESETS.education.infl);
  const [ret, setRet] = useState(8);
  const [thisYear, setThisYear] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage or fetched after mount
  useEffect(() => setThisYear(new Date().getFullYear()), []);

  const pick = (g: keyof typeof PRESETS) => {
    setGoal(g);
    setCost(PRESETS[g].cost);
    setYears(PRESETS[g].years);
    setInfl(PRESETS[g].infl);
  };
  const future = futureValueOfGoal(cost, infl, years);
  const monthly = monthlySavingNeeded(future, ret, years);
  const costLabel = thisYear ? `Cost in ${thisYear + years}` : `Cost in ${years} years`;

  return (
    <ToolShell slug="future-costs">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <Panel title="Your goal">
          <div className="space-y-6">
            <Segmented
              label="Goal type"
              value={goal}
              onChange={pick}
              options={[
                { value: "education", label: "Education" },
                { value: "medical", label: "Medical" },
                { value: "wedding", label: "Wedding" },
                { value: "custom", label: "Other" },
              ]}
            />
            <NumberField label="Cost in today's rupees" value={cost} onChange={setCost} />
            <Slider label="Years until you pay" value={years} onChange={setYears} min={1} max={30} format={(v) => `${v} years`} />
            <Slider
              label="Yearly cost increase"
              value={infl}
              onChange={setInfl}
              min={3}
              max={14}
              step={0.5}
              format={(v) => `${v}%`}
              hint="Presets are illustrative. Use a rate you believe for this cost."
            />
            <Slider
              label="Return on your savings"
              value={ret}
              onChange={setRet}
              min={0}
              max={14}
              step={0.5}
              format={(v) => `${v}% a year`}
            />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <Figure label={costLabel} sub={`${(future / cost).toFixed(2)}x today's cost`}>
              <Count value={future} format={(v) => formatINR(v, { compact: true })} />
            </Figure>
            <div className="mt-5 border-t border-[#D9D3E8] pt-4">
              <Figure label="Save each month to reach it" tone="good">
                <Count value={monthly} format={(v) => formatINR(Math.round(v))} />
              </Figure>
            </div>
          </Panel>
          <Verdict tone="info">
            If the person paying for this goal is also your family&apos;s earner, add {formatINR(future, { compact: true })} to the cover
            you need so the goal survives you.
          </Verdict>
          <Assumption>
            Cost rises at a steady rate and savings earn a steady return, with the first deposit at the start of month 1. Real costs and
            returns vary year to year.
          </Assumption>
        </div>
      </div>
    </ToolShell>
  );
}
