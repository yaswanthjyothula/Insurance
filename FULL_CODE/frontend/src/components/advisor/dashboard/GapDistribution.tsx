"use client";

import { Users } from "lucide-react";
import { m } from "motion/react";
import { formatInrCompact } from "@/components/advisor/format";
import { EASE } from "@/components/advisor/motion";
import { EmptyState, Panel } from "@/components/advisor/dashboard/parts";
import type { GapBand, GapBandKey } from "@/types/advisor";

const TONE: Record<GapBandKey, string> = {
  covered: "bg-emerald-500",
  small: "bg-sky-500",
  moderate: "bg-amber-500",
  large: "bg-rose-500",
};

export function GapDistribution({ bands, totalGap }: { bands: GapBand[]; totalGap: number }) {
  const customers = bands.reduce((sum, b) => sum + b.count, 0);
  return (
    <Panel title="Protection gaps" className="h-full">
      {customers === 0 ? (
        <EmptyState icon={Users} title="No customers assigned yet" hint="Protection gaps appear once customers are assigned to you." />
      ) : (
        <>
          <ul className="m-0 list-none space-y-3.5 p-0">
            {bands.map((band, index) => (
              <li key={band.key}>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-[#24212B]">{band.label}</span>
                  <span className="tabular-nums text-[#6F6A7C]">
                    {band.count} <span className="text-[#A59FB5]">· {Math.round((band.count / customers) * 100)}%</span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-[#F1EDFC]"
                  role="progressbar"
                  aria-label={band.label}
                  aria-valuemin={0}
                  aria-valuemax={customers}
                  aria-valuenow={band.count}
                >
                  <m.div
                    className={`h-full origin-left rounded-full ${TONE[band.key]}`}
                    style={{ width: `${(band.count / customers) * 100}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.08 * index }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-5 rounded-xl bg-[#F8F7FC] px-3 py-2.5 text-xs leading-relaxed text-[#6F6A7C]">
            <strong className="text-sm font-extrabold text-[#171B3D]">{formatInrCompact(totalGap)}</strong> of cover still needed across
            your {customers} customers. An estimate from the Net Needs method, after assets and existing cover.
          </p>
        </>
      )}
    </Panel>
  );
}
