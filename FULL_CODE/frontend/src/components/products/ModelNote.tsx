"use client";

import { ChevronDown, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchFromAPI } from "@/lib/api";
import { bold, mark } from "./rich";

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
  const { t, tx } = useI18n();
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
        {t("products.model.summary")}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex max-w-[860px] flex-col gap-2.5 leading-normal">
        <p className="m-0">{tx(note)}</p>
        {method === "rules+trained-model" && info?.available && ev && (
          <p className="m-0">
            {bold(
              t("products.model.detail", {
                model: info.model ?? "",
                rows: info.training_rows?.toLocaleString("en-IN") ?? "",
                synthetic: mark(t("products.model.synthetic")),
                customers: info.training_customers ?? "",
                modelPct: pct(ev.model.top1),
                rulePct: pct(ev.fixed_rule_baseline.top1),
                randomPct: pct(ev.random.top1),
                ceilingPct: pct(ev.ceiling_known_preferences.top1),
              }),
            )}
          </p>
        )}
        <ul className="m-0 list-disc ps-5">
          {info?.disclosure?.map((d) => (
            <li key={d}>{tx(d)}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
