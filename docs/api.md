# LifeSure AI - API Specification & Documentation

## Base URL
- Local Dev: `http://127.0.0.1:8000/api/v1`
- Production: `https://api.lifesure.ai/api/v1`

---

## 1. Assessments & Calculations

### `POST /assessments`
Create and calculate a deterministic life coverage assessment.
- **Request Body (`AssessmentInput`):**
  - `age`: integer (18–65)
  - `annual_income`: float (₹)
  - `annual_expenses`: float (₹)
  - `dependents_count`: integer (0–10)
  - `support_horizon_years`: integer (optional)
  - `outstanding_liabilities`: float (₹)
  - `existing_cover`: float (₹)
  - `eligible_assets`: float (₹)
  - `future_goals`: list of `{ name, cost_today, years_away, category }`
  - `inflation_rate`: float (default 0.06)
  - `discount_rate`: float (default 0.075)
- **Response (`AssessmentResult`):**
  - `assessment_id`: UUID
  - `net_needs`: `{ income_replacement_pv, future_goals_pv, outstanding_liabilities, immediate_expenses, total_gross_need, eligible_assets_deducted, existing_cover_deducted, net_coverage_gap }`
  - `hlv`: `{ hlv_gross, earning_horizon_years, personal_consumption_ratio, hlv_net_gap }`
  - `recommendation_summary`: string

### `GET /assessments/{assessment_id}`
Retrieve a previously calculated assessment record.

---

## 2. Scenario Studio

### `POST /scenarios`
Run one-tap financial scenarios against an immutable baseline.
- **Request Body:**
  - `scenario`: `{ scenario_type, title, description, overrides }`
  - `baseline_input`: `AssessmentInput`
- **Supported Scenario Types:**
  - `another_child`: +1 dependent, ₹25L future college milestone, +15% living expenses.
  - `retire_55`: early retirement at 55, earning horizon compressed.
  - `income_down_20`: -20% annual income stress-test.
  - `loan_cleared`: liabilities zeroed out rupee-for-rupee.
  - `add_home_loan`: +₹50L fresh mortgage.
- **Response (`ScenarioComparisonResult`):**
  - `cover_difference`: float (delta shift in required cover)
  - `estimated_premium_difference`: float (delta shift in annual term premium)
  - `diffs`: list of audit trail variables modified
  - `explanation`: string

---

## 3. ML Recommendations

### `POST /recommendations`
Filter candidates through hard eligibility gates and rank using the supervised Scikit-Learn suitability classifier.
- **Request Body (`RecommendationRequest`):**
  - `age`, `annual_income`, `coverage_gap`, `dependents_count`, `desired_tenure_years`, `smoker_status`, `preferred_category`
- **Response (`RecommendationResponse`):**
  - `recommendations`: list of `{ rank, product, suitability_score, eligibility_status, estimated_annual_premium, grounded_explanation, pros, cons }`
  - `total_evaluated`: integer
  - `eligible_count`: integer

---

## 4. Policy X-Ray

### `POST /policies/analyse`
Deterministically parse policy schedule documents or excerpts.
- **Payload:** Multipart form file or `raw_text`
- **Response (`PolicyAnalysisResult`):**
  - `insurer`, `product_name`, `sum_assured`, `annual_premium`, `policy_term_years`
  - `citations`: list of `{ clause_title, extracted_text, page_reference, confidence_score }`
  - `key_benefits`, `exclusions`, `waiting_periods`, `critical_deadlines`, `suggested_questions_for_insurer`

---

## 5. Smart Tools & Advisory
- `POST /tools/survival-simulation`: Year-by-year cashflow simulation with depletion runway.
- `POST /tools/emi-calculator`: Amortization schedule and debt immunization shield.
- `POST /tools/future-costs`: Compound inflation projector.
- `POST /tools/protection-gap-radar`: 4-pillar health score.
- `POST /advisor-bookings`: Fiduciary advisor video scheduling.
- `POST /vault/upload`: AES-256 encrypted private document storage.
