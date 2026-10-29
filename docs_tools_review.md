# LifeSure tools: review

Status after this pass: all 12 tools load, compute, and carry an "About this tool" panel (why, how, assumptions, limits).

| # | Tool | What it is for | How it works | What to add next |
|---|------|----------------|--------------|------------------|
| 1 | Life Cover Calculator | Size life cover to the family's real needs | Income need + loans + goals, minus savings and existing cover; matches real term plans | Save and compare cases, spouse income, PDF export |
| 2 | Scenario Studio | Test a life event before it happens | Reruns the needs engine with a preset change | Combine events, custom events, share link |
| 3 | Family Survival Simulator | Turn cover into years of runway | Yearly projection with inflation and yield, with and without extra cover | Yearly chart, spouse income later, bad-return stress test |
| 4 | Policy X-Ray | Read key terms from a policy | Extracts only what is in the pasted text; missing items listed as not found | PDF upload, clause comparison to standard wording, compare two policies |
| 5 | Premium Affordability | Check a plan fits the budget | Premium from ICICI-calibrated price points, shown as share of income | Per-insurer comparison, riders, health premium in the budget |
| 6 | Loan EMI and Cover | EMI plus the cover that clears the loan | Standard EMI formula, yearly balance chart | Prepayment, step-up EMI, joint-loan split |
| 7 | Policy Replacement Check | Keep or switch an old savings policy | Compares your insurer's maturity figure with term premium plus invested surplus | Tax, paid-up option, insurer data import |
| 8 | Cost Inflation Projector | Show growth of living costs and health premium | Compounds both at rates you set | Real renewal history, income growth |
| 9 | Future Goal Cost | Cost of a goal later, and monthly saving | Compounds cost, then annuity-due saving formula | Multiple goals, link to cover need, study abroad currency |
| 10 | Protection Gap Radar | See which needs are uncovered | Four needs in rupees vs what you have; debts funded first | Auto-fill from calculator, track over time |
| 11 | Scam Shield | Spot insurance fraud | Eight warning signs, risk level, where to report | Paste-a-message check, agent licence check |
| 12 | Application Readiness | Prepare before a proposal form | Twelve-item checklist saved on the device | Per-insurer lists, secure document storage |

## Changes in this pass
- Policy X-Ray no longer returns canned data (it used to return LIC and a fixed premium whatever you pasted). It reports only what the text contains.
- Premium figures use one calibrated estimate (`frontend/src/lib/premium.ts`) instead of made-up constants.
- The Life Cover Calculator no longer starts with sample debts, cover and goals.
- Shared tool UI in `frontend/src/components/tools/kit.tsx`; guide text in `frontend/src/data/tools.ts`.
- Cursor effects (aura, card spotlight, magnetic buttons, click ripple): `frontend/src/components/layout/CursorEffects.tsx`.

## Known gaps
- Premium is an estimate calibrated to three published ICICI prices, not a live quote.
- Survival Simulator and Scenario Studio still start from example inputs.
- Policy X-Ray reads text only, not PDFs or scans.
