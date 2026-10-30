"use client";

import { useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { SliderField, Toggle } from "@/components/admin/AdminUi";
import { useAdminConfig } from "@/components/admin/AdminConfigProvider";
import { MoneyField } from "@/components/admin/MoneyField";
import { TestCalculator } from "@/components/admin/TestCalculator";
import { Panel } from "@/components/advisor/dashboard/parts";
import { changedUnderwriting, validateUnderwriting } from "@/lib/admin-form";
import { errorMessage } from "@/lib/error-message";
import type { UnderwritingConfig } from "@/types/admin";

export function UnderwritingTab() {
  const { config, busy, updateConfig } = useAdminConfig();
  const [draft, setDraft] = useState<UnderwritingConfig | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  if (!config) return null;

  const saved = config.underwriting;
  const current = draft ?? saved;
  const errors = validateUnderwriting(current);
  const changes = changedUnderwriting(current, saved);
  const dirty = Object.keys(changes).length > 0;
  const set = <K extends keyof UnderwritingConfig>(key: K, value: UnderwritingConfig[K]) => {
    setStatus(null);
    setDraft({ ...current, [key]: value });
  };

  const save = async () => {
    setStatus(null);
    try {
      const result = await updateConfig({ underwriting: changes }, "Underwriting thresholds");
      setDraft(null);
      setStatus({ ok: true, text: `Saved as version ${result.version}. The next quote is underwritten with it.` });
    } catch (failure) {
      setStatus({ ok: false, text: errorMessage(failure, "We couldn't save the thresholds.") });
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Underwriting and thresholds"
        aside={<span className="rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-bold text-[#3D55E0]">Version {config.version}</span>}
      >
        <p className="m-0 mb-5 max-w-2xl text-sm text-[#6F6A7C]">
          These limits decide what a customer must do before a policy is issued: nothing, a phone interview, or a medical examination. They
          apply to the next quote.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MoneyField
            id="uw-nm"
            label="Non-medical sum assured limit"
            help="Cover up to this amount needs no medical tests, for customers within the age limit."
            value={current.non_medical_sum_assured_limit}
            saved={saved.non_medical_sum_assured_limit}
            error={errors.non_medical_sum_assured_limit}
            onChange={(v) => set("non_medical_sum_assured_limit", v)}
          />
          <SliderField
            id="uw-nmage"
            label="Maximum non-medical age"
            help="Customers older than this always need at least a tele-medical interview."
            value={current.non_medical_maximum_age}
            saved={saved.non_medical_maximum_age}
            min={18}
            max={80}
            step={1}
            suffix=" yr"
            error={errors.non_medical_maximum_age}
            onChange={(v) => set("non_medical_maximum_age", v)}
          />
          <MoneyField
            id="uw-tele"
            label="Tele-medical threshold"
            help="Cover above the non-medical limit and up to this amount needs a short medical interview by phone."
            value={current.tele_medical_threshold}
            saved={saved.tele_medical_threshold}
            error={errors.tele_medical_threshold}
            onChange={(v) => set("tele_medical_threshold", v)}
          />
          <MoneyField
            id="uw-phys"
            label="Physical medical threshold"
            help="Cover above the tele-medical threshold needs a medical examination. Above this amount a financial review is added."
            value={current.physical_medical_threshold}
            saved={saved.physical_medical_threshold}
            error={errors.physical_medical_threshold}
            onChange={(v) => set("physical_medical_threshold", v)}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-[#E8E5F0] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="m-0 text-sm font-bold text-[#0E1330]">Straight-through processing (STP)</p>
              <p className="m-0 mt-0.5 text-xs text-[#6F6A7C]">
                Non-medical cases inside these limits can be issued without a person reviewing them.
              </p>
            </div>
            <Toggle checked={current.stp_enabled} onChange={(v) => set("stp_enabled", v)} label="Straight-through processing" />
          </div>
          <div
            className={`mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 ${current.stp_enabled ? "" : "pointer-events-none opacity-45"}`}
            aria-disabled={!current.stp_enabled}
          >
            <MoneyField
              id="uw-stpsa"
              label="STP maximum sum assured"
              help="Above this, a person reviews the case even if it is non-medical."
              value={current.stp_maximum_sum_assured}
              saved={saved.stp_maximum_sum_assured}
              error={errors.stp_maximum_sum_assured}
              onChange={(v) => set("stp_maximum_sum_assured", v)}
            />
            <SliderField
              id="uw-stpage"
              label="STP maximum age"
              help="Older customers are reviewed by a person."
              value={current.stp_maximum_age}
              saved={saved.stp_maximum_age}
              min={18}
              max={80}
              step={1}
              suffix=" yr"
              error={errors.stp_maximum_age}
              onChange={(v) => set("stp_maximum_age", v)}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-[#E8E5F0] p-4 text-sm font-semibold text-[#0E1330] lg:col-span-2">
              <input
                type="checkbox"
                checked={current.stp_allow_smokers}
                onChange={(e) => set("stp_allow_smokers", e.target.checked)}
                className="h-4 w-4 accent-[#3D55E0]"
              />
              Let smokers go straight through
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#F1EDFC] pt-5">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || Object.keys(errors).length > 0 || busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3D55E0] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F44C4] disabled:opacity-40"
          >
            <Save className="h-4 w-4" aria-hidden="true" /> {busy ? "Saving…" : "Save thresholds"}
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
          {dirty && <span className="text-xs font-semibold text-[#3D55E0]">Unsaved changes</span>}
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
      <TestCalculator />
    </div>
  );
}
