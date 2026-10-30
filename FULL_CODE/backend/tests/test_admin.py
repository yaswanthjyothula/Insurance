"""The admin console: live configuration, hot reload into the real engines, safety, and the two Stage 2 scenarios."""

import json
import threading
import time

import pytest

from app.admin import analytics
from app.admin.config_store import config_store
from app.pack.loader import get_base_pack
from app.schemas.quote import Applicant, QuoteRequest
from app.services import premium
from app.services.storage import storage_service

API = "/api/v1"
TERM = "PRD-X4CBUF"  # the pack's plain level term plan


@pytest.fixture()
def admin(client):
    token = client.post(f"{API}/auth/demo/admin").json()["token"]
    return {"Authorization": f"Bearer {token}"}


def get_config(client, admin):
    return client.get(f"{API}/admin/config", headers=admin).json()


def product_of(cfg, pid=TERM):
    return next(p for p in cfg["products"] if p["product_id"] == pid)


def quote_body(sa=10_000_000, term=30, age=30, gender="male", smoker=False, product=TERM, income=2_000_000):
    return {
        "product_id": product,
        "applicant": {"age": age, "gender": gender, "smoker": smoker, "annual_income": income},
        "sum_assured": sa,
        "policy_term_years": term,
        "payment_option": "regular",
        "mode": "monthly",
    }


def quote(client, **kw):
    r = client.post(f"{API}/quotes", json=quote_body(**kw))
    assert r.status_code == 200
    return r.json()


def put(client, admin, body, **params):
    return client.put(f"{API}/admin/config", headers=admin, json=body, params=params)


def edit(client, admin, pid, body):
    return client.put(f"{API}/admin/products/{pid}", headers=admin, json=body)


BASE_ASSESSMENT = {
    "age": 32,
    "annual_income": 1_800_000,
    "annual_expenses": 720_000,
    "dependents_count": 2,
    "outstanding_liabilities": 4_000_000,
    "existing_cover": 0,
    "eligible_assets": 500_000,
}


def recommend_body(**applicant):
    return {
        "assessment": BASE_ASSESSMENT,
        "applicant": {"age": 32, "gender": "male", "smoker": False, "annual_income": 1_800_000, **applicant},
        "monthly_budget": 8000,
    }


# ---- configuration: read, update, reject ----


def test_get_current_configuration(client, admin):
    cfg = get_config(client, admin)
    pack = get_base_pack()
    assert cfg["version"] >= 1 and cfg["updated_at"] and len(cfg["products"]) == len(pack.products) == 14
    assert cfg["needs"]["inflation_rate"] == pack.assumptions.general_inflation_pct_pa
    assert cfg["needs"]["income_replacement_multiple_min"] == 10 and cfg["needs"]["income_replacement_multiple_max"] == 15
    assert all(p["active"] for p in cfg["products"])
    term = product_of(cfg)
    assert term["base_rate_per_1000"] == term["reference_rate_per_1000"] and term["category"] == "Term Life"
    assert {r["rider_id"] for r in cfg["available_riders"]}
    ulip = next(p for p in cfg["products"] if p["category"] == "ULIP")
    assert ulip["base_rate_per_1000"] is None


def test_valid_update_creates_a_new_version(client, admin):
    before = get_config(client, admin)["version"]
    r = put(client, admin, {"needs": {"inflation_rate": 8.5, "emergency_fund_months": 9}, "note": "stress test"})
    assert r.status_code == 200
    body = r.json()
    assert body["version"] == before + 1 and set(body["changed_fields"]) == {"needs.inflation_rate", "needs.emergency_fund_months"}
    assert body["config"]["needs"]["inflation_rate"] == 8.5
    assert get_config(client, admin)["version"] == before + 1
    entry = client.get(f"{API}/admin/config/history", headers=admin).json()[0]
    assert entry["version"] == before + 1 and entry["summary"] == "stress test" and entry["actor"]


@pytest.mark.parametrize(
    "body",
    [
        {"needs": {"income_replacement_multiple_min": 20, "income_replacement_multiple_max": 12}},
        {"needs": {"inflation_rate": 40}},
        {"needs": {"emergency_fund_months": -1}},
        {"needs": {"made_up_field": 1}},
        {"underwriting": {"non_medical_sum_assured_limit": 90_000_000}},  # above the tele-medical threshold
        {"underwriting": {"stp_maximum_sum_assured": 60_000_000}},
        {"products": [{"product_id": TERM, "base_rate_per_1000": 0}]},
        {"products": [{"product_id": TERM, "base_rate_per_1000": -3}]},
        {"products": [{"product_id": TERM, "minimum_entry_age": 60, "maximum_entry_age": 40}]},
        {"products": [{"product_id": TERM, "minimum_entry_age": 40, "maximum_entry_age": 40}]},
        {"products": [{"product_id": TERM, "minimum_tenure": 30, "maximum_tenure": 10}]},
        {"products": [{"product_id": TERM, "minimum_sum_assured": 90_000_000, "maximum_sum_assured": 1_000_000}]},
        {"products": [{"product_id": TERM, "smoker_loading_percentage": 400}]},
        {"products": [{"product_id": TERM, "allowed_riders": ["RDR-NOPE"]}]},
        {"products": [{"product_id": "PRD-NOPE00", "active": False}]},
    ],
)
def test_invalid_configuration_is_rejected_and_changes_nothing(client, admin, body):
    before = get_config(client, admin)
    r = put(client, admin, body)
    assert r.status_code == 422
    assert get_config(client, admin) == before
    assert quote(client)["config_version"] == before["version"]


def test_a_failed_save_leaves_the_previous_configuration_active(client, admin, monkeypatch):
    before = get_config(client, admin)

    def boom(doc):
        raise OSError("disk full")

    monkeypatch.setattr(storage_service, "save_admin_config", boom)
    r = put(client, admin, {"needs": {"inflation_rate": 9}})
    assert r.status_code == 503 and "nothing was changed" in r.json()["detail"]
    monkeypatch.undo()
    assert get_config(client, admin) == before


def test_a_stale_editor_cannot_silently_overwrite_a_newer_version(client, admin):
    v = get_config(client, admin)["version"]
    assert put(client, admin, {"needs": {"inflation_rate": 7}}, expected_version=v).status_code == 200
    stale = put(client, admin, {"needs": {"inflation_rate": 9}, "expected_version": v})
    assert stale.status_code == 409 and "now active" in stale.json()["detail"]
    assert get_config(client, admin)["needs"]["inflation_rate"] == 7


# ---- products ----


NEW_PRODUCT = {
    "product_id": "PRD-DEMO01",
    "product_name": "Saffron Demo Term",
    "category": "Term Life",
    "minimum_entry_age": 21,
    "maximum_entry_age": 55,
    "minimum_maturity_age": 31,
    "maximum_maturity_age": 70,
    "minimum_tenure": 10,
    "maximum_tenure": 35,
    "minimum_sum_assured": 2_500_000,
    "maximum_sum_assured": 100_000_000,
    "base_rate_per_1000": 0.8,
    "smoker_loading_percentage": 25,
    "gender_discount_factors": {"male": 1.0, "female": 0.9},
    "allowed_riders": [],
}


def test_a_new_product_can_be_added_and_is_priced_immediately(client, admin):
    r = client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT)
    assert r.status_code == 201 and product_of(r.json()["config"], "PRD-DEMO01")["custom"] is True
    q = quote(client, product="PRD-DEMO01", sa=10_000_000, term=20, age=30)
    assert q["valid"] and q["rate_per_1000"] == pytest.approx(0.8)
    assert q["base_annual_premium"] == pytest.approx(0.8 * 10_000)
    smoker = quote(client, product="PRD-DEMO01", sa=10_000_000, term=20, age=30, smoker=True)
    female = quote(client, product="PRD-DEMO01", sa=10_000_000, term=20, age=30, gender="female")
    older = quote(client, product="PRD-DEMO01", sa=10_000_000, term=20, age=40)
    assert smoker["rate_per_1000"] == pytest.approx(1.0) and female["rate_per_1000"] == pytest.approx(0.72) and older["rate_per_1000"] > 0.8
    assert "PRD-DEMO01" in {p["product_id"] for p in client.post(f"{API}/recommendations", json=recommend_body()).json()["products"]}


def test_product_creation_is_validated(client, admin):
    assert client.post(f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "base_rate_per_1000": 0}).status_code == 422
    assert client.post(f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "product_id": "bad id"}).status_code == 422
    assert client.post(f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "minimum_entry_age": 60}).status_code == 422
    assert (
        client.post(
            f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "category": "ULIP", "base_rate_per_1000": None}
        ).status_code
        == 422
    )
    assert client.post(f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "product_id": TERM}).status_code == 422
    assert client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT).status_code == 201
    assert client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT).status_code == 422  # duplicate id
    assert (
        client.post(
            f"{API}/admin/products", headers=admin, json={**NEW_PRODUCT, "product_id": "PRD-DEMO02", "allowed_riders": ["RDR-NOPE"]}
        ).status_code
        == 422
    )


def test_only_admin_created_products_can_be_deleted(client, admin):
    client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT)
    assert client.delete(f"{API}/admin/products/{TERM}", headers=admin).status_code == 422
    assert client.delete(f"{API}/admin/products/PRD-NOPE00", headers=admin).status_code == 404
    assert client.delete(f"{API}/admin/products/PRD-DEMO01", headers=admin).status_code == 200
    assert not any(p["product_id"] == "PRD-DEMO01" for p in get_config(client, admin)["products"])


def test_a_product_in_a_customers_saved_plan_cannot_be_deleted(client, admin, auth_headers):
    client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT)
    client.put(f"{API}/my-plan", headers=auth_headers, json={"plan": {"items": [{"product_id": "PRD-DEMO01"}], "total_cover": 1}})
    r = client.delete(f"{API}/admin/products/PRD-DEMO01", headers=admin)
    assert r.status_code == 409 and "Deactivate" in r.json()["detail"]
    client.delete(f"{API}/my-plan/choice", headers=auth_headers)


# ---- the engines follow the configuration, with no restart ----


def test_a_new_base_rate_changes_the_very_next_quote(client, admin):
    before = quote(client)
    base_rate = product_of(get_config(client, admin))["base_rate_per_1000"]
    r = edit(client, admin, TERM, {"base_rate_per_1000": base_rate * 2})
    assert r.status_code == 200
    after = quote(client)
    assert after["config_version"] == r.json()["version"] > before["config_version"]
    assert after["rate_per_1000"] == pytest.approx(before["rate_per_1000"] * 2, rel=1e-6)
    assert after["base_annual_premium"] == pytest.approx(before["base_annual_premium"] * 2, rel=1e-4)
    assert after["total_instalment"] in (
        before["total_instalment"] * 2,
        before["total_instalment"] * 2 + 1,
        before["total_instalment"] * 2 - 1,
    )


def test_smoker_loading_and_gender_factor_apply_on_top_of_the_rate_table(client, admin):
    smoker, female = quote(client, smoker=True), quote(client, gender="female")
    edit(client, admin, TERM, {"smoker_loading_percentage": 50, "gender_discount_factors": {"female": 0.8}})
    assert quote(client, smoker=True)["rate_per_1000"] == pytest.approx(smoker["rate_per_1000"] * 1.5, rel=1e-6)
    assert quote(client, gender="female")["rate_per_1000"] == pytest.approx(female["rate_per_1000"] * 0.8, rel=1e-6)
    assert quote(client)["rate_per_1000"] == pytest.approx(quote(client, gender="male")["rate_per_1000"])


def test_deactivating_a_product_removes_it_from_quotes_and_recommendations(client, admin):
    assert TERM in {p["product_id"] for p in client.post(f"{API}/recommendations", json=recommend_body()).json()["products"]}
    edit(client, admin, TERM, {"active": False})
    off = quote(client)
    assert not off["valid"] and any("not currently offered" in i for i in off["issues"])
    recs = client.post(f"{API}/recommendations", json=recommend_body()).json()
    assert TERM not in {p["product_id"] for p in recs["products"]} and TERM not in {i["product_id"] for i in recs["basket"]["items"]}
    assert TERM not in {p["product_id"] for p in client.get(f"{API}/pack/products").json()}
    edit(client, admin, TERM, {"active": True})
    assert quote(client)["valid"]


def test_maximum_entry_age_is_enforced_at_once(client, admin):
    assert quote(client, age=45)["valid"]
    edit(client, admin, TERM, {"maximum_entry_age": 40})
    q = quote(client, age=45)
    assert not q["valid"] and any("Entry age must be" in i for i in q["issues"])
    assert quote(client, age=40)["valid"]


def test_maximum_income_multiple_caps_cover(client, admin):
    assert quote(client, sa=40_000_000, income=2_000_000)["max_sum_assured_for_applicant"] >= 40_000_000
    edit(client, admin, TERM, {"maximum_income_multiple": 5})
    q = quote(client, sa=40_000_000, income=2_000_000)
    assert q["max_sum_assured_for_applicant"] == 10_000_000
    fit = next(p for p in client.post(f"{API}/recommendations", json=recommend_body()).json()["products"] if p["product_id"] == TERM)
    assert fit["eligible"] and fit["quote"]["sum_assured"] <= 1_800_000 * 5
    edit(client, admin, TERM, {"clear_income_multiple": True})
    assert quote(client, sa=40_000_000, income=2_000_000)["max_sum_assured_for_applicant"] >= 40_000_000


def test_sum_assured_limits_and_tenure_follow_the_configuration(client, admin):
    assert quote(client, sa=20_000_000, term=30)["valid"]
    edit(client, admin, TERM, {"maximum_sum_assured": 10_000_000, "maximum_tenure": 25})
    over = quote(client, sa=20_000_000, term=20)
    assert not over["valid"] and any("Sum assured must be between" in i for i in over["issues"])
    long = quote(client, sa=10_000_000, term=30)
    assert not long["valid"] and any("not offered" in i for i in long["issues"])
    assert 30 not in quote(client, sa=10_000_000, term=20)["allowed_terms"]


def test_underwriting_thresholds_decide_the_route(client, admin):
    assert quote(client, sa=10_000_000, age=30)["underwriting"]["route"] == "non_medical"
    assert quote(client, sa=5_000_000, age=30)["underwriting"]["stp_eligible"] is True
    assert quote(client, sa=10_000_000, age=30)["underwriting"]["stp_eligible"] is False  # above the straight-through limit
    assert quote(client, sa=20_000_000, age=30)["underwriting"]["route"] == "tele_medical"
    r = put(client, admin, {"underwriting": {"non_medical_sum_assured_limit": 5_000_000, "stp_maximum_sum_assured": 5_000_000}})
    assert r.status_code == 200
    q = quote(client, sa=10_000_000, age=30)
    assert (
        q["underwriting"]["route"] == "tele_medical"
        and q["underwriting"]["stp_eligible"] is False
        and q["config_version"] == r.json()["version"]
    )
    put(client, admin, {"underwriting": {"tele_medical_threshold": 10_000_000, "physical_medical_threshold": 15_000_000}})
    assert quote(client, sa=20_000_000, age=30)["underwriting"]["route"] == "full_underwriting"
    assert quote(client, sa=12_000_000, age=30)["underwriting"]["route"] == "physical_medical"
    put(client, admin, {"underwriting": {"stp_enabled": False}})
    assert quote(client, sa=2_500_000, age=30)["underwriting"]["stp_eligible"] is False


def test_age_and_smoker_rules_for_non_medical_and_stp(client, admin):
    assert quote(client, sa=10_000_000, age=36)["underwriting"]["route"] == "tele_medical"
    assert quote(client, sa=2_500_000, age=30, smoker=True)["underwriting"]["stp_eligible"] is False
    put(client, admin, {"underwriting": {"stp_allow_smokers": True, "non_medical_maximum_age": 40}})
    assert quote(client, sa=2_500_000, age=30, smoker=True)["underwriting"]["stp_eligible"] is True
    assert quote(client, sa=10_000_000, age=38)["underwriting"]["route"] == "non_medical"


def test_needs_analysis_uses_the_updated_assumptions(client, admin):
    base = client.post(f"{API}/assessments", json=BASE_ASSESSMENT).json()
    put(
        client,
        admin,
        {"needs": {"inflation_rate": 10, "discount_rate": 5, "deceased_expense_reduction_factor": 10, "emergency_fund_months": 12}},
    )
    new = client.post(f"{API}/assessments", json=BASE_ASSESSMENT).json()
    assert new["config_version"] > base["config_version"]
    assert new["net_needs"]["income_replacement_pv"] > base["net_needs"]["income_replacement_pv"]
    assert new["net_needs"]["immediate_expenses"] > base["net_needs"]["immediate_expenses"]
    assert new["net_needs"]["net_coverage_gap"] > base["net_needs"]["net_coverage_gap"]
    assert new["methodology"]["assumptions_summary"].startswith("Inflation 10.0%")


def test_income_multiple_band_comes_from_the_configuration(client, admin):
    band = client.post(f"{API}/assessments", json=BASE_ASSESSMENT).json()["income_multiple_check"]
    assert band["minimum_cover"] == 18_000_000 and band["maximum_cover"] == 27_000_000
    put(client, admin, {"needs": {"income_replacement_multiple_min": 12, "income_replacement_multiple_max": 20}})
    band = client.post(f"{API}/assessments", json=BASE_ASSESSMENT).json()["income_multiple_check"]
    assert band["minimum_cover"] == 21_600_000 and band["maximum_cover"] == 36_000_000


def test_recommendations_report_the_configuration_they_used(client, admin):
    r = put(client, admin, {"needs": {"inflation_rate": 6}})
    assert client.post(f"{API}/recommendations", json=recommend_body()).json()["config_version"] == r.json()["version"]


# ---- reload, reset, rollback ----


def test_explicit_reload_picks_up_an_edited_file_without_a_restart(client, admin):
    doc = storage_service.get_admin_config()
    doc["active"]["needs"]["emergency_fund_months"] = 11
    doc["active"]["version"] += 40
    storage_service.save_admin_config(doc)
    assert get_config(client, admin)["needs"]["emergency_fund_months"] == 6  # memory is unchanged until a reload
    r = client.post(f"{API}/admin/reload", headers=admin)
    assert r.status_code == 200 and r.json()["version"] == doc["active"]["version"]
    assert get_config(client, admin)["needs"]["emergency_fund_months"] == 11


def test_a_damaged_saved_file_falls_back_to_factory_defaults(client, admin):
    storage_service.save_admin_config({"active": {"version": 3, "nonsense": True}, "history": []})
    client.post(f"{API}/admin/reload", headers=admin)
    cfg = get_config(client, admin)
    assert len(cfg["products"]) == 14 and cfg["needs"]["inflation_rate"] == get_base_pack().assumptions.general_inflation_pct_pa


def test_factory_reset_restores_the_baseline_and_removes_custom_products(client, admin):
    original = quote(client)
    client.post(f"{API}/admin/products", headers=admin, json=NEW_PRODUCT)
    edit(client, admin, TERM, {"base_rate_per_1000": 9, "active": True})
    put(client, admin, {"needs": {"inflation_rate": 12}, "underwriting": {"stp_enabled": False}})
    r = client.post(f"{API}/admin/reset", headers=admin)
    assert r.status_code == 200
    cfg = r.json()["config"]
    assert len(cfg["products"]) == 14 and cfg["needs"]["inflation_rate"] == get_base_pack().assumptions.general_inflation_pct_pa
    assert cfg["underwriting"]["stp_enabled"] is True
    again = quote(client)
    assert again["rate_per_1000"] == original["rate_per_1000"] and again["total_instalment"] == original["total_instalment"]
    assert again["config_version"] == r.json()["version"]


def test_rollback_restores_an_earlier_version_as_a_new_version(client, admin):
    start = get_config(client, admin)
    first = put(client, admin, {"needs": {"inflation_rate": 9}}).json()["version"]
    put(client, admin, {"needs": {"inflation_rate": 11}})
    r = client.post(f"{API}/admin/config/rollback", headers=admin, json={"version": first})
    assert r.status_code == 200 and r.json()["config"]["needs"]["inflation_rate"] == 9 and r.json()["version"] > first + 1
    assert client.post(f"{API}/admin/config/rollback", headers=admin, json={"version": 99999}).status_code == 422
    assert start["needs"]["inflation_rate"] != 9


# ---- access control ----


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("get", "/admin/config", None),
        ("put", "/admin/config", {}),
        ("post", "/admin/products", NEW_PRODUCT),
        ("put", f"/admin/products/{TERM}", {"active": False}),
        ("delete", "/admin/products/PRD-DEMO01", None),
        ("post", "/admin/reload", None),
        ("post", "/admin/reset", None),
        ("get", "/admin/config/history", None),
        ("post", "/admin/config/rollback", {"version": 1}),
        ("post", "/admin/test-calculator", {}),
        ("get", "/admin/analytics", None),
        ("get", "/admin/leads", None),
        ("get", "/admin/leads/export", None),
    ],
)
def test_admin_routes_refuse_everyone_but_administrators(client, auth_headers, method, path, body):
    kwargs = {"json": body} if body is not None else {}
    assert getattr(client, method)(f"{API}{path}", **kwargs).status_code == 401
    assert getattr(client, method)(f"{API}{path}", headers=auth_headers, **kwargs).status_code == 403
    advisor = client.post(f"{API}/auth/demo/advisor", json={}).json()["token"]
    assert getattr(client, method)(f"{API}{path}", headers={"Authorization": f"Bearer {advisor}"}, **kwargs).status_code == 403


def test_a_customer_cannot_change_rates_even_with_a_forged_role(client, auth_headers):
    forged = auth_headers["Authorization"].rsplit(".", 1)[0] + ".forged"
    assert (
        client.put(f"{API}/admin/products/{TERM}", headers={"Authorization": forged}, json={"base_rate_per_1000": 0.001}).status_code == 401
    )


# ---- concurrency ----


def test_concurrent_quotes_always_use_one_consistent_configuration(admin):
    """While an admin keeps changing the rate, every quote is priced with exactly the version it reports."""
    base_rate = product_of(
        config_store.current().config.model_dump() | {"products": [p.model_dump() for p in config_store.current().config.products]}
    )["base_rate_per_1000"]
    stop, bad, seen = threading.Event(), [], set()

    def reader():
        while not stop.is_set():
            q = premium.quote(
                QuoteRequest(
                    product_id=TERM,
                    applicant=Applicant(age=30, gender="male", annual_income=2_000_000),
                    sum_assured=10_000_000,
                    policy_term_years=30,
                )
            )
            snap = config_store.snapshot_of(q.config_version)
            if snap is None:
                continue  # that version has aged out of the history window
            expected = next(p for p in snap["products"] if p["product_id"] == TERM)["base_rate_per_1000"]
            matrix = float(get_base_pack().rates[(TERM, "regular", 30, 30, "male", "non_smoker")])
            reference = next(p for p in snap["products"] if p["product_id"] == TERM)["reference_rate_per_1000"]
            seen.add(q.config_version)
            time.sleep(0.001)
            if q.rate_per_1000 != pytest.approx(matrix * expected / reference, rel=1e-6):
                bad.append((q.config_version, q.rate_per_1000, expected))

    threads = [threading.Thread(target=reader) for _ in range(4)]
    for t in threads:
        t.start()
    versions = []
    for i in range(30):
        result = config_store.commit(
            lambda cfg, i=i: {
                **cfg.model_dump(),
                "products": [
                    {**p, "base_rate_per_1000": base_rate * (1 + i / 10)} if p["product_id"] == TERM else p
                    for p in cfg.model_dump()["products"]
                ],
            },
            "tester",
            f"rate {i}",
        )
        versions.append(result["version"])
        time.sleep(0.002)
    stop.set()
    for t in threads:
        t.join()
    assert not bad and len(seen) > 3 and versions == sorted(set(versions))


def test_two_writers_never_lose_an_update(admin):
    def bump():
        for _ in range(15):
            config_store.commit(
                lambda cfg: {
                    **cfg.model_dump(),
                    "needs": {
                        **cfg.model_dump()["needs"],
                        "emergency_fund_months": 1 + config_store.current().config.needs.emergency_fund_months % 30,
                    },
                },
                "w",
                "tick",
            )

    start = config_store.version
    threads = [threading.Thread(target=bump) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert config_store.version == start + 45


# ---- the test calculator, analytics and leads ----


def test_the_test_calculator_runs_the_real_engines(client, admin):
    body = {"age": 32, "annual_income": 1_800_000, "dependents": 2}
    first = client.post(f"{API}/admin/test-calculator", headers=admin, json=body).json()
    assert (
        first["config_version"] == get_config(client, admin)["version"]
        and first["needs"]["recommended_cover"] > 0
        and first["headline"]["monthly_premium"] > 0
    )
    real = client.post(
        f"{API}/assessments", json={"age": 32, "annual_income": 1_800_000, "annual_expenses": 720_000, "dependents_count": 2}
    ).json()
    assert first["needs"]["net_coverage_gap"] == real["net_needs"]["net_coverage_gap"]
    top = next(r for r in first["products"] if r["product_id"] == first["headline"]["product_id"])
    direct = quote(client, sa=top["sum_assured"], term=top["term_years"], age=32, product=top["product_id"], income=1_800_000)
    assert direct["total_instalment"] == top["monthly_premium"]
    edit(
        client,
        admin,
        first["headline"]["product_id"],
        {"base_rate_per_1000": product_of(get_config(client, admin), first["headline"]["product_id"])["base_rate_per_1000"] * 3},
    )
    second = client.post(f"{API}/admin/test-calculator", headers=admin, json=body).json()
    assert second["config_version"] > first["config_version"]
    assert 0 < second["elapsed_ms"] < 5000


def test_analytics_only_reports_what_was_tracked(client, admin):
    empty_events = storage_service.list_events()
    stats = client.get(f"{API}/admin/analytics", headers=admin).json()
    assert [f["key"] for f in stats["funnel"]] == ["started", "completed", "recommended", "selected", "booked"]
    started = next(f["count"] for f in stats["funnel"] if f["key"] == "started")
    assert started == sum(1 for e in empty_events if e["kind"] == "assessment_started")
    client.post(f"{API}/events", json={"kind": "assessment_started"})
    client.post(f"{API}/recommendations", json=recommend_body())
    after = client.get(f"{API}/admin/analytics", headers=admin).json()
    assert next(f["count"] for f in after["funnel"] if f["key"] == "started") == started + 1
    assert (
        next(f["count"] for f in after["funnel"] if f["key"] == "recommended")
        == next(f["count"] for f in stats["funnel"] if f["key"] == "recommended") + 1
    )
    assert client.post(f"{API}/events", json={"kind": "plan_selected"}).status_code == 422  # a browser may only report one kind


def test_analytics_summarises_stored_assessments_and_plans(client, admin, auth_headers):
    client.post(f"{API}/assessments", json=BASE_ASSESSMENT, headers=auth_headers)
    client.put(f"{API}/my-plan", headers=auth_headers, json={"plan": {"items": [{"product_id": TERM}], "total_cover": 10_000_000}})
    stats = client.get(f"{API}/admin/analytics", headers=admin).json()
    assert stats["average_coverage_gap"] and stats["average_coverage_purchased"] == 10_000_000
    assert any(p["product_id"] == TERM for p in stats["top_selected"]) and stats["category_share"]["selected"].get("Term Life", 0) >= 1
    client.delete(f"{API}/my-plan/choice", headers=auth_headers)


def test_leads_are_signed_in_assessments_and_can_be_exported(client, admin, auth_headers):
    client.post(f"{API}/assessments", json={**BASE_ASSESSMENT, "annual_income": 1_234_567})  # a guest: not a lead
    client.post(f"{API}/assessments", json={**BASE_ASSESSMENT, "annual_income": 2_345_678}, headers=auth_headers)
    leads = client.get(f"{API}/admin/leads", headers=admin).json()
    assert any(x["annual_income"] == 2_345_678 for x in leads) and not any(x["annual_income"] == 1_234_567 for x in leads)
    lead = next(x for x in leads if x["annual_income"] == 2_345_678)
    assert lead["customer"] == "Demo Customer" and lead["coverage_gap"] is not None and lead["age"] == 32
    assert client.get(f"{API}/admin/leads", headers=admin, params={"q": "demo customer"}).json()
    assert client.get(f"{API}/admin/leads", headers=admin, params={"q": "zzzzzz"}).json() == []
    csv_resp = client.get(f"{API}/admin/leads/export", headers=admin, params={"format": "csv"})
    assert (
        csv_resp.status_code == 200
        and "attachment" in csv_resp.headers["content-disposition"]
        and "assessment_id,saved_at,customer" in csv_resp.text
    )
    json_resp = client.get(f"{API}/admin/leads/export", headers=admin, params={"format": "json"})
    assert json.loads(json_resp.text)[0]["assessment_id"]
    assert client.get(f"{API}/admin/leads/export", headers=admin, params={"format": "xml"}).status_code == 422


def test_exported_csv_cannot_run_as_a_spreadsheet_formula():
    out = analytics.export_csv(
        [{"customer": '=HYPERLINK("http://evil")', "n": 1}, {"customer": "+1+1", "n": 2}, {"customer": "Asha", "n": 3}]
    )
    assert "'=HYPERLINK" in out and "'+1+1" in out and ",Asha" not in out.replace("Asha,3", "")


def test_admin_changes_are_audited_without_customer_data(client, admin):
    put(client, admin, {"needs": {"inflation_rate": 7.5}})
    lines = [json.loads(line) for line in (storage_service.root / "audit_log.jsonl").read_text().splitlines()]
    entry = next(e for e in reversed(lines) if e["action"] == "config.update")
    assert entry["actor"] == "adm-demo@users.lifesure.app" and entry["target"].startswith("v")


# ---- the Stage 2 scenarios, end to end, with measured timings ----


def test_stage_2_scenario_1_assessment_to_sum_assured_and_premium(client):
    t0 = time.perf_counter()
    needs = client.post(f"{API}/assessments", json=BASE_ASSESSMENT).json()
    recs = client.post(f"{API}/recommendations", json=recommend_body()).json()
    elapsed = time.perf_counter() - t0
    assert needs["net_needs"]["recommended_cover"] > 0 and needs["hlv"]["hlv_gross"] > 0
    core = next(i for i in recs["basket"]["items"] if i["product_type"] == "Term Life")
    assert core["quote"]["sum_assured"] > 0 and core["quote"]["total_instalment"] > 0 and core["quote"]["underwriting"]["route"]
    assert recs["recommended_cover"] == needs["net_needs"]["recommended_cover"]
    assert elapsed < 5


def test_stage_2_scenario_2_admin_change_applies_to_the_next_quote_without_restart(client, admin):
    timings = {}
    t = time.perf_counter()
    before_recs = client.post(f"{API}/recommendations", json=recommend_body()).json()
    timings["recommendations_before_ms"] = (time.perf_counter() - t) * 1000
    core_before = next(i for i in before_recs["basket"]["items"] if i["product_type"] == "Term Life")
    pid = core_before["product_id"]
    rate = product_of(get_config(client, admin), pid)["base_rate_per_1000"]

    t = time.perf_counter()
    change = edit(client, admin, pid, {"base_rate_per_1000": round(rate * 1.5, 6)})
    timings["update_request_ms"] = (time.perf_counter() - t) * 1000
    assert change.status_code == 200

    t = time.perf_counter()
    after_recs = client.post(f"{API}/recommendations", json=recommend_body()).json()
    timings["recommendations_after_ms"] = (time.perf_counter() - t) * 1000
    # the basket may now prefer a cheaper plan, which is the ranking being recalculated; the product itself is read from the full list
    core_after = next(p for p in after_recs["products"] if p["product_id"] == pid)

    assert after_recs["config_version"] == change.json()["version"] > before_recs["config_version"]
    assert core_after["quote"]["rate_per_1000"] == pytest.approx(core_before["quote"]["rate_per_1000"] * 1.5, rel=1e-5)
    assert (
        core_after["quote"]["total_instalment"] > core_before["quote"]["total_instalment"]
        or core_after["quote"]["sum_assured"] < core_before["quote"]["sum_assured"]
    )
    assert change.json()["activation_ms"] < 100 and all(v < 5000 for v in timings.values())
    print(  # noqa: T201
        "TIMINGS",
        {k: round(v, 1) for k, v in timings.items()},
        "activation_ms",
        change.json()["activation_ms"],
        "persisted_ms",
        change.json()["persisted_ms"],
    )
