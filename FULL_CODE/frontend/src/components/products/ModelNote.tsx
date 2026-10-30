"use client";

import { ChevronDown, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";

interface Block {
  model: { top1: number };
  fixed_rule_baseline: { top1: number };
  ceiling_known_preferences: { top1: number };
  random: { top1: number };
}
interface ModelInfo {
  available: boolean;
  model?: string;
  training_customers?: number;
  training_rows?: number;
  evaluation?: { overall: Block };
  disclosure?: string[];
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Tells the customer, in plain words, how the ranking is made and how far to trust the trained model. */
export function ModelNote({ method, note }: { method: string; note: string }) {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  useEffect(() => {
    fetchFromAPI<ModelInfo>("/recommendations/model-info")
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);
  const ev = info?.evaluation?.overall;
  return (
    <details className="group rounded-2xl border border-[#D9D3E8] bg-white p-5 text-[14px] text-[#5A5566]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-[#7957FF]">
        <Info className="h-4 w-4" />
        How these products are ranked
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex max-w-[860px] flex-col gap-2.5 leading-normal">
        <p className="m-0">{note}</p>
        {method === "rules+trained-model" && info?.available && ev && (
          <p className="m-0">
            The model ({info.model}) was trained on {info.training_rows?.toLocaleString("en-IN")} <strong>synthetic</strong> choices by the
            pack&apos;s {info.training_customers} synthetic customers. On customers it had not seen, it picks the simulated buyer&apos;s
            product first {pct(ev.model.top1)} of the time, against {pct(ev.fixed_rule_baseline.top1)} for a fixed rule and{" "}
            {pct(ev.random.top1)} for random guessing. The most any model could reach with the simulation&apos;s random choice noise is{" "}
            {pct(ev.ceiling_known_preferences.top1)}.
          </p>
        )}
        <ul className="m-0 list-disc pl-5">
          {info?.disclosure?.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
