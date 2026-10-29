"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Assumption, Count, Figure, NumberField, Panel, Slider, ToolShell, Verdict } from "@/components/tools/kit";

export default function CostInflationPage() {
  const [living, setLiving] = useState(60000);
  const [healthPremium, setHealthPremium] = useState(25000);
  const [livingRise, setLivingRise] = useState(6);
  const [premRise, setPremRise] = useState(10);
  const [years, setYears] = useState(10);

  const rows = Array.from({ length: years + 1 }, (_, y) => ({ y, living: living * Math.pow(1 + livingRise / 100, y), health: healthPremium * Math.pow(1 + premRise / 100, y) }));
  const last = rows[rows.length - 1];
  const max = Math.max(last.living * 12, last.health);
  const extraLiving = rows.reduce((s, r) => s + r.living * 12, 0) - living * 12 * rows.length;

  return (
    <ToolShell slug="premium-shock">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <Panel title="What you pay now">
          <div className="space-y-6">
            <NumberField label="Monthly living costs" value={living} onChange={setLiving} />
            <NumberField label="Yearly health insurance premium" value={healthPremium} onChange={setHealthPremium} />
            <Slider label="Living costs rise by" value={livingRise} onChange={setLivingRise} min={2} max={12} step={0.5} format={(v) => `${v}% a year`} />
            <Slider label="Health premium rises by" value={premRise} onChange={setPremRise} min={0} max={20} step={0.5} format={(v) => `${v}% a year`} hint="Check your own past renewal notices for a real figure." />
            <Slider label="Years to look ahead" value={years} onChange={setYears} min={3} max={25} format={(v) => `${v} years`} />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <div className="grid grid-cols-2 gap-5">
              <Figure label={`Monthly costs in ${years} yrs`} sub={`Now ${formatINR(living)}`}><Count value={last.living} format={(v) => formatINR(Math.round(v), { compact: true })} /></Figure>
              <Figure label={`Health premium in ${years} yrs`} sub={`Now ${formatINR(healthPremium)}`} tone="warn"><Count value={last.health} format={(v) => formatINR(Math.round(v), { compact: true })} /></Figure>
            </div>
            <div className="mt-5 space-y-3">
              <Bar label="Yearly living costs" a={living * 12} b={last.living * 12} max={max} />
              <Bar label="Yearly health premium" a={healthPremium} b={last.health} max={max} />
            </div>
          </Panel>
          <Verdict tone="info">Over {years} years you would spend about {formatINR(extraLiving, { compact: true })} more on living costs than if prices stayed flat. Your family's cover and income plans should allow for this.</Verdict>
          <Assumption>Both rates are your inputs. They are illustrations to help planning, not forecasts.</Assumption>
        </div>
      </div>
    </ToolShell>
  );
}

function Bar({ label, a, b, max }: { label: string; a: number; b: number; max: number }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#24212B]">{label}</p>
      <div className="mt-1 space-y-1">
        <div className="h-2.5 rounded-full bg-[#E9E4FF]"><div className="h-full rounded-full bg-[#D9D3E8] transition-all duration-500" style={{ width: `${(a / max) * 100}%` }} /></div>
        <div className="h-2.5 rounded-full bg-[#E9E4FF]"><div className="h-full rounded-full bg-[#7957FF] transition-all duration-500" style={{ width: `${(b / max) * 100}%` }} /></div>
      </div>
      <p className="mt-1 text-xs text-[#6F6A7C]">{formatINR(a, { compact: true })} now → {formatINR(b, { compact: true })} later</p>
    </div>
  );
}
