"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Flag } from "lucide-react";
import { INPUT } from "@/components/admin/AdminUi";
import { useAdminConfig } from "@/components/admin/AdminConfigProvider";
import { Panel, Skeleton } from "@/components/advisor/dashboard/parts";
import { ROUTE_LABEL, inrShort } from "@/lib/admin-form";
import { errorMessage } from "@/lib/error-message";
import { postJSON } from "@/lib/api";
import type { TestCalcInput, TestCalcResult } from "@/types/admin";

const DEFAULTS: TestCalcInput = {
  age: 32,
  annual_income: 1_800_000,
  dependents: 2,
  gender: "male",
  smoker: false,
  outstanding_liabilities: 0,
  existing_cover: 0,
  eligible_assets: 0,
};
const LABEL = "mb-1 block text-xs font-bold text-[#6F6A7C]";

function headlineOf(r: TestCalcResult) {
  return {
    cover: r.needs.recommended_cover,
    premium: r.headline?.monthly_premium ?? null,
    route: r.headline?.underwriting_route ?? null,
    product: r.headline?.product_name ?? "No eligible product",
  };
}

function Delta({ label, before, after }: { label: string; before: string; after: string }) {
  const same = before === after;
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-[#E8E5F0]">
      <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">{label}</p>
      <p className={`m-0 mt-1 flex items-center gap-2 text-sm font-bold tabular-nums ${same ? "text-[#6F6A7C]" : "text-[#0E1330]"}`}>
        {same ? (
          <span>{after} · unchanged</span>
        ) : (
          <>
            <span className="text-[#8A849A] line-through">{before}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#3D55E0]" aria-hidden="true" />
            <span className="text-[#3D55E0]">{after}</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Runs the real backend engines on a typical customer, so a rule change can be seen the moment it is saved. Nothing is calculated in the browser. */
export function TestCalculator() {
  const { config } = useAdminConfig();
  const [input, setInput] = useState<TestCalcInput>(DEFAULTS);
  const [result, setResult] = useState<TestCalcResult | null>(null);
  const [baseline, setBaseline] = useState<TestCalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef<TestCalcResult | null>(null);
  const version = config?.version;
  const key = JSON.stringify(input);

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(() => {
      postJSON<TestCalcResult>("/admin/test-calculator", JSON.parse(key))
        .then((next) => {
          if (stale) return;
          // The answer for the same customer under the previous configuration version becomes the "before"
          if (latest.current && latest.current.config_version !== next.config_version) setBaseline(latest.current);
          latest.current = next;
          setResult(next);
          setError(null);
        })
        .catch((failure: unknown) => !stale && setError(errorMessage(failure, "The calculator couldn't run.")))
        .finally(() => !stale && setLoading(false));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [key, version]);

  const set = <K extends keyof TestCalcInput>(k: K, v: TestCalcInput[K]) => setInput((c) => ({ ...c, [k]: v }));
  const num = (k: keyof TestCalcInput, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Math.min(max, Math.max(min, Number(e.target.value) || 0)) as never);

  const now = result ? headlineOf(result) : null;
  const before = baseline ? headlineOf(baseline) : null;
  const eligible = result?.products.filter((p) => p.eligible) ?? [];
  const blocked = result?.products.filter((p) => !p.eligible) ?? [];

  return (
    <Panel
      title="Test calculator"
      aside={
        result && (
          <span className="rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-bold text-[#3D55E0]">
            Using version {result.config_version} · {result.elapsed_ms} ms
          </span>
        )
      }
    >
      <p className="m-0 mb-4 text-sm text-[#6F6A7C]">
        The real assessment and recommendation engines run on this customer. Change a rule above, save it, and watch the numbers move.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="tc-age" className={LABEL}>
            Age
          </label>
          <input id="tc-age" type="number" value={input.age} onChange={num("age", 18, 75)} className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="tc-income" className={LABEL}>
            Annual income (₹)
          </label>
          <input
            id="tc-income"
            type="number"
            step={100000}
            value={input.annual_income}
            onChange={num("annual_income", 0, 1_000_000_000)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="tc-dep" className={LABEL}>
            Dependents
          </label>
          <input id="tc-dep" type="number" value={input.dependents} onChange={num("dependents", 0, 10)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="tc-loans" className={LABEL}>
            Loans (₹)
          </label>
          <input
            id="tc-loans"
            type="number"
            step={100000}
            value={input.outstanding_liabilities}
            onChange={num("outstanding_liabilities", 0, 10_000_000_000)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="tc-gender" className={LABEL}>
            Gender
          </label>
          <select
            id="tc-gender"
            value={input.gender}
            onChange={(e) => set("gender", e.target.value as "male" | "female")}
            className={INPUT}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label htmlFor="tc-cover" className={LABEL}>
            Existing cover (₹)
          </label>
          <input
            id="tc-cover"
            type="number"
            step={100000}
            value={input.existing_cover}
            onChange={num("existing_cover", 0, 10_000_000_000)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="tc-assets" className={LABEL}>
            Savings (₹)
          </label>
          <input
            id="tc-assets"
            type="number"
            step={100000}
            value={input.eligible_assets}
            onChange={num("eligible_assets", 0, 10_000_000_000)}
            className={INPUT}
          />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-[#0E1330] sm:col-span-4">
          <input
            type="checkbox"
            checked={input.smoker}
            onChange={(e) => set("smoker", e.target.checked)}
            className="h-4 w-4 accent-[#3D55E0]"
          />{" "}
          Smoker
        </label>
      </div>

      {error && (
        <p role="alert" className="m-0 mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800">
          {error}
        </p>
      )}
      {loading && !result ? (
        <Skeleton className="mt-5 h-40" />
      ) : (
        result &&
        now && (
          <div className="mt-5 space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#0E1330] p-4 text-white">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-white/60">Cover needed</p>
                <p className="m-0 mt-1 text-2xl font-extrabold tabular-nums">{inrShort(result.needs.recommended_cover)}</p>
                <p className="m-0 mt-1 text-xs text-white/60">
                  Rule-of-thumb band{" "}
                  {result.needs.income_multiple_check
                    ? `${inrShort(result.needs.income_multiple_check.minimum_cover)} – ${inrShort(result.needs.income_multiple_check.maximum_cover)}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#EEF1FF] p-4">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[#3D55E0]">Monthly premium</p>
                <p className="m-0 mt-1 text-2xl font-extrabold tabular-nums text-[#0E1330]">
                  {now.premium ? `₹${now.premium.toLocaleString("en-IN")}` : "—"}
                </p>
                <p className="m-0 mt-1 truncate text-xs text-[#6F6A7C]">{now.product}</p>
              </div>
              <div className="rounded-2xl border border-[#E8E5F0] p-4">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">Underwriting</p>
                <p className="m-0 mt-1 text-lg font-extrabold text-[#0E1330]">
                  {result.underwriting_for_recommended_cover ? ROUTE_LABEL[result.underwriting_for_recommended_cover.route] : "—"}
                </p>
                <p className="m-0 mt-1 text-xs text-[#6F6A7C]">
                  {result.underwriting_for_recommended_cover?.stp_eligible ? "Straight-through eligible" : "Not straight-through"} · for{" "}
                  {inrShort(result.needs.recommended_cover)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8F7FC] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-sm font-bold text-[#0E1330]">
                  {before && baseline
                    ? `Before (version ${baseline.config_version}) → now (version ${result.config_version})`
                    : "Before and after"}
                </p>
                <button
                  type="button"
                  onClick={() => setBaseline(result)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D3E8] bg-white px-2.5 py-1 text-xs font-bold text-[#3D55E0] hover:border-[#3D55E0]"
                >
                  <Flag className="h-3 w-3" aria-hidden="true" /> Use this as the baseline
                </button>
              </div>
              {before ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Delta label="Cover needed" before={inrShort(before.cover)} after={inrShort(now.cover)} />
                  <Delta
                    label="Monthly premium"
                    before={before.premium ? `₹${before.premium.toLocaleString("en-IN")}` : "—"}
                    after={now.premium ? `₹${now.premium.toLocaleString("en-IN")}` : "—"}
                  />
                  <Delta
                    label="Underwriting"
                    before={before.route ? ROUTE_LABEL[before.route] : "—"}
                    after={now.route ? ROUTE_LABEL[now.route] : "—"}
                  />
                </div>
              ) : (
                <p className="m-0 text-sm text-[#6F6A7C]">Save a change and the figures before it appear here, or set a baseline now.</p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8E5F0] text-[11px] font-bold uppercase tracking-wide text-[#8A849A]">
                    <th className="px-2 py-2">Eligible product</th>
                    <th className="px-2 py-2">Cover</th>
                    <th className="px-2 py-2">Term</th>
                    <th className="px-2 py-2">Monthly</th>
                    <th className="px-2 py-2">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.slice(0, 8).map((p) => (
                    <tr key={p.product_id} className="border-b border-[#F1EDFC]">
                      <td className="px-2 py-2.5">
                        <span className="font-bold text-[#0E1330]">{p.product_name}</span>{" "}
                        <span className="text-xs text-[#8A849A]">{p.category}</span>
                      </td>
                      <td className="px-2 py-2.5 tabular-nums">{inrShort(p.sum_assured)}</td>
                      <td className="px-2 py-2.5 tabular-nums">{p.term_years ? `${p.term_years} yr` : "—"}</td>
                      <td className="px-2 py-2.5 tabular-nums">
                        {p.monthly_premium ? `₹${p.monthly_premium.toLocaleString("en-IN")}` : "One time"}
                      </td>
                      <td className="px-2 py-2.5 text-xs">{p.underwriting_route ? ROUTE_LABEL[p.underwriting_route] : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eligible.length === 0 && (
                <p className="m-0 py-4 text-sm text-[#6F6A7C]">No product is open to this customer under the current rules.</p>
              )}
              {blocked.length > 0 && (
                <p className="m-0 mt-2 text-xs text-[#8A849A]">
                  {blocked.length} products are not open to this customer (switched off, or outside their age, income or cover limits).
                </p>
              )}
            </div>
          </div>
        )
      )}
    </Panel>
  );
}
