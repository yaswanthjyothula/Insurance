"use client";

import { useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { SliderField } from "@/components/admin/AdminUi";
import { useAdminConfig } from "@/components/admin/AdminConfigProvider";
import { Panel } from "@/components/advisor/dashboard/parts";
import { NEEDS_LIMITS, changedNeeds, validateNeeds } from "@/lib/admin-form";
import { errorMessage } from "@/lib/error-message";
import type { NeedsConfig } from "@/types/admin";

const FIELDS: { key: keyof NeedsConfig; label: string; help: string; suffix: string }[] = [
  {
    key: "inflation_rate",
    label: "Inflation",
    help: "How fast household costs rise each year. A higher rate means the family needs more cover to keep the same lifestyle.",
    suffix: "%",
  },
  {
    key: "discount_rate",
    label: "Post-tax return on the payout",
    help: "What the family earns each year by investing the payout. A higher return means a smaller lump sum is enough.",
    suffix: "%",
  },
  {
    key: "deceased_expense_reduction_factor",
    label: "Expenses that stop",
    help: "The share of household spending that ends when the earner is gone, so it does not need to be replaced.",
    suffix: "%",
  },
  {
    key: "emergency_fund_months",
    label: "Emergency fund",
    help: "Months of expenses kept as a cushion in the first period after a death. Added to the cover needed.",
    suffix: " mo",
  },
  {
    key: "income_replacement_multiple_min",
    label: "Income multiple, lowest",
    help: "The low end of the rule-of-thumb cover band, as a multiple of yearly income. Shown beside the Net Needs result, never added to it.",
    suffix: "×",
  },
  {
    key: "income_replacement_multiple_max",
    label: "Income multiple, highest",
    help: "The high end of the rule-of-thumb cover band, as a multiple of yearly income.",
    suffix: "×",
  },
];

export function NeedsTab() {
  const { config, busy, updateConfig } = useAdminConfig();
  const [draft, setDraft] = useState<NeedsConfig | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  if (!config) return null;

  const saved = config.needs;
  const current = draft ?? saved;
  const errors = validateNeeds(current);
  const changes = changedNeeds(current, saved);
  const dirty = Object.keys(changes).length > 0;
  const set = (key: keyof NeedsConfig, value: number) => {
    setStatus(null);
    setDraft({ ...current, [key]: value });
  };

  const save = async () => {
    setStatus(null);
    try {
      const result = await updateConfig({ needs: changes }, "Needs analysis parameters");
      setDraft(null);
      setStatus({ ok: true, text: `Saved as version ${result.version}. The next assessment uses it.` });
    } catch (failure) {
      setStatus({ ok: false, text: errorMessage(failure, "We couldn't save the changes.") });
    }
  };

  return (
    <Panel
      title="Needs analysis logic"
      aside={<span className="rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-bold text-[#3D55E0]">Version {config.version}</span>}
    >
      <p className="m-0 mb-5 max-w-2xl text-sm text-[#6F6A7C]">
        These assumptions drive the cover amount every customer is shown. Changes take effect for the very next assessment, with no restart.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {FIELDS.map((f) => (
          <SliderField
            key={f.key}
            id={`needs-${f.key}`}
            label={f.label}
            help={f.help}
            suffix={f.suffix}
            value={current[f.key]}
            saved={saved[f.key]}
            error={errors[f.key]}
            onChange={(v) => set(f.key, v)}
            {...NEEDS_LIMITS[f.key]}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#F1EDFC] pt-5">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || Object.keys(errors).length > 0 || busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D55E0] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2F44C4] disabled:opacity-40"
        >
          <Save className="h-4 w-4" aria-hidden="true" /> {busy ? "Saving…" : "Save changes"}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6F6A7C] hover:text-[#0E1330]"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" /> Discard
          </button>
        )}
        {dirty && (
          <span className="text-xs font-semibold text-[#3D55E0]">
            {Object.keys(changes).length} unsaved change{Object.keys(changes).length === 1 ? "" : "s"}
          </span>
        )}
        {status && (
          <span
            role={status.ok ? "status" : "alert"}
            className={`text-sm font-semibold ${status.ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {status.text}
          </span>
        )}
      </div>
    </Panel>
  );
}
