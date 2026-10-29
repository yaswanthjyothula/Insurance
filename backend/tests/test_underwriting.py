import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ckyc_lookup_preset():
    response = client.post(
        "/api/v1/underwriting/ckyc-lookup",
        json={"pan_number": "ABCPS1234A"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["pan"] == "ABCPS1234A"
    assert data["full_name"] == "Praveen Sharma"
    assert data["ckyc_number"] == "91028374650192"
    assert data["kyc_status"] == "VERIFIED"
    assert "CLEARED" in data["aml_screening"]


def test_ckyc_lookup_generic_valid_pan():
    response = client.post(
        "/api/v1/underwriting/ckyc-lookup",
        json={"pan_number": "ZZZZZ9999Z", "full_name": "Kavita Rao", "date_of_birth": "1994-08-12"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["pan"] == "ZZZZZ9999Z"
    assert data["full_name"] == "Kavita Rao"
    assert len(data["ckyc_number"]) == 14
    assert data["kyc_status"] == "VERIFIED"


def test_ckyc_lookup_invalid_pan():
    response = client.post(
        "/api/v1/underwriting/ckyc-lookup",
        json={"pan_number": "INVALID12"}
    )
    assert response.status_code == 400
    assert "Invalid PAN format" in response.json()["detail"]


def test_medical_triage_clean_profile():
    payload = {
        "tobacco_use": "never",
        "pre_existing_conditions": ["none"],
        "family_longevity": "both_parents_above_70",
        "base_annual_premium": 18000.0,
        "base_monthly_premium": 1500.0,
        "sum_assured": 15000000.0,
        "age": 32,
        "gender": "male"
    }
    response = client.post("/api/v1/underwriting/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["underwriting_decision"] == "INSTANT_ISSUANCE"
    assert data["stp_eligible"] is True
    assert data["premium_multiplier"] <= 1.0  # -5% longevity discount
    assert data["adjusted_annual_premium"] < 18000.0


def test_medical_triage_tobacco_and_hypertension():
    payload = {
        "tobacco_use": "regular",
        "pre_existing_conditions": ["hypertension"],
        "family_longevity": "no_major_family_illness",
        "base_annual_premium": 20000.0,
        "base_monthly_premium": 1666.67,
        "sum_assured": 10000000.0,
        "age": 38,
        "gender": "male"
    }
    response = client.post("/api/v1/underwriting/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["underwriting_decision"] in ("PREMIUM_LOADING", "TELE_MEDICAL_REQUIRED")
    assert data["adjusted_annual_premium"] > 20000.0
    assert data["loading_percentage"] > 0


def test_medical_triage_cardiac_condition():
    payload = {
        "tobacco_use": "never",
        "pre_existing_conditions": ["cardiac_history"],
        "family_longevity": "one_parent_cardiac_cancer_before_60",
        "base_annual_premium": 25000.0,
        "base_monthly_premium": 2083.33,
        "sum_assured": 20000000.0,
        "age": 45,
        "gender": "male"
    }
    response = client.post("/api/v1/underwriting/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["underwriting_decision"] == "PHYSICAL_EXAM_REQUIRED"
    assert data["stp_eligible"] is False
    assert len(data["medical_requirements"]) >= 2


def test_policy_issuance():
    payload = {
        "ckyc_number": "91028374650192",
        "pan_number": "ABCPS1234A",
        "proposer_name": "Praveen Sharma",
        "product_id": "hdfc-c2p-3d-plus",
        "product_name": "HDFC Life Click 2 Protect 3D Plus",
        "insurer_name": "HDFC Life",
        "sum_assured": 15000000.0,
        "tenure_years": 30,
        "annual_premium": 17100.0,
        "monthly_premium": 1425.0,
        "underwriting_decision": "INSTANT_ISSUANCE"
    }
    response = client.post("/api/v1/underwriting/issue-policy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["policy_number"].startswith("POL-2026-IN-")
    assert data["issuance_status"] == "ISSUED_ACTIVE"
    assert data["free_look_period_days"] == 30
    assert "SHA256" in data["digital_signature_hash"]
