"use client";

import { ToolShell } from "@/components/tools/kit";
import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";

export default function FamilySurvivalSimulatorPage() {
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Inputs
  const [liquidAssets, setLiquidAssets] = useState(1500000); // 15 Lakhs
  const [existingPayout, setExistingPayout] = useState(2500000); // 25 Lakhs
  const [newCover, setNewCover] = useState(12500000); // 1.25 Crore
  const [livingExpenses, setLivingExpenses] = useState(720000); // 7.2 Lakhs / yr
  const [debtAnnual, setDebtAnnual] = useState(360000); // 3.6 Lakhs EMI / yr
  const [debtTenure, setDebtTenure] = useState(8); // 8 yrs remaining
  const [inflationRate, setInflationRate] = useState(0.06); // 6%
  const [yieldRate, setYieldRate] = useState(0.075); // 7.5% safe yield
  const [projectionYears, setProjectionYears] = useState(25);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        initial_liquid_assets: liquidAssets,
        existing_insurance_payout: existingPayout,
        additional_coverage_considered: newCover,
        annual_living_expenses: livingExpenses,
        annual_debt_obligation: debtAnnual,
        debt_tenure_years_remaining: debtTenure,
        inflation_rate: inflationRate,
        investment_yield_rate: yieldRate,
        projection_years: projectionYears
      };
      const res = await fetchFromAPI("/tools/survival-simulation", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage or fetched after mount
    runSimulation();
  }, []);

  return (
    <ToolShell slug="family-survival-simulator" wide>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Parameters */}
        <div className="lg:col-span-5 bg-white border border-[#D9D3E8] rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[#24212B] border-b border-[#D9D3E8] pb-3">
            Simulation Assumptions
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Existing Liquid Assets:</span>
                <span className="font-bold text-[#24212B]">{formatINR(liquidAssets, { compact: true })}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000000"
                step="250000"
                value={liquidAssets}
                onChange={(e) => setLiquidAssets(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Existing Life Insurance Payout:</span>
                <span className="font-bold text-[#24212B]">{formatINR(existingPayout, { compact: true })}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20000000"
                step="500000"
                value={existingPayout}
                onChange={(e) => setExistingPayout(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Additional Protection Evaluated:</span>
                <span className="font-bold text-[#7957FF]">{formatINR(newCover, { compact: true })}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30000000"
                step="1000000"
                value={newCover}
                onChange={(e) => setNewCover(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Annual Living Expenses:</span>
                <span className="font-bold text-[#24212B]">{formatINR(livingExpenses, { compact: true })}/yr</span>
              </div>
              <input
                type="range"
                min="300000"
                max="3000000"
                step="50000"
                value={livingExpenses}
                onChange={(e) => setLivingExpenses(Number(e.target.value))}
                className="w-full accent-[#7957FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold block mb-1">Debt Outflow (EMI/yr)</label>
                <input
                  type="number"
                  value={debtAnnual}
                  onChange={(e) => setDebtAnnual(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#D9D3E8] bg-[#FAF9F6]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Debt Years Remaining</label>
                <input
                  type="number"
                  value={debtTenure}
                  onChange={(e) => setDebtTenure(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#D9D3E8] bg-[#FAF9F6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold block mb-1">Inflation: {(inflationRate * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0.04"
                  max="0.10"
                  step="0.005"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full accent-[#7957FF]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Yield: {(yieldRate * 100).toFixed(1)}%</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.12"
                  step="0.005"
                  value={yieldRate}
                  onChange={(e) => setYieldRate(Number(e.target.value))}
                  className="w-full accent-[#7957FF]"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl shadow transition-colors"
            >
              {loading ? "Simulating..." : "Recalculate Survival Runway"}
            </button>
          </div>
        </div>

        {/* Right Column: Simulation Verdict & Runway Badges */}
        <div className="lg:col-span-7 space-y-6">
          {simResult && (
            <>
              {/* Runway Verdict Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D9D3E8] shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
                  Actuarial Runway Comparison
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                    <span className="text-sm font-semibold text-rose-700">
                      Without Additional Cover
                    </span>
                    <div className="text-2xl font-black text-rose-600">
                      {simResult.depletion_year_without_new_cover ? (
                        `Depletes in Year ${simResult.depletion_year_without_new_cover}`
                      ) : (
                        `${simResult.financial_runway_years_without_new_cover}+ Years`
                      )}
                    </div>
                    <span className="text-sm text-rose-600/80">
                      Initial Fund: {formatINR(liquidAssets + existingPayout, { compact: true })}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-sm font-semibold text-emerald-700">
                      With Evaluated Cover
                    </span>
                    <div className="text-2xl font-black text-emerald-600">
                      {simResult.depletion_year_with_new_cover ? (
                        `Depletes in Year ${simResult.depletion_year_with_new_cover}`
                      ) : (
                        `${simResult.financial_runway_years_with_new_cover}+ Years Solvency`
                      )}
                    </div>
                    <span className="text-sm text-emerald-600/80">
                      Protected Fund: {formatINR(liquidAssets + existingPayout + newCover, { compact: true })}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#D9D3E8] text-sm text-[#24212B] leading-relaxed">
                  <strong>Verdict:</strong> {simResult.summary_verdict}
                </div>
              </div>

              {/* Year by Year Cashflow Timeline Table Preview */}
              <div className="bg-white border border-[#D9D3E8] rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#24212B]">
                  First 10 Years Corpus Projection (With Evaluated Cover)
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FAF9F6] text-[#6F6A7C]">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Opening Corpus</th>
                        <th className="p-2.5">Living Costs</th>
                        <th className="p-2.5">Debt Paid</th>
                        <th className="p-2.5">Closing Corpus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3E8]">
                      {simResult.yearly_timeline_with_cover.slice(0, 10).map((r: any) => (
                        <tr key={r.year} className="hover:bg-[#FAF9F6]">
                          <td className="p-2.5 font-bold">Year {r.year}</td>
                          <td className="p-2.5">{formatINR(r.opening_corpus, { compact: true })}</td>
                          <td className="p-2.5 text-rose-500">-{formatINR(r.living_expenses_withdrawn, { compact: true })}</td>
                          <td className="p-2.5">{r.debt_paid > 0 ? `-${formatINR(r.debt_paid, { compact: true })}` : "₹0"}</td>
                          <td className="p-2.5 font-bold text-[#24212B]">{formatINR(r.closing_corpus, { compact: true })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-sm text-[#7F8FA4] italic">
                  {simResult.disclaimer}
                </div>
              </div>
            </>
          )}
        </div>

      </div>

    </ToolShell>
  );
}
