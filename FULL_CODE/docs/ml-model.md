# Product ranking model

**What it is.** A scikit-learn `HistGradientBoostingClassifier` that scores every eligible Saffron Life product for a customer and a stated priority (balanced, lowest cost, fund my goals, long-term growth). The final match is 50% the readable rule score and 50% the model's fit. Eligibility rules always run first and the model never overrides them.

**Where.** `backend/app/ml/ranker.py` (data simulation, training, evaluation and serving) and `backend/app/services/recommendation.py` (the blend). `GET /api/v1/recommendations/model-info` returns the metrics and the disclosure. The model is trained in memory when the server first needs it (about 2 seconds, fixed seed). Nothing is saved to or loaded from disk, so there is no pickle file to trust.

**Training data is synthetic.** There is no real purchase history. For each of the pack's 200 synthetic customers and each priority, the product scores come from the same code the app uses. A simulated buyer then picks the product with the best priority-weighted score plus random noise (8 draws each). Customers are split 160 / 40 before simulation, so no customer is in both train and test.

**Results on held-out customers (top-1 pick):** model 0.41, fixed rule 0.39, ceiling given the noise 0.44, random 0.09. The gain is largest when the priority is "fund my goals" (0.40 vs 0.31) or "growth" (0.33 vs 0.28), and about zero for "balanced" and "lowest cost", where the fixed rule already matches the simulated buyer.

**Limits.**
- It learns the preferences written into the simulation, not what real customers want. Reaching the ceiling shows the method works, not that the preferences are right.
- Only 14 products exist, so it has seen a narrow range of product profiles.
- Next step: replace the simulation with real choices (which plans customers keep) and retrain.
