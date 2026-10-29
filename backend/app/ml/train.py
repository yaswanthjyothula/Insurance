"""Train the plan ranker on synthetic households.

Run:  PYTHONPATH=backend python -m app.ml.train

HOW THE DATA IS MADE (and why it is synthetic):
We have no real purchase history. So we simulate households (age, income, cover gap, dependents, smoker, term)
and a stated priority. For each household we score the real catalogue plans with the same code the app uses,
add small random noise to the plan scores, and let a simulated buyer choose the plan with the highest
weighted utility (weights depend on the priority, see ranker.PERSONA_WEIGHTS) plus random choice noise.
The model is then trained to predict which plan gets chosen. Its quality is measured on households it never saw.

WHAT THAT MEANS: the model learns the preferences we put into the simulation. It shows the method works and lets
the ranking respond to a user's priority. It does NOT show what real customers want.
"""
import json
import math
import random
from datetime import datetime, timezone
from typing import List

from app.ml import ranker as R


def _make_users(n: int, rng: random.Random):
    for _ in range(n):
        age = rng.randint(21, 62)
        income = math.exp(rng.gauss(math.log(1_400_000), 0.6))
        income = max(300_000.0, min(income, 20_000_000.0))
        gap = max(500_000.0, min(income * rng.uniform(3, 14), 100_000_000.0))
        yield {
            "age": age, "income": income, "gap": gap, "dependents": rng.choice([0, 1, 1, 2, 2, 3, 4]),
            "smoker": rng.random() < 0.18, "tenure": rng.choice([10, 15, 20, 25, 30, 35]),
            "priority": rng.choice(R.PRIORITIES),
        }


def _rows_for_user(u, plans, rng: random.Random, jitter: float):
    from app.schemas.products import RecommendationRequest
    from app.services.matching import plan_matcher
    req = RecommendationRequest(age=u["age"], annual_income=u["income"], coverage_gap=u["gap"], dependents_count=u["dependents"],
                                desired_tenure_years=u["tenure"], smoker_status=u["smoker"], priority=u["priority"])
    budget = (u["income"] / 12.0) * 0.05
    w = R.persona_weights(u["priority"], u["dependents"], u["smoker"])
    out = []
    for p in plans:
        ok, _ = plan_matcher.eligibility(p, req)
        if not ok or p.min_entry_age is None or p.max_entry_age is None:
            continue
        _, _, annual, _, scored = plan_matcher.score_plan(p, req, budget)
        s = {k: min(1.0, max(0.0, v[0] + rng.gauss(0, jitter))) for k, v in scored.items()}
        clean = sum(w[k] * s[k] for k in R.FACTORS)
        # Gumbel noise models how real choices are not perfectly rational
        util = clean - 0.04 * math.log(-math.log(max(1e-12, rng.random())))
        vec = R.build_vector(s, annual, u["income"], u["age"], u["gap"], u["dependents"], u["smoker"], u["tenure"], u["priority"])
        rule = sum(R.PERSONA_WEIGHTS["balanced"][k] * s[k] for k in R.FACTORS)
        out.append((vec, util, rule, clean))
    return out


def _dataset(users, plans, rng, jitter):
    X, y, groups, rules, prios, cleans = [], [], [], [], [], []
    for gi, u in enumerate(users):
        rows = _rows_for_user(u, plans, rng, jitter)
        if len(rows) < 3:
            continue
        best = max(range(len(rows)), key=lambda i: rows[i][1])
        for i, (vec, _, rule, clean) in enumerate(rows):
            X.append(vec); y.append(1 if i == best else 0); groups.append(gi); rules.append(rule); prios.append(u["priority"]); cleans.append(clean)
    return X, y, groups, rules, prios, cleans


def _eval(model, X, y, groups, rules, prios, cleans):
    import numpy as np
    p = model.predict_proba(np.array(X))[:, 1]
    by = {}
    for i, g in enumerate(groups):
        by.setdefault(g, []).append(i)
    def run(scorer, label_filter=None):
        top1 = top3 = mrr = n = 0.0
        for g, idx in by.items():
            if label_filter and prios[idx[0]] != label_filter:
                continue
            order = sorted(idx, key=lambda i: -scorer[i])
            chosen = [i for i in idx if y[i] == 1][0]
            rank = order.index(chosen) + 1
            top1 += rank == 1; top3 += rank <= 3; mrr += 1.0 / rank; n += 1
        return {"top1": round(top1 / n, 3), "top3": round(top3 / n, 3), "mrr": round(mrr / n, 3), "households": int(n)}
    rnd = [random.random() for _ in X]
    def block(f=None):
        return {"model": run(p, f), "fixed_rule_baseline": run(rules, f), "ceiling_known_preferences": run(cleans, f), "random": run(rnd, f)}
    res = {"overall": block()}
    for pr in R.PRIORITIES:
        res[pr] = block(pr)
    return res


def train(n_train: int = 5000, n_test: int = 1500, seed: int = 7) -> dict:
    import joblib
    import numpy as np
    import sklearn
    from sklearn.ensemble import HistGradientBoostingClassifier
    from sklearn.inspection import permutation_importance
    from app.services.catalog import get_products_by_category

    rng = random.Random(seed)
    plans = get_products_by_category("term")
    users = list(_make_users(n_train + n_test, rng))
    Xtr, ytr, gtr, _, _, _ = _dataset(users[:n_train], plans, rng, 0.04)
    Xte, yte, gte, rte, pte, cte = _dataset(users[n_train:], plans, rng, 0.04)

    model = HistGradientBoostingClassifier(max_iter=220, learning_rate=0.07, max_depth=4, l2_regularization=1.0, random_state=seed)
    model.fit(np.array(Xtr), np.array(ytr))

    metrics = _eval(model, Xte, yte, gte, rte, pte, cte)
    sample = rng.sample(range(len(Xte)), min(4000, len(Xte)))
    imp = permutation_importance(model, np.array([Xte[i] for i in sample]), np.array([yte[i] for i in sample]), n_repeats=3, random_state=seed, scoring="neg_log_loss")
    importances = sorted(({"feature": n, "importance": round(float(v), 4)} for n, v in zip(R.FEATURE_NAMES, imp.importances_mean)), key=lambda d: -d["importance"])

    import os
    os.makedirs(R.ARTIFACT_DIR, exist_ok=True)
    joblib.dump(model, R.MODEL_PATH)
    out = {
        "model": "HistGradientBoostingClassifier (scikit-learn %s)" % sklearn.__version__,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "training_households": n_train, "test_households": n_test, "training_rows": len(Xtr), "seed": seed,
        "plans_in_simulation": len(plans),
        "evaluation": metrics,
        "feature_importance": importances[:10],
        "disclosure": [
            "Trained on SYNTHETIC households, not real customers or purchases.",
            "A simulated buyer picks the plan with the highest weighted score for their stated priority, plus random noise. The model learns that rule back.",
            "Reaching the simulation's ceiling shows the method works. It does not show what real customers prefer.",
            "The same 16 real plans are used for training and serving, with small random noise on their scores. It cannot be assumed to generalise to unseen plans.",
            "The model never overrides eligibility. Entry-age rules are applied first, and its output is blended 50/50 with the transparent rule score.",
        ],
    }
    with open(R.METRICS_PATH, "w") as fh:
        json.dump(out, fh, indent=2)
    return out


if __name__ == "__main__":
    m = train()
    print(json.dumps({k: m[k] for k in ("model", "training_rows")}, indent=2))
    for k, v in m["evaluation"].items():
        print(f"{k:<18} top1: model {v['model']['top1']:.2f} | fixed rule {v['fixed_rule_baseline']['top1']:.2f} | ceiling {v['ceiling_known_preferences']['top1']:.2f} | random {v['random']['top1']:.2f}   top3: model {v['model']['top3']:.2f} rule {v['fixed_rule_baseline']['top3']:.2f}")
