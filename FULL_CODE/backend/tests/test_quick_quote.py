"""The public quick quote: the Stage 2 inputs (age, income, dependents, loans) in, sum assured and monthly premium out."""

API = "/api/v1"
BODY = {"age": 32, "annual_income": 1_800_000, "dependents": 2, "outstanding_liabilities": 2_500_000}


def admin_headers(client):
    return {"Authorization": f"Bearer {client.post(f'{API}/auth/demo/admin').json()['token']}"}


def test_quick_quote_matches_the_customer_journey(client):
    out = client.post(f"{API}/quick-quote", json=BODY).json()
    needs = client.post(
        f"{API}/assessments",
        json={
            "age": 32,
            "annual_income": 1_800_000,
            "annual_expenses": 720_000,
            "dependents_count": 2,
            "outstanding_liabilities": 2_500_000,
        },
    ).json()
    assert out["sum_assured"] == needs["net_needs"]["recommended_cover"] > 0
    direct = client.post(
        f"{API}/quotes",
        json={
            "product_id": out["product_id"],
            "applicant": {"age": 32, "gender": "male", "annual_income": 1_800_000},
            "sum_assured": out["headline"]["sum_assured"],
            "policy_term_years": out["headline"]["term_years"],
        },
    ).json()
    assert out["monthly_premium"] == direct["total_instalment"] > 0


def test_loans_raise_the_sum_assured(client):
    without = client.post(f"{API}/quick-quote", json={**BODY, "outstanding_liabilities": 0}).json()
    with_loans = client.post(f"{API}/quick-quote", json=BODY).json()
    assert with_loans["sum_assured"] - without["sum_assured"] >= 2_400_000


def test_common_field_names_are_accepted(client):
    plain = client.post(f"{API}/quick-quote", json=BODY).json()
    aliased = client.post(f"{API}/quick-quote", json={"age": 32, "income": 1_800_000, "dependents_count": 2, "loans": 2_500_000}).json()
    assert (aliased["sum_assured"], aliased["monthly_premium"]) == (plain["sum_assured"], plain["monthly_premium"])


def test_an_admin_rate_change_reprices_the_next_quote(client):
    before = client.post(f"{API}/quick-quote", json=BODY).json()
    admin = admin_headers(client)
    product = next(
        p for p in client.get(f"{API}/admin/config", headers=admin).json()["products"] if p["product_id"] == before["product_id"]
    )
    new_rate = round(product["base_rate_per_1000"] * 2, 4)
    assert (
        client.put(f"{API}/admin/products/{before['product_id']}", headers=admin, json={"base_rate_per_1000": new_rate}).status_code == 200
    )
    after = client.post(f"{API}/quick-quote", json=BODY).json()
    assert after["config_version"] > before["config_version"]
    assert after["sum_assured"] == before["sum_assured"]
    repriced = next(r for r in after["products"] if r["product_id"] == before["product_id"])
    assert repriced["monthly_premium"] > before["monthly_premium"]
    assert after["elapsed_ms"] < 5000


def test_missing_or_invalid_inputs_are_rejected(client):
    assert client.post(f"{API}/quick-quote", json={"age": 32, "annual_income": 1_800_000}).status_code == 422
    assert client.post(f"{API}/quick-quote", json={**BODY, "age": 12}).status_code == 422
    assert client.post(f"{API}/quick-quote", json={**BODY, "outstanding_liabilities": -1}).status_code == 422
