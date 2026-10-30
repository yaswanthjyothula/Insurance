# TEAM-000498 · B2: Intelligent Life Insurance Needs Finder & Digital Advisory Platform

Team Nexus. A customer-facing web app that works out how much life cover a family needs, matches the customer to Term, Whole Life, Endowment and ULIP products with exact premiums, lets them reshape a policy with sliders and test life changes, and books a (simulated) advisor session.

## What it does

Problem: retail banking customers find life insurance confusing (jargon, manual cover estimates, little guidance), so many drop out of the buying journey.

A customer goes through four stages:

1. **Needs Finder** (`/assessment`): age, gender, income, family, loans, savings, existing cover, goals, budget and risk appetite. Nothing is prefilled. A "Try a sample customer" picker loads one of the pack's 200 synthetic customers.
2. **Coverage recommendation** (`/results`): cover needed by the **Net Needs** method, cross-checked by **Human Life Value**, with a visual breakdown and the assumptions used.
3. **Product selection** (`/products`): every Saffron Life product is checked for eligibility, configured to the customer's term and budget, priced exactly from the rate tables, scored and ranked. The customer changes cover, term, payment option, riders (and, for ULIPs, premium, cover multiple and fund, with a fund projection) and sees the price update live. A recommended basket is built within the budget.
4. **Digital advisory** (`/advisory`): choose an advisor and a free slot from the pack's calendar and book. The booking is a **simulation**: nobody is notified.

Also: **Scenario Studio** (describe a life change in words, an AI model reads it into numbers, fixed rules recompute the cover), **My plan** (saved cover need, chosen policies and appointments), and tools such as a policy text reader, loan EMI, goal cost and a family cash-runway simulator.

Users: a bank's retail customers. All insurer data is the problem pack's **fictional** Saffron Life; nothing here is real advice or a real quote.

## How to run

Requirements: Python 3.11+, Node 20+.

**1. Put the problem pack's data in place.** Copy the pack's `data/` files (`products.json`, `riders.csv`, `premium_rates.csv`, `ulip_funds.csv`, `ulip_mortality_charges.csv`, `customer_profiles.json`, `advisors.csv`, `advisor_slots.csv`, `reference_assumptions.json`, and the rest) into **`FULL_CODE/data/`**. That folder is git-ignored, so the pack is never committed. The API refuses to start with a clear message if a file is missing.

**2. Environment.** Copy `FULL_CODE/.env.example` to `FULL_CODE/.env` and fill it in (all keys are optional for a local run; see the comments inside). `FULL_CODE/frontend/.env.example` only holds the backend URL.

**3. Backend** (http://127.0.0.1:8000, API docs at `/docs`):

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r FULL_CODE/backend/requirements.txt
cd FULL_CODE/backend && uvicorn app.main:app --port 8000
```

**4. Frontend** (http://localhost:3000):

```bash
cd FULL_CODE/frontend
npm install
npm run dev
```

Open http://localhost:3000 and press **Continue as demo customer** on the sign-in page (a synthetic account, no password).

## How to run the tests

```bash
cd FULL_CODE/backend && python -m pytest          # 260 tests: premium maths, needs, recommendations, API, auth, LLM layer
cd FULL_CODE/frontend && npm test                 # 109 tests: form logic, plan configuration, finance maths, helpers
```

Lint and format: `ruff check . && ruff format --check .` (backend), `npm run lint` and `npm run format:check` (frontend).

## Architecture

```
Browser (Next.js 16, React 19, TypeScript, Tailwind)
   │  JSON over HTTPS, Authorization: Bearer <signed session token>
   ▼
FastAPI backend (FULL_CODE/backend/app)
   ├─ api/v1/routes/   thin HTTP layer: auth, assessments, catalogue, recommend, scenarios, tools, advisory, my_plan
   ├─ services/        business logic, independent of FastAPI:
   │    financial_engine   Net Needs + Human Life Value
   │    premium            exact premium maths (Decimal), riders, modal factors
   │    eligibility        product rules and the pack's cover caps
   │    planning           chooses a policy configuration per product and scores it
   │    recommendation     blends the ranking model, builds the budget-aware basket
   │    ulip               fund projection from the pack's charges
   │    advisory           advisors, slots, bookings
   │    scenario_llm       Gemini reader (validated output, masked input, fallback)
   ├─ ml/ranker.py     scikit-learn ranking model, trained in memory on synthetic choices
   ├─ pack/            loads the problem pack's CSV/JSON files once, indexed
   └─ prompts/         the LLM prompts, kept out of the code
Runtime data (saved plans, bookings) → JSON files in backend/data_store (git-ignored, prototype store)
```

Frontend layout (`FULL_CODE/frontend/src`): `app/` (pages), `components/` (per-feature folders), `hooks/`, `lib/` (pure logic with tests and the API client), `store/` (journey state in the browser), `types/api.ts` (the backend contract).

Key rules the engine follows: premium = rate per ₹1,000 × cover ÷ 1,000 × price-band factor, instalment = annual × modal factor, each part rounded half-up in exact decimals; no rate row means the combination is not allowed; total cover is capped at an age-based multiple of income, and new non-term cover at 10× income.

## AI usage

- **Gemini (`gemini-3.1-flash-lite`, fallback `gemini-3.5-flash-lite`)**: reads a customer's free-text life change in Scenario Studio into a few numeric changes. It never calculates cover or premiums. Output is validated against a strict schema (allowed fields, clamped ranges), personal data (emails, phones, ID numbers) is masked before sending, the customer text is fenced as untrusted data, calls have timeouts and retries with back-off, the route is rate-limited, and a built-in keyword reader takes over (and says so on screen) if the model is unavailable. The API key stays on the server.
- **scikit-learn ranking model** (`HistGradientBoostingClassifier`): re-scores eligible products for the customer's stated priority. It is trained on **synthetic** choices made by simulated buyers over the pack's synthetic customers, split by customer into train and test, and compared with a fixed-rule baseline, the ceiling the simulation allows, and random. On held-out customers it picks the simulated buyer's product first 41% of the time (fixed rule 39%, ceiling 44%, random 9%). It is blended 50/50 with a readable rule score and never overrides eligibility. See `FULL_CODE/docs/ml-model.md`. The model is trained in memory at startup; no model file is saved or loaded.
- **AI coding assistants**: parts of this code were written with Claude Code (Anthropic). The team reviewed and can explain the code.

## Pre-built and third-party code

- Written for this hackathon: everything in `FULL_CODE/` (the repository's first commit is dated 28 Oct 2026). No application code from earlier projects or other hackathons. *(Team: confirm this sentence is true for every member before submitting.)*
- Starter template: the project was created with `create-next-app` (MIT). Its boilerplate has been replaced.
- Open-source libraries (exact versions in `backend/requirements.txt` and `frontend/package-lock.json`): FastAPI, Pydantic, Starlette, Uvicorn, httpx, python-dotenv, python-multipart, scikit-learn, NumPy (BSD/MIT); Next.js, React, Tailwind CSS, lucide-react, clsx, tailwind-merge, Vitest, Prettier, ESLint (MIT).
- Data: the problem pack's synthetic Saffron Life data, used as provided and not committed.
- Fonts: Plus Jakarta Sans (SIL Open Font License) via `next/font`.

## Limitations

- The customer UI currently offers English, Hindi and Telugu. Hindi and Telugu are partial translations; any message without an approved translation falls back to English, including product-plan copy.
- **Everything about Saffron Life is fictional.** Prices are not real quotes and nothing here is financial advice.
- **The ranking model learned from a simulation**, not from real buyers, and only 14 products exist, so it has seen a narrow range of products. Its gain over a fixed rule is real but small (a few points), and zero for "balanced" and "lowest cost".
- **Needs estimate is a simplification.** One support horizon from the longest-supported dependent (capped at 40 years); a working spouse's income is not counted; own retirement goals are left out; taxes are not modelled. Assumptions come from the pack's reference file and can be overridden.
- **Booking is simulated.** Advisors are sample profiles from the pack, nobody is notified, and the chat/video panel is a demo. Slots are in the pack's two-week calendar; outside it the app replays the calendar from its first day.
- **Prototype storage and auth.** Saved plans, bookings and local accounts are JSON files (not a database) and the session token is kept in the browser's session storage. The passwordless demo sign-in (`ENABLE_DEMO_LOGIN`) must be turned off for real use.
- **Runtime baseline.** The backend requires Python 3.11+ so it can use current, patched FastAPI, Starlette and AnyIO releases. Recreate the virtual environment after upgrading Python; Python 3.9 and 3.10 are unsupported.
- Not built: real purchase or e-signature, insurer integrations, medical underwriting, claims, a health or motor product set.
- The education pages under `/insurance` and `/resources` describe real Indian market facts (IRDAI rules, insurer claim ratios) for context. They are not used by the recommendations, and some figures are marked "Not confirmed".
