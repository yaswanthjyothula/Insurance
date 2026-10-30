"""Trained product ranker (scikit-learn), trained on SYNTHETIC choices over the pack's 200 synthetic customers.

No real purchase history exists, so a simulated buyer with a stated priority picks the product that best matches
that priority (plus random noise). The model learns that behaviour. It is trained in memory at startup from fixed seeds:
nothing is saved to or loaded from disk, so there is no pickle file to trust. Its output is blended 50/50 with the
readable rule score and never overrides eligibility.
"""

import logging
import math
import random
import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.pack.loader import get_pack
from app.services import planning
from app.services.profiles import to_recommend_request

log = logging.getLogger("lifesure.ml")

PRIORITIES = ["balanced", "lowest_cost", "goal_savings", "growth"]
PRIORITY_LABELS = {
    "balanced": "Balanced",
    "lowest_cost": "Lowest cost",
    "goal_savings": "Fund my goals",
    "growth": "Long-term growth",
}
TYPES = ["Term Life", "Whole Life", "Endowment", "ULIP"]
RISK_VALUE = {"low": 0.0, "medium": 0.5, "high": 1.0}
FEATURE_NAMES = (
    planning.FACTORS
    + ["premium_to_income", "age", "log_cover_gap", "dependents", "smoker", "risk_appetite"]
    + [f"type_{t}" for t in TYPES]
    + [f"priority_{p}" for p in PRIORITIES]
)

# What each simulated buyer cares about. These are assumptions: the model can only learn them back.
PERSONA_WEIGHTS: Dict[str, Dict[str, float]] = {
    "balanced": dict(planning.BASE_WEIGHTS),
    "lowest_cost": {"protection": 0.30, "affordability": 0.50, "goal_fit": 0.05, "risk_fit": 0.05, "term_fit": 0.10},
    "goal_savings": {"protection": 0.20, "affordability": 0.15, "goal_fit": 0.45, "risk_fit": 0.10, "term_fit": 0.10},
    "growth": {"protection": 0.10, "affordability": 0.15, "goal_fit": 0.30, "risk_fit": 0.35, "term_fit": 0.10},
}
TRAIN_SHARE, SEED, NOISE, DRAWS = 0.8, 7, 0.04, 8  # DRAWS = simulated buyers per customer and priority
BLEND = 0.5


def persona_weights(priority: str, dependents: int, smoker: bool) -> Dict[str, float]:
    w = dict(PERSONA_WEIGHTS.get(priority, PERSONA_WEIGHTS["balanced"]))
    if dependents >= 3:
        w["protection"] += 0.08
    if smoker:
        w["affordability"] += 0.05
    total = sum(w.values())
    return {k: v / total for k, v in w.items()}


def vector(fit, ctx, priority: str) -> List[float]:
    scores = {f.key: f.score for f in fit.factors}
    app = ctx.req.applicant
    q = fit.quote
    ratio = min(0.5, q.total_annual_premium / app.annual_income) if q and app.annual_income else 0.5
    row = [scores[k] for k in planning.FACTORS]
    row += [
        ratio,
        app.age / 100.0,
        math.log10(max(ctx.gap, 1)) / 9.0,
        min(ctx.req.assessment.dependents_count, 6) / 6.0,
        1.0 if app.smoker else 0.0,
        RISK_VALUE[ctx.req.risk_appetite],
    ]
    row += [1.0 if fit.product_type == t else 0.0 for t in TYPES]
    row += [1.0 if priority == p else 0.0 for p in PRIORITIES]
    return row


@dataclass
class _Sample:
    X: List[List[float]]
    y: List[int]
    groups: List[int]
    rules: List[float]
    cleans: List[float]
    priorities: List[str]


def _simulate(profile_ids: List[str], rng: random.Random, offset: int = 0) -> _Sample:
    pack = get_pack()
    s = _Sample([], [], [], [], [], [])
    gid = offset
    for pid in profile_ids:
        for priority in PRIORITIES:
            req = to_recommend_request(pack.profiles[pid], priority=priority)
            ctx = planning.build_context(req)
            fits = [f for f in planning.evaluate_all(ctx) if f.eligible]
            if len(fits) < 3:
                continue
            w = persona_weights(priority, req.assessment.dependents_count, req.applicant.smoker)
            clean = [sum(w[f.key] * f.score for f in fit.factors) for fit in fits]
            vectors = [vector(fit, ctx, priority) for fit in fits]
            for _ in range(DRAWS):
                noisy = [c - NOISE * math.log(-math.log(max(1e-12, rng.random()))) for c in clean]
                best = max(range(len(fits)), key=lambda i: noisy[i])
                for i, fit in enumerate(fits):
                    s.X.append(vectors[i])
                    s.y.append(1 if i == best else 0)
                    s.groups.append(gid)
                    s.rules.append(fit.rule_percent / 100.0)
                    s.cleans.append(clean[i])
                    s.priorities.append(priority)
                gid += 1
    return s


def _hit_rates(scores: List[float], s: _Sample, priority: Optional[str] = None) -> Dict[str, float]:
    by: Dict[int, List[int]] = {}
    for i, g in enumerate(s.groups):
        by.setdefault(g, []).append(i)
    top1 = top3 = mrr = n = 0.0
    for idx in by.values():
        if priority and s.priorities[idx[0]] != priority:
            continue
        order = sorted(idx, key=lambda i: -scores[i])
        rank = order.index(next(i for i in idx if s.y[i] == 1)) + 1
        top1 += rank == 1
        top3 += rank <= 3
        mrr += 1.0 / rank
        n += 1
    return {"top1": round(top1 / n, 3), "top3": round(top3 / n, 3), "mrr": round(mrr / n, 3), "customers": int(n)} if n else {}


_state: Dict[str, Any] = {}


def _train() -> Dict[str, Any]:
    import numpy as np
    from sklearn.ensemble import HistGradientBoostingClassifier

    rng = random.Random(SEED)  # noqa: S311 - a simulation, not security
    ids = sorted(get_pack().profiles)
    rng.shuffle(ids)
    cut = int(len(ids) * TRAIN_SHARE)  # each customer appears in only one split, so there is no leakage
    train, test = _simulate(ids[:cut], rng), _simulate(ids[cut:], rng, offset=10_000)
    model = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08, max_depth=5, l2_regularization=1.0, random_state=SEED)
    model.fit(np.array(train.X), np.array(train.y))
    p = [float(v) for v in model.predict_proba(np.array(test.X))[:, 1]]
    rnd = random.Random(SEED)  # noqa: S311 - a simulation, not security
    rand = [rnd.random() for _ in p]

    def block(prio: Optional[str] = None):
        return {
            "model": _hit_rates(p, test, prio),
            "fixed_rule_baseline": _hit_rates(test.rules, test, prio),
            "ceiling_known_preferences": _hit_rates(test.cleans, test, prio),
            "random": _hit_rates(rand, test, prio),
        }

    metrics = {
        "model": "HistGradientBoostingClassifier (scikit-learn)",
        "training_customers": cut,
        "test_customers": len(ids) - cut,
        "training_rows": len(train.X),
        "seed": SEED,
        "evaluation": {"overall": block(), **{pr: block(pr) for pr in PRIORITIES}},
        "disclosure": [
            "Trained on SYNTHETIC choices, not real purchases. The customers are the pack's synthetic customers.",
            "A simulated buyer picks the product with the best priority-weighted score plus random noise. The model learns that rule back.",
            "Reaching the simulation's ceiling shows the method works. It does not show what real customers prefer.",
            "Only 14 products exist, so the model has seen a small range of product profiles.",
            "It never overrides eligibility. Its score is blended 50/50 with the readable rule score.",
        ],
    }
    return {"model": model, "metrics": metrics}


_train_lock = threading.Lock()


def get_model() -> Optional[Any]:
    if "model" not in _state:
        with _train_lock:  # the startup warm-up and a first request never train twice
            if "model" not in _state:
                try:
                    _state.update(_train())
                    log.info("Trained ranker on %d rows", _state["metrics"]["training_rows"])
                except Exception:  # scikit-learn missing or training failed: the API keeps working on rules alone
                    log.exception("Ranker unavailable, using rules only")
                    _state["model"], _state["metrics"] = None, {}
    return _state["model"]


def predict(vectors: List[List[float]]) -> Optional[List[float]]:
    model = get_model()
    if model is None or not vectors:
        return None
    return [float(p) for p in model.predict_proba(vectors)[:, 1]]


def model_info() -> Dict[str, Any]:
    get_model()
    return {
        "available": _state["model"] is not None,
        "priorities": [{"key": k, "label": PRIORITY_LABELS[k]} for k in PRIORITIES],
        **_state["metrics"],
    }
