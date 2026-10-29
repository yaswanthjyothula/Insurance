# Plan ranking model

**What it is.** A scikit-learn `HistGradientBoostingClassifier` that scores each eligible plan for a user's profile and stated priority (balanced, lowest cost, strongest insurer, most features). The final match is 50% the transparent rule score and 50% the model's fit. Entry-age eligibility is always applied first and the model never overrides it.

**Where.** `backend/app/ml/` (`train.py` builds the data and trains, `ranker.py` serves), used in `backend/app/services/matching.py`. `GET /api/v1/recommendations/model-info` returns its metrics and disclosure. The trained file is rebuilt automatically on first run, or with `PYTHONPATH=backend python -m app.ml.train`. `backend/model_artifacts/metrics.json` holds the latest evaluation.

**Training data is synthetic.** We have no real purchase history. 5,000 simulated households are scored against the real catalogue plans (with small random noise). A simulated buyer chooses the plan with the highest priority-weighted score plus random choice noise. The model learns to predict that choice.

**Results (held-out synthetic households, top-1 pick).** Model 0.33, fixed rule 0.26, random 0.07, ceiling given the simulation noise 0.33. By priority the model matches or beats the fixed rule, with the biggest gain for "most features" (0.42 vs 0.20). See `metrics.json` for all figures.

**Limits (also shown in the app).**
- It learns the preferences written into the simulation, not what real customers want. Matching the ceiling shows the method works, not that the preferences are right.
- The same 16 plans are used for training and serving, so it cannot be assumed to generalise to unseen plans.
- Premium estimates have the same shape for every plan, so "lowest cost" separates plans only a little.
- Next step: replace the simulation with real choices (which plans users select or compare) and retrain.
