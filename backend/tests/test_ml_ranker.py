from fastapi.testclient import TestClient

from app.main import app
from app.ml import ranker as R

client = TestClient(app)
BASE = {"age": 32, "annual_income": 1800000, "coverage_gap": 12400000, "dependents_count": 2,
        "desired_tenure_years": 28, "smoker_status": False, "preferred_category": "term"}


def rec(priority):
    r = client.post("/api/v1/recommendations", json={**BASE, "priority": priority})
    assert r.status_code == 200
    return r.json()


def test_model_is_used_and_disclosed():
    d = rec("balanced")
    assert d["ranking_method"] == "rules+trained-model"
    assert "synthetic" in d["methodology_note"].lower()
    top = d["recommendations"][0]
    assert top["model_percent"] is not None and 0 <= top["model_percent"] <= 100
    # final score is the 50/50 blend of rule score and model fit
    assert abs(top["match_percent"] - round(0.5 * top["rule_percent"] + 0.5 * top["model_percent"])) <= 1


def test_priority_changes_ranking():
    a = [r["product"]["id"] for r in rec("most_features")["recommendations"]]
    b = [r["product"]["id"] for r in rec("strongest_insurer")["recommendations"]]
    assert a != b


def test_eligibility_still_overrides_model():
    d = client.post("/api/v1/recommendations", json={**BASE, "age": 60, "priority": "most_features"}).json()
    order = [r["eligibility_status"] for r in d["recommendations"]]
    first_bad = next((i for i, s in enumerate(order) if s != "eligible"), len(order))
    assert all(s != "eligible" for s in order[first_bad:])  # eligible plans always come first


def test_model_info_reports_limits_and_beats_random():
    info = client.get("/api/v1/recommendations/model-info").json()
    assert info["available"] is True
    assert any("SYNTHETIC" in line for line in info["disclosure"])
    ev = info["evaluation"]["overall"]
    assert ev["model"]["top1"] > 3 * ev["random"]["top1"]
    assert ev["model"]["top1"] >= ev["fixed_rule_baseline"]["top1"]


def test_persona_weights_sum_to_one():
    for p in R.PRIORITIES:
        assert abs(sum(R.persona_weights(p, 3, True).values()) - 1.0) < 1e-9
