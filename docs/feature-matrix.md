# LifeSure AI - Feature Matrix & Traceability Register

**Status Definitions:**
- `Implemented`: Backend + Frontend fully integrated with validated calculations/data.
- `In Progress`: Under active development in the current sprint.
- `Tested`: Verified with automated unit/integration tests.
- `Deferred`: Planned for future phases outside the primary release scope.

| Code | Category | Feature Name | Status | Backend Service / Module | Frontend Route | Test Coverage |
|------|----------|--------------|--------|--------------------------|----------------|---------------|
| CAT-01 | Insurance Categories | Life Insurance | Implemented | `app/services/catalog.py` | `/insurance/life` | Verified |
| CAT-02 | Insurance Categories | Term Insurance | Implemented | `app/services/catalog.py` | `/insurance/term` | Verified |
| CAT-03 | Insurance Categories | Health Insurance | Implemented | `app/services/catalog.py` | `/insurance/health` | Verified |
| CAT-04 | Insurance Categories | General Insurance | Implemented | `app/services/catalog.py` | `/insurance/general` | Verified |
| CAT-05 | Insurance Categories | Investment-Linked | Implemented | `app/services/catalog.py` | `/insurance/investment-linked` | Verified |
| CAT-06 | Insurance Categories | Business Insurance | Implemented | `app/services/catalog.py` | `/insurance/business` | Verified |
| CAT-07 | Insurance Categories | Other Insurance | Implemented | `app/services/catalog.py` | `/insurance/other` | Verified |
| TOOL-01 | Smart Tools | AI Life-Cover Calculator | Implemented | `app/services/financial_engine.py` | `/tools/life-cover-calculator` | Pytest + Vitest |
| TOOL-02 | Smart Tools | Scenario Studio | Implemented | `app/services/scenario_engine.py` | `/tools/scenario-studio` | Pytest |
| TOOL-03 | Smart Tools | Family Survival Simulator | Implemented | `app/services/survival_simulator.py` | `/tools/family-survival-simulator` | Pytest |
| TOOL-04 | Smart Tools | Policy X-Ray | Implemented | `app/services/policy_xray.py` | `/tools/policy-xray` | Unit Tests |
| TOOL-05 | Smart Tools | Premium & Affordability | Implemented | `app/services/affordability.py` | `/tools/affordability-calculator` | Unit Tests |
| TOOL-06 | Smart Tools | EMI Calculator | Implemented | `app/services/financial_engine.py` | `/tools/emi-calculator` | Unit Tests |
| TOOL-07 | Smart Tools | Policy Replacement Checker| Implemented | `app/services/policy_checker.py` | `/tools/policy-replacement` | Unit Tests |
| TOOL-08 | Smart Tools | Premium Shock Simulator | Implemented | `app/services/financial_engine.py` | `/tools/premium-shock` | Unit Tests |
| TOOL-09 | Smart Tools | Future Cost Reality Check | Implemented | `app/services/financial_engine.py` | `/tools/future-costs` | Unit Tests |
| TOOL-10 | Smart Tools | Protection Gap Radar | Implemented | `app/services/financial_engine.py` | `/tools/protection-gap` | Unit Tests |
| TOOL-11 | Smart Tools | Insurance Scam Shield | Implemented | `app/services/scam_shield.py` | `/tools/scam-shield` | Unit Tests |
| TOOL-12 | Smart Tools | Application Readiness | Implemented | `app/services/readiness.py` | `/tools/application-readiness` | Unit Tests |
| RES-01 | Resources | Insurance Learning Centre | Implemented | `app/services/resources.py` | `/resources/learning-centre` | Verified |
| RES-02 | Resources | Insurance Glossary | Implemented | `app/services/resources.py` | `/resources/glossary` | Search Tests |
| RES-03 | Resources | Insurer Directory | Implemented | `app/services/resources.py` | `/resources/insurance-companies` | Verified |
| RES-04 | Resources | Customer Reviews | Implemented | `app/services/resources.py` | `/resources/reviews` | Verified |
| RES-05 | Resources | Protection Guides | Implemented | `app/services/resources.py` | `/resources/guides` | Verified |
| RES-06 | Resources | Claim Companion | Implemented | `app/services/resources.py` | `/resources/claims` | Verified |
| ADV-01 | Advisory | My Protection Passport | Implemented | `app/api/v1/endpoints/passport.py` | `/dashboard/protection-passport` | Integration |
| ADV-02 | Advisory | My Recommendations | Implemented | `app/services/ml_recommender.py` | `/dashboard/recommendations` | Model Metrics |
| ADV-03 | Advisory | Saved Scenarios | Implemented | `app/api/v1/endpoints/scenarios.py` | `/dashboard/saved-scenarios` | Integration |
| ADV-04 | Advisory | Book an Advisor | Implemented | `app/api/v1/endpoints/advisors.py` | `/dashboard/appointments` | Integration |
| ADV-05 | Advisory | Insurance Safety Net | Implemented | `app/api/v1/endpoints/policies.py` | `/dashboard/policies` | Integration |
| ADV-06 | Advisory | Emergency Insurance Vault | Implemented | `app/api/v1/endpoints/vault.py` | `/dashboard/insurance-vault` | Security tested |
| ADV-07 | Advisory | Protection Health Check | Implemented | `app/services/financial_engine.py` | `/dashboard/protection-health-check`| Unit Tests |
| ADV-08 | Advisory | Family Dependency Mapper | Implemented | `app/services/family_mapper.py` | `/dashboard/family-dependencies`| Visual tests |
| ADV-09 | Advisory | Explainable AI Recommendations| Implemented | `app/services/ml_recommender.py` | `/tools/life-cover-calculator` | Grounding check |
