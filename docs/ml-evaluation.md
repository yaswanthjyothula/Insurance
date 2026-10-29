# LifeSure AI - Machine Learning Recommendation Engine Specification & Evaluation

## 1. System Role & Boundaries
The LifeSure AI Machine Learning model is dedicated strictly to **Product Candidate Ranking and Suitability Scoring**.
- **Financial gap calculation is decoupled:** It is computed by the deterministic financial engine.
- **Hard Eligibility Rule Filter:** Pre-filters out insurance products for which the user does not qualify (e.g. entry age out of bounds, annual income below minimum criteria, term length unachievable).
- **Ranking Model:** Scores eligible product candidates based on user risk profile, term preference, affordability budget ratio, claim settlement preference, and feature affinity.

## 2. Model Architecture
- **Algorithm:** Scikit-learn GradientBoostingClassifier / RandomForestClassifier with pipeline preprocessing (StandardScaler, OneHotEncoder).
- **Inputs (Customer Features):**
  - `age`: integer (18–65)
  - `annual_income`: float (₹)
  - `dependents_count`: integer (0–6)
  - `liabilities`: float (₹)
  - `existing_cover`: float (₹)
  - `coverage_gap`: float (₹)
  - `budget_monthly`: float (₹)
  - `protection_horizon_years`: integer (5–45)
  - `smoker_status`: boolean
  - `preferred_benefit`: categorical ('critical_illness', 'accidental_rider', 'return_of_premium', 'pure_protection')
- **Product Candidate Features:**
  - `category`: categorical ('term', 'life', 'health', 'investment_linked', 'business')
  - `min_entry_age`, `max_entry_age`: integers
  - `min_annual_income`: float
  - `claim_settlement_ratio`: float (e.g. 98.4%)
  - `solvency_ratio`: float (e.g. 1.85)
  - `premium_cost_index`: float
  - `feature_set`: binary encoded flags
- **Ground Truth & Synthetic Training Data:**
  - Generated using real-world underwriting rules mapped to 1,500 diverse demographic profiles.
  - Transparently disclosed as synthetic training data with zero fabricated claims.

## 3. Evaluation Metrics
- **Suitability Accuracy:** Precision@K ($K=3$) $\ge 0.88$
- **Recall@K:** $\ge 0.85$
- **NDCG@3:** $\ge 0.90$
- **Grounded Explanation:** Feature importance contributions extracted via tree SHAP/MDI heuristics for transparent user explanation.
