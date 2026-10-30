"""HTTP-level behaviour: permissions, validation, booking rules and the pack endpoints."""

import pytest

from app.pack.loader import get_pack

BASE = {
    "age": 32,
    "annual_income": 1_800_000,
    "annual_expenses": 720_000,
    "dependents_count": 2,
    "outstanding_liabilities": 4_000_000,
    "existing_cover": 5_000_000,
    "eligible_assets": 2_000_000,
}


def test_health(client):
    assert client.get("/health").json()["status"] == "healthy"


def test_assessment_roundtrip(client):
    r = client.post("/api/v1/assessments", json=BASE)
    assert r.status_code == 200 and r.json()["net_needs"]["net_coverage_gap"] > 0
    assert client.get(f"/api/v1/assessments/{r.json()['assessment_id']}").status_code == 200


@pytest.mark.parametrize("bad", [{"age": 10}, {"annual_income": -1}, {"dependents_count": 99}])
def test_invalid_assessment_is_rejected(client, bad):
    assert client.post("/api/v1/assessments", json={**BASE, **bad}).status_code == 422


def test_pack_endpoints(client):
    assert len(client.get("/api/v1/pack/products").json()) == 14
    assert len(client.get("/api/v1/pack/products", params={"product_type": "ULIP"}).json()) == 3
    customers = client.get("/api/v1/pack/customers").json()
    assert len(customers) == 200
    detail = client.get(f"/api/v1/pack/customers/{customers[0]['profile_id']}").json()
    assert detail["assessment"]["age"] == customers[0]["age"]
    assert client.get("/api/v1/pack/customers/nope").status_code == 404


def test_recommendations_endpoint(client):
    profile = next(iter(get_pack().profiles))
    req = client.get(f"/api/v1/pack/customers/{profile}").json()["recommend_request"]
    r = client.post("/api/v1/recommendations", json=req)
    assert r.status_code == 200 and r.json()["ranking_method"] == "rules+trained-model"
    assert client.post("/api/v1/recommendations", json={**req, "priority": "nonsense"}).status_code == 422


def test_quote_and_ulip_projection(client):
    applicant = {"age": 30, "gender": "male", "annual_income": 2_000_000}
    q = client.post(
        "/api/v1/quotes",
        json={
            "product_id": "PRD-X4CBUF",
            "applicant": applicant,
            "sum_assured": 10_000_000,
            "policy_term_years": 30,
            "riders": [{"rider_id": "RDR-LUR23D", "sum_assured": 5_000_000}],
        },
    ).json()
    assert q["total_instalment"] == 1045
    assert client.post("/api/v1/quotes", json={"product_id": "NOPE", "applicant": applicant}).status_code == 404
    proj = client.post(
        "/api/v1/ulip/projection",
        json={
            "product_id": "PRD-UPERQ6",
            "applicant": applicant,
            "annual_premium": 120_000,
            "sa_multiple": 10,
            "policy_term_years": 20,
            "fund_id": "FND-VNJ5TV",
        },
    ).json()
    low, high = proj["scenarios"]
    assert high["maturity_value"] > low["maturity_value"] > 0 and low["total_premiums"] == 2_400_000


def test_my_plan_needs_sign_in_and_is_private(client, auth_headers):
    assert client.get("/api/v1/my-plan").status_code == 401
    assert client.put("/api/v1/my-plan", json={"assessment": {"gap": 1}}).status_code == 401
    assert client.put("/api/v1/my-plan", json={"assessment": {"gap": 5}}, headers=auth_headers).status_code == 200
    assert client.get("/api/v1/my-plan", headers=auth_headers).json()["assessment"]["gap"] == 5
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Other Person", "email": "other@example.com", "password": "correct-horse-1"},
    )
    other = client.post("/api/v1/auth/login", json={"email": "other@example.com", "password": "correct-horse-1"}).json()["token"]
    assert client.get("/api/v1/my-plan", headers={"Authorization": f"Bearer {other}"}).json() == {}


def test_auth_rules(client):
    assert client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "x"}).status_code == 400
    assert client.post("/api/v1/auth/register", json={"full_name": "A B", "email": "bad", "password": "longenough1"}).status_code == 422
    assert (
        client.post("/api/v1/auth/register", json={"full_name": "A B", "email": "ab@example.com", "password": "short"}).status_code == 422
    )
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def _free_slot(client, mode="video"):
    for adv in client.get("/api/v1/advisory/availability", params={"mode": mode}).json()["advisors"]:
        if adv["slots"]:
            return adv["advisor_id"], adv["slots"][0]["slot_id"]
    raise AssertionError("no slots")


def _booking(advisor, slot, mode="video"):
    return {
        "advisor_id": advisor,
        "slot_id": slot,
        "user_name": "Test User",
        "user_phone": "9876543210",
        "consultation_mode": mode,
    }


def test_booking_cancel_and_slot_is_freed(client, auth_headers):
    advisor, slot = _free_slot(client)
    first = client.post("/api/v1/advisory/bookings", json=_booking(advisor, slot), headers=auth_headers)
    assert first.status_code == 200 and first.json()["status"] == "confirmed"
    # the same slot cannot be booked twice
    assert client.post("/api/v1/advisory/bookings", json=_booking(advisor, slot), headers=auth_headers).status_code == 409
    mine = client.get("/api/v1/advisory/bookings", headers=auth_headers).json()
    assert any(b["booking_id"] == first.json()["booking_id"] for b in mine)
    assert (
        client.post(f"/api/v1/advisory/bookings/{first.json()['booking_id']}/cancel", headers=auth_headers).json()["status"] == "cancelled"
    )
    assert client.post("/api/v1/advisory/bookings", json=_booking(advisor, slot), headers=auth_headers).status_code == 200


def test_cannot_cancel_someone_elses_booking(client, auth_headers):
    advisor, slot = _free_slot(client)
    booking = client.post("/api/v1/advisory/bookings", json=_booking(advisor, slot), headers=auth_headers).json()
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Mallory X", "email": "mallory@example.com", "password": "correct-horse-1"},
    )
    token = client.post("/api/v1/auth/login", json={"email": "mallory@example.com", "password": "correct-horse-1"}).json()["token"]
    assert (
        client.post(f"/api/v1/advisory/bookings/{booking['booking_id']}/cancel", headers={"Authorization": f"Bearer {token}"}).status_code
        == 404
    )


def test_booking_validation(client, auth_headers):
    advisor, slot = _free_slot(client)
    assert client.post("/api/v1/advisory/bookings", json=_booking(advisor, slot), headers={}).status_code == 401
    assert (
        client.post("/api/v1/advisory/bookings", json={**_booking(advisor, slot), "user_phone": "123"}, headers=auth_headers).status_code
        == 422
    )
    assert client.post("/api/v1/advisory/bookings", json=_booking(advisor, "SLT-NOPE"), headers=auth_headers).status_code == 409
    unsupported = next(a for a in get_pack().advisors.values() if "video" not in a.consultation_modes)
    free = next(
        s
        for s in client.get("/api/v1/advisory/availability", params={"mode": "chat"}).json()["advisors"]
        if s["advisor_id"] == unsupported.advisor_id and s["slots"]
    )
    assert (
        client.post(
            "/api/v1/advisory/bookings",
            json=_booking(unsupported.advisor_id, free["slots"][0]["slot_id"], "video"),
            headers=auth_headers,
        ).status_code
        == 409
    )


def test_xray_reads_only_what_is_there(client):
    r = client.post(
        "/api/v1/policies/analyse",
        data={"raw_text": "Sum assured Rs 1 crore. Annual premium Rs 14,850. Policy term 30 years. Grace period 30 days."},
    ).json()
    assert r["sum_assured"] == 10_000_000 and r["annual_premium"] == 14_850 and r["insurer"] is None
    assert any("Insurer" in u for u in r["uncertain_fields"])
    assert client.post("/api/v1/policies/analyse", data={"raw_text": ""}).status_code == 422
    too_big = client.post("/api/v1/policies/analyse", files={"file": ("p.txt", b"x" * 300_000)})
    assert too_big.status_code == 413


def test_cors_only_allows_the_frontend(client):
    ok = client.options("/api/v1/pack/products", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
    bad = client.options("/api/v1/pack/products", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers


def test_basket_cap_applies_to_all_policies_together(client):
    applicant = {"age": 30, "gender": "male", "annual_income": 1_000_000}
    ok = client.post(
        "/api/v1/quotes/basket",
        json={"applicant": applicant, "items": [{"product_id": "PRD-X4CBUF", "sum_assured": 10_000_000}]},
    ).json()
    assert ok["valid"] and ok["cover_cap"] == 25_000_000

    def check(items):
        return client.post("/api/v1/quotes/basket", json={"applicant": applicant, "items": items}).json()

    total_only = check(
        [
            {"product_id": "PRD-X4CBUF", "sum_assured": 20_000_000},
            {"product_id": "PRD-BWKM04", "sum_assured": 6_000_000},
        ]
    )
    assert not total_only["valid"] and len(total_only["issues"]) == 1 and "Together" in total_only["issues"][0]
    non_term_only = check([{"product_id": "PRD-BWKM04", "sum_assured": 11_000_000}])
    assert not non_term_only["valid"] and "Whole Life, Endowment and ULIP" in non_term_only["issues"][0]
    both = check(
        [
            {"product_id": "PRD-X4CBUF", "sum_assured": 20_000_000},
            {"product_id": "PRD-BWKM04", "sum_assured": 11_000_000},
        ]
    )
    assert len(both["issues"]) == 2
    assert (
        client.post("/api/v1/quotes/basket", json={"applicant": applicant, "items": [{"product_id": "NOPE", "sum_assured": 1}]}).status_code
        == 404
    )
