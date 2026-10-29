import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_banking_profiles_endpoints():
    response = client.get("/api/v1/banking/profiles")
    assert response.status_code == 200
    profiles = response.json()
    assert len(profiles) >= 4
    hdfc = next(p for p in profiles if p["bank_code"] == "HDFC")
    assert hdfc["annual_income"] == 1800000.0
    assert hdfc["cibil_score"] == 785

    single_resp = client.get("/api/v1/banking/profiles/hdfc_corporate")
    assert single_resp.status_code == 200
    assert single_resp.json()["bank_name"] == "HDFC Bank"

def test_create_assessment_endpoint():
    payload = {
        "age": 30,
        "annual_income": 1200000.0,
        "annual_expenses": 500000.0,
        "dependents_count": 2,
        "outstanding_liabilities": 2000000.0,
        "existing_cover": 2500000.0,
        "eligible_assets": 1000000.0,
        "future_goals": [
            {"name": "Child Education", "cost_today": 1500000.0, "years_away": 10, "category": "education"}
        ]
    }
    response = client.post("/api/v1/assessments", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "assessment_id" in data
    assert data["net_needs"]["net_coverage_gap"] > 0
    assert data["net_needs"]["outstanding_liabilities"] == 2000000.0

def test_ml_recommendations_endpoint():
    payload = {
        "age": 28,
        "annual_income": 1000000.0,
        "coverage_gap": 10000000.0,
        "dependents_count": 1,
        "desired_tenure_years": 30,
        "smoker_status": False,
        "preferred_category": "term"
    }
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) > 0
    assert data["recommendations"][0]["rank"] == 1
    assert len(data["recommendations"][0]["score_breakdown"]) == 5

def test_scenarios_endpoint():
    baseline_payload = {
        "age": 32,
        "annual_income": 1500000.0,
        "annual_expenses": 600000.0,
        "dependents_count": 1,
        "outstanding_liabilities": 3000000.0,
        "existing_cover": 5000000.0,
        "eligible_assets": 1000000.0
    }
    scenario_payload = {
        "scenario": {
            "scenario_type": "loan_cleared",
            "title": "Clear Home Loan",
            "description": "Prepay loan completely"
        },
        "baseline_input": baseline_payload
    }
    response = client.post("/api/v1/scenarios", json=scenario_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_result"]["net_needs"]["outstanding_liabilities"] == 0.0

def test_ai_custom_scenario_endpoint():
    baseline_payload = {
        "age": 32,
        "annual_income": 1500000.0,
        "annual_expenses": 600000.0,
        "dependents_count": 1,
        "outstanding_liabilities": 3000000.0,
        "existing_cover": 5000000.0,
        "eligible_assets": 1000000.0
    }
    payload = {
        "user_scenario_prompt": "We are having twins next year and taking a 40 Lakh home loan.",
        "baseline_input": baseline_payload
    }
    response = client.post("/api/v1/scenarios/ai-custom", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "scenario_comparison" in data
    assert "ai_title" in data
    assert "ai_analysis" in data
    assert len(data["actionable_recommendations"]) > 0

def test_products_list_endpoint():
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 7 # All 7 categories represented

def test_policy_xray_endpoint():
    response = client.post("/api/v1/policies/analyse", data={
        "raw_text": "HDFC Life Term Insurance Policy Schedule. Sum Assured: ₹10,000,000. Annual Premium: ₹14,500. Policy Term: 30 Years."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["sum_assured"] == 10000000.0
    assert data["annual_premium"] == 14500.0
    assert data["policy_term_years"] == 30
    assert data["insurer"] == "HDFC Life"
    # nothing about exclusions was in the text, so none are invented
    assert data["exclusions"] == []
    assert any("exclusion" in u.lower() for u in data["uncertain_fields"])


def test_policy_xray_rejects_empty_text():
    assert client.post("/api/v1/policies/analyse", data={"raw_text": ""}).status_code == 422

def test_products_compare_endpoint():
    response = client.post("/api/v1/products/compare", json={
        "product_ids": ["term-hdfc-click2protect-life", "term-axis-max-smart-term-plus"],
        "target_sum_assured": 15000000.0,
        "tenure_years": 25
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["compared_products"]) == 2
    assert data["compared_products"][0]["estimated_annual_premium"] > 0
    assert data["target_sum_assured"] == 15000000.0

from app.services.storage import storage_service

def test_anti_double_booking_and_advisory():
    # 0. Hermetic test isolation: clear previous test bookings
    storage_service._write_data(storage_service.bookings_file, {})

    # 1. Check availability
    avail_res = client.get("/api/v1/advisory/availability")
    assert avail_res.status_code == 200
    advisors = avail_res.json()
    assert len(advisors) > 0
    adv = advisors[0]
    assert len(adv["available_slots"]) > 0
    slot = adv["available_slots"][0]

    # 2. Book the slot
    booking_payload = {
        "advisor_id": adv["id"],
        "preferred_slot": slot,
        "user_name": "Test User",
        "user_email": "test@example.com",
        "user_phone": "9876543210"
    }
    b1_res = client.post("/api/v1/advisory/bookings", json=booking_payload)
    assert b1_res.status_code == 200
    assert b1_res.json()["status"] == "confirmed"

    # 3. Attempt double-booking same advisor and slot -> Must return 409
    b2_res = client.post("/api/v1/advisory/bookings", json=booking_payload)
    assert b2_res.status_code == 409
    assert "already booked" in b2_res.json()["detail"]

def test_standalone_net_needs_and_hlv_endpoints():
    payload = {
        "age": 35,
        "annual_income": 1800000.0,
        "annual_expenses": 720000.0,
        "dependents_count": 2,
        "outstanding_liabilities": 3500000.0,
        "existing_cover": 5000000.0,
        "eligible_assets": 2000000.0,
        "future_goals": [
            {"name": "Child Higher Education", "cost_today": 2500000.0, "years_away": 12, "category": "education"}
        ]
    }
    res_nn = client.post("/api/v1/calculations/net-needs", json=payload)
    assert res_nn.status_code == 200
    nn_data = res_nn.json()
    assert nn_data["method"] == "net_needs"
    assert nn_data["additional_cover_required"] > 0
    assert "breakdown" in nn_data

    res_hlv = client.post("/api/v1/calculations/human-life-value", json=payload)
    assert res_hlv.status_code == 200
    hlv_data = res_hlv.json()
    assert hlv_data["method"] == "human_life_value"
    assert hlv_data["gross_hlv"] > 0

