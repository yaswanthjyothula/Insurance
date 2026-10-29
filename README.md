# LifeSure AI | Intelligent Insurance Advisory Platform

> **Plan Better. Choose Smarter. Protect What Matters.**  
> *A full-stack insurtech platform connecting deterministic financial needs assessment, explainable plan matching on real, sourced insurer data, dynamic scenario stress-testing, and policy document intelligence for Indian households.*

---

## 🛡️ Core Highlights

- **Deterministic Financial Engine:** Dual-method assessment combining **Capital Needs Analysis** and **Human Life Value (HLV)**. Completely decoupled from stochastic language model outputs.
- **Scenario Studio™:** One-tap life transition stress-testing (*Another child*, *Retire at 55*, *Income down 20%*, *Loan cleared early*, *Add home loan*) with real-time before-and-after diffs.
- **Explainable Plan Matching:** Real term plans from eight Indian insurers, each fact linked to its insurer source. Plans are filtered by eligibility, then scored on five published factors (claims record, financial strength, fit, affordability, features) with the reasoning shown. Premiums are labelled estimates.
- **Policy X-Ray™:** Document parsing engine extracting basic sum assured, suicide clauses, grace periods, and exclusions with page citations.
- **Family Financial Survival Simulator:** Actuarial cashflow engine calculating exact family corpus depletion years with and without insurance.
- **Complete Insurance Inventory:** Purpose-built discovery guides for all 7 primary Indian insurance categories: Term, Traditional Life, Health, General/Property, Investment-Linked (ULIP), Business/Keyman, and Cyber/Accident Sachet.
- **Fiduciary Advisory Portal:** Video consultation booking with certified fee-only financial planners (CFP®), AES-256 Emergency Insurance Vault, and Protection Passport.
- **Compliance & Privacy:** Fully aligned with the Indian Digital Personal Data Protection Act, 2023 (DPDP Act) and statutory Section 45 Insurance Act disclosures.

---

## 🏗️ Technical Stack

- **Frontend:** Next.js 16 (App Router with Turbopack), TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Python 3.9+, FastAPI, Pydantic v2, Scikit-Learn, NumPy, Pandas, Uvicorn, Pytest.
- **AI & Document Intelligence:** Deterministic regex parser + Grounded Gemini API conversational guidance.
- **Security:** Strict CORS, X-Content-Type-Options, X-Frame-Options, zero client secrets, AES-256 private storage.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Activate virtual environment
source .venv/bin/activate

# Run automated test suites (All 15 tests)
PYTHONPATH=backend pytest backend/tests/ -v

# Start FastAPI server
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API interactive Swagger docs: `http://127.0.0.1:8000/docs`*

### 2. Frontend Setup
```bash
cd frontend

# Run Next.js production build verification
npm run build

# Start Next.js development server
npm run dev
```
*Application interface live at: `http://127.0.0.1:3000`*

---

## 📁 Repository Map

```
├── backend/
│   ├── app/
│   │   ├── api/v1/api.py              # FastAPI REST endpoints
│   │   ├── core/config.py             # Settings and environment bindings
│   │   ├── schemas/                   # Pydantic v2 typed models
│   │   ├── services/
│   │   │   ├── financial_engine.py    # Deterministic needs & HLV calculator
│   │   │   ├── scenario_engine.py     # Scenario Studio diff transformation
│   │   │   ├── survival_simulator.py  # Family survival actuarial simulator
│   │   │   ├── catalog.py             # 7-category insurance catalog
│   │   │   ├── ml_recommender.py      # Scikit-learn product ranking model
│   │   │   ├── policy_xray.py         # Document schedule and clause parser
│   │   │   └── gemini_assistant.py    # Grounded advisory assistant
│   │   └── main.py                    # App entrypoint and security headers
│   └── tests/
│       ├── test_financial_and_ml.py   # Actuarial & ML unit tests
│       └── test_api_endpoints.py      # HTTP integration test suite
├── frontend/
│   ├── src/
│   │   ├── app/                       # 43 static & dynamic Next.js App Router pages
│   │   │   ├── insurance/             # 7 Category pages (term, health, life...)
│   │   │   ├── tools/                 # 12 Smart Tools (calculator, scenario, xray...)
│   │   │   ├── dashboard/             # Protection Passport, Vault, Safety Net
│   │   │   └── resources/             # Glossary, Directory, Claims, Learning
│   │   ├── components/                # Reusable UI tokens, Navbar, Footer, Logo
│   │   └── lib/                       # API client and currency formatters
└── docs/                              # Architecture, API, ML Evaluation, Security
```

---

## 📜 Statutory Regulatory Disclaimer
*LifeSure AI is an independent digital financial technology platform. LifeSure AI is not an insurance broker, corporate agent, or underwriting carrier. Calculations are deterministic estimations for educational planning and do not constitute formal underwriting policy quotations or regulated SEBI advice.*