# TEAM-000498 · B2: Intelligent Life Insurance Needs Finder & Digital Advisory Platform

Team Nexus. A web app that works out how much life cover a family needs. It matches the customer to Term, Whole Life, Endowment and ULIP products with exact premiums, lets them reshape a policy and test life changes, and books a (simulated) advisor session. Product rules and rates are edited live in an admin console, with no redeploy.

## What it does

Problem: retail banking customers find life insurance confusing (jargon, manual cover estimates, little guidance), so many drop out of the buying journey.

Users: a bank's retail customers, its advisors and its product administrators. All insurer data is the problem pack's **fictional** Saffron Life; nothing here is real advice or a real quote.

A customer goes through four stages:

1. **Needs Finder** (`/assessment`): age, gender, income, family and dependents, loans, savings, existing cover, goals, budget and risk appetite. Nothing is prefilled. A "Try a sample customer" picker loads one of the pack's 200 synthetic customers.
2. **Coverage recommendation** (`/results`): the sum assured needed, by the **Net Needs** method, cross-checked by **Human Life Value**, with a breakdown and the assumptions used.
3. **Product selection** (`/products`): every Saffron Life product is checked for eligibility, configured to the customer's term and budget, priced exactly from the rate tables (monthly premium shown), scored and ranked. The customer changes cover, term, payment option and riders (for ULIPs: premium, cover multiple and fund, with a fund projection) and the price updates live.
4. **Digital advisory** (`/advisory`): choose an advisor and a free slot from the pack's calendar and book. The booking is a **simulation**: nobody is notified.

Also included: **Admin console** (`/admin`) for product rules, rates, needs assumptions and underwriting, all versioned with rollback. **Scenario Studio** lets a customer describe a life change in words; an AI model reads it into numbers and fixed rules recompute the cover. **My plan** holds the saved cover need, chosen policies and appointments. There is an **advisor workspace** and calculators (loan EMI, goal cost, family cash runway, policy text reader).

### The two Stage 2 scenarios

| Scenario | In the app | Through the API (`http://127.0.0.1:8000/api/v1`) |
|---|---|---|
| **1. Age, income, dependents, loans → sum assured + monthly premium** | `/sign-in` → **Continue as demo customer** → `/assessment` → **Calculate coverage**. `/results` shows the sum assured; `/products` shows each plan's monthly premium. | **`POST /quick-quote`** with `{"age": 32, "annual_income": 1800000, "dependents": 2, "outstanding_liabilities": 2500000}` returns `sum_assured` and `monthly_premium` (plus the product and every eligible plan). `income`, `dependents_count` and `loans` are accepted as field names too. For the full journey: `POST /assessments`, then `POST /recommendations`. |
| **2. Admin changes a product → engine quotes with the new rules, no restart** | `/admin-sign-in` → **Continue as demo admin (synthetic)** → **Products & rates** → edit → save. The next quote uses the new rules. | `POST /auth/demo/admin` gives a token. `PUT /admin/products/{product_id}` with e.g. `{"base_rate_per_1000": 3.0}` applies the change at once. The next `POST /quick-quote` (or `/quotes`, `/recommendations`) prices with it and reports the new `config_version`. |

Quick quote assumes household expenses of 40% of income unless `annual_expenses` is sent; the in-app form asks for expenses directly. The same engine powers the admin console's **Test calculator** (Underwriting & test tab).

Checked on a clean copy (Python 3.12, pinned requirements). Example input: age 32, male, ₹18,00,000 income, ₹7,20,000 expenses, 2 dependents, ₹25,00,000 loans. Result: sum assured ₹1,55,00,000 and top product `PRD-VDIJSF` at ₹3,144 a month. Raising that product's base rate by 50% in admin took about 4 ms to apply. The next quote was ₹4,716 a month, with no restart. Requests take about 10–35 ms, including the very first one after startup, against a 5 s limit. The server loads the pack and trains the ranking model (about 2 s) before it accepts requests.

How Scenario 2 works: every admin change is validated, saved, versioned and then swapped in atomically as the live configuration (`backend/app/admin/config_store.py`). The engines read that live snapshot on every request, so nothing is cached past a change and nothing needs redeploying.

## How to run

Requirements: Python 3.11+ and Node 20+.

**1. Put the problem pack's data in place.** Copy the pack's `data/` files into **`FULL_CODE/data/`**: `products.json`, `riders.csv`, `premium_rates.csv`, `ulip_funds.csv`, `ulip_mortality_charges.csv`, `customer_profiles.json`, `advisors.csv`, `advisor_slots.csv`, `reference_assumptions.json` and the rest. That folder is git-ignored, so the pack is never committed. If a file is missing, the API refuses to start and says which one.

**2. Environment (optional for a local run).** Copy `FULL_CODE/.env.example` to `FULL_CODE/.env`. Every key has a working default or is optional; the comments in the file explain each one. `FULL_CODE/frontend/.env.example` only holds the backend URL, which defaults to `http://127.0.0.1:8000/api/v1`.

**3. Backend API** (http://127.0.0.1:8000, interactive docs at http://127.0.0.1:8000/docs), from the repository root:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r FULL_CODE/backend/requirements.txt
python FULL_CODE/main.py
```

`FULL_CODE/main.py` is the single entry point. Equivalent: `cd FULL_CODE/backend && uvicorn app.main:app --port 8000`.

**4. Frontend** (http://localhost:3000), in a second terminal:

```bash
cd FULL_CODE/frontend
npm ci
npm run dev
```

Open http://localhost:3000. Press **Continue as demo customer** on `/sign-in`, or **Continue as demo admin** on `/admin-sign-in`. Both are synthetic accounts with no password. Set `ENABLE_DEMO_LOGIN=false` to turn them off.

**Optional database.** Without Supabase settings the app keeps runtime data (saved plans, bookings, admin configuration) in JSON files under `FULL_CODE/backend/data_store/` (git-ignored). To use Supabase instead:
1. Run `FULL_CODE/db/schema.sql` in the Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_KEY` in `.env`.
3. Load the pack with `cd FULL_CODE/backend && python -m app.seed_supabase` (add `--dry-run` to preview).

## How to run the tests

From the repository root:

```bash
python -m pytest
```

That runs 457 backend tests: premium maths, needs, eligibility, recommendations, quick quote, admin live configuration, API, auth and the LLM layer (mocked).

```bash
cd FULL_CODE/frontend && npm test
```

That runs 199 frontend tests: form logic, plan configuration, finance maths, helpers and i18n.

Lint and format:
- Backend: `cd FULL_CODE/backend && ruff check . && ruff format --check .`
- Frontend: `cd FULL_CODE/frontend && npm run lint && npm run format:check`

## Architecture

```
FULL_CODE/
├── main.py              single entry point: starts the FastAPI app
├── .env.example         every setting, with safe defaults (no real secrets)
├── backend/             Python API: requirements.txt (pinned), pyproject.toml (pytest + ruff), tests/
│   └── app/
│       ├── api/v1/routes/   thin HTTP layer: auth, assessments, catalogue, recommend, scenarios, tools, advisory, my_plan, advisor
│       ├── services/        business logic, independent of FastAPI
│       │     financial_engine   Net Needs + Human Life Value (sum assured)
│       │     premium            exact premium maths (Decimal), riders, modal factors (monthly premium)
│       │     eligibility        product rules and the pack's cover caps
│       │     planning           picks a policy configuration per product and scores it
│       │     recommendation     blends the ranking model, builds the budget-aware basket
│       │     quick_quote        Stage 2 shortcut: age, income, dependents, loans → sum assured + monthly premium
│       │     underwriting_engine, ulip, advisory, scenario_llm, storage, ...
│       ├── admin/           admin console API and the live, versioned configuration (config_store)
│       ├── pack/            loads the problem pack's CSV/JSON once, indexed
│       ├── ml/ranker.py     scikit-learn ranking model, trained in memory
│       ├── prompts/         LLM prompts, kept out of the code
│       ├── schemas/         Pydantic request/response models (input validation)
│       └── core/            settings, security (signed sessions, rate limits), Supabase client
├── frontend/            Next.js web app: package.json + package-lock.json
│   └── src/  app/ (pages) · components/ (per feature) · hooks/ · lib/ (pure logic + API client) · i18n/ · store/ · types/
├── db/schema.sql        database schema (Supabase/Postgres, row-level security on)
├── docs/ml-model.md     how the ranking model is trained and evaluated
├── scripts/             create_submission_zip.py: zips a fresh git clone, as the guidelines ask
└── data/                the problem pack's files (git-ignored, not committed)
```

```
Browser (Next.js 16, React 19, TypeScript, Tailwind)
   │  JSON over HTTP, Authorization: Bearer <signed session token>
   ▼
FastAPI routes ──► services (needs, premium, eligibility, planning, recommendation)
                        │                    ▲
                        ▼                    │ live snapshot, swapped atomically on every admin save
                   pack loader ──► admin config_store ◄── admin console (/admin)
                        │
   JSON files in backend/data_store  or  Supabase (db/schema.sql)
```

Key rules the engine follows:
- Premium = rate per ₹1,000 × cover ÷ 1,000 × price-band factor.
- Instalment = annual premium × modal factor.
- Each part is rounded half-up in exact decimals.
- No rate row means the combination is not allowed.
- Total cover is capped at an age-based multiple of income, and new non-term cover at 10× income.

## AI usage

- **Gemini (`gemini-3.1-flash-lite`, fallback `gemini-3.5-flash-lite`)** reads a customer's free-text life change in Scenario Studio into a few numeric changes. It never calculates cover or premiums. Safeguards:
  - Output is validated against a strict schema (allowed fields, clamped ranges).
  - Personal data (emails, phones, ID numbers) is masked before sending.
  - The customer text is fenced as untrusted data.
  - Calls have timeouts and retries with back-off, and the route is rate-limited.
  - Model names, temperature and token limits live in `.env`.
  - The API key stays on the server.
  - If the model is unavailable, a built-in keyword reader takes over and says so on screen.
- **scikit-learn ranking model** (`HistGradientBoostingClassifier`) re-scores eligible products for the customer's stated priority.
  - It is trained on **synthetic** choices made by simulated buyers over the pack's synthetic customers, split by customer into train and test, with a fixed seed.
  - On held-out customers it picks the simulated buyer's product first 41% of the time. Comparisons: fixed rule 39%, simulation ceiling 44%, random 9%.
  - It is blended 50/50 with a readable rule score and never overrides eligibility.
  - It is trained in memory at startup; no model file is saved or loaded. See `FULL_CODE/docs/ml-model.md`.
- **AI coding assistants:** parts of this code were written with Claude Code (Anthropic). The team reviewed the code and can explain it.

## Pre-built and third-party code

- **Written for this hackathon:** everything in `FULL_CODE/`. The repository's first commit is dated 28 Oct 2026. No application code comes from earlier projects or other hackathons.
- **Starter template:** the frontend was created with `create-next-app` (MIT). Its boilerplate has been replaced.
- **Open-source libraries.** Exact versions are in `FULL_CODE/backend/requirements.txt` and `FULL_CODE/frontend/package-lock.json`.
  - Backend: FastAPI, Starlette, Pydantic, Uvicorn, httpx, AnyIO, python-dotenv, python-multipart, scikit-learn, NumPy (MIT/BSD); pytest and Ruff for tests and linting.
  - Frontend: Next.js, React, Tailwind CSS, Motion, lucide-react (ISC), clsx, tailwind-merge (MIT); Vitest, ESLint and Prettier for tests and linting.
- **Data:** the problem pack's synthetic Saffron Life data, used as provided and not committed.
- **Fonts:** Plus Jakarta Sans (SIL Open Font License), via `next/font`.

## Limitations

- **Everything about Saffron Life is fictional.** Prices are not real quotes and nothing here is financial advice.
- **The ranking model learned from a simulation**, not from real buyers. Only 14 products exist, so it has seen a narrow range. Its gain over a fixed rule is real but small (a few points), and zero for the "balanced" and "lowest cost" priorities.
- **The needs estimate is a simplification:**
  - One support horizon, from the longest-supported dependent (capped at 40 years).
  - A working spouse's income is not counted.
  - The customer's own retirement goals are left out.
  - Taxes are not modelled.
  - Assumptions come from the pack's reference file and can be changed in the admin console.
- **Admin-created products** have no rate table. They are priced from a base rate with age, smoker and gender loadings. ULIPs cannot be created in the console, only edited or switched off.
- **Booking is simulated.** Advisors are sample profiles from the pack, nobody is notified, and the chat/video panel is a demo. Slots come from the pack's two-week calendar; outside it, the app replays the calendar from its first day.
- **Prototype storage and auth:**
  - Without Supabase, saved plans, bookings, local accounts and the admin configuration are JSON files, not a database.
  - The session token is kept in the browser's session storage.
  - The passwordless demo sign-ins (`ENABLE_DEMO_LOGIN`) must be turned off for real use.
- **Languages:** the customer UI offers English, Hindi and Telugu. Hindi and Telugu are partial; any text without an approved translation falls back to English.
- **Python 3.11+ is required**, so the backend can use current, patched FastAPI, Starlette and AnyIO releases.
- **Not built:** real purchase or e-signature, insurer integrations, medical underwriting, claims, and health or motor products.
- **Real-world context pages:** the education pages under `/insurance` and `/resources` describe real Indian market facts (IRDAI rules, insurer claim ratios). They are not used by the recommendations, and some figures are marked "Not confirmed".
