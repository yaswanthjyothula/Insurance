"""Trained plan ranker (scikit-learn).

The model learns which plans people with a given profile and priority tend to pick, from SYNTHETIC data
(see train.py). It is blended with the transparent rule score, never used alone. Its limits are published
with every result: it was not trained on real purchases, so it reproduces the assumptions in the simulation.
"""
import json
import logging
import os
from typing import Dict, List, Optional

ARTIFACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "model_artifacts"))
MODEL_PATH = os.path.join(ARTIFACT_DIR, "ranker.joblib")
METRICS_PATH = os.path.join(ARTIFACT_DIR, "metrics.json")

PRIORITIES = ["balanced", "lowest_cost", "strongest_insurer", "most_features"]
PRIORITY_LABELS = {
    "balanced": "Balanced",
    "lowest_cost": "Lowest cost",
    "strongest_insurer": "Strongest insurer",
    "most_features": "Most features",
}
FACTORS = ["claims", "strength", "cover_fit", "affordability", "features"]
FEATURE_NAMES = FACTORS + [
    "premium_to_income", "age", "log_cover_gap", "dependents", "smoker", "tenure",
] + [f"priority_{p}" for p in PRIORITIES]

# What each persona cares about in the simulation. These are assumptions, and the model can only learn them back.
PERSONA_WEIGHTS: Dict[str, Dict[str, float]] = {
    "balanced":          {"claims": 0.30, "strength": 0.15, "cover_fit": 0.25, "affordability": 0.15, "features": 0.15},
    "lowest_cost":       {"claims": 0.15, "strength": 0.05, "cover_fit": 0.25, "affordability": 0.45, "features": 0.10},
    "strongest_insurer": {"claims": 0.40, "strength": 0.30, "cover_fit": 0.15, "affordability": 0.05, "features": 0.10},
    "most_features":     {"claims": 0.15, "strength": 0.05, "cover_fit": 0.20, "affordability": 0.10, "features": 0.50},
}

log = logging.getLogger("lifesure.ml")
_model = None
_loaded = False


def persona_weights(priority: str, dependents: int, smoker: bool) -> Dict[str, float]:
    """Persona weights, nudged by the household: more dependents care more about claims, smokers feel price more."""
    w = dict(PERSONA_WEIGHTS.get(priority, PERSONA_WEIGHTS["balanced"]))
    if dependents >= 3:
        w["claims"] += 0.08
        w["strength"] += 0.04
    if smoker:
        w["affordability"] += 0.08
    total = sum(w.values())
    return {k: v / total for k, v in w.items()}


def build_vector(scores: Dict[str, float], annual_premium: float, annual_income: float, age: int,
                 coverage_gap: float, dependents: int, smoker: bool, tenure: int, priority: str) -> List[float]:
    import math
    ratio = min(0.3, annual_premium / annual_income) if annual_income > 0 else 0.3
    row = [float(scores[f]) for f in FACTORS]
    row += [ratio, age / 100.0, math.log10(max(coverage_gap, 1.0)) / 8.0, min(dependents, 6) / 6.0, 1.0 if smoker else 0.0, tenure / 50.0]
    row += [1.0 if priority == p else 0.0 for p in PRIORITIES]
    return row


def get_model():
    """Load the trained model, training it first (a few seconds) if no artifact exists yet. None if scikit-learn is missing."""
    global _model, _loaded
    if _loaded:
        return _model
    _loaded = True
    try:
        import joblib
        if not os.path.exists(MODEL_PATH):
            from app.ml.train import train
            log.info("No trained ranker found, training one on synthetic data")
            train()
        _model = joblib.load(MODEL_PATH)
    except Exception as exc:  # scikit-learn missing or artifact unreadable: fall back to rules only
        log.warning("Trained ranker unavailable, using rules only: %s", exc)
        _model = None
    return _model


def predict(vectors: List[List[float]]) -> Optional[List[float]]:
    model = get_model()
    if model is None or not vectors:
        return None
    return [float(p) for p in model.predict_proba(vectors)[:, 1]]


def model_info() -> dict:
    info = {"available": get_model() is not None, "priorities": [{"key": k, "label": PRIORITY_LABELS[k]} for k in PRIORITIES]}
    try:
        with open(METRICS_PATH) as fh:
            info.update(json.load(fh))
    except Exception:
        pass
    return info
