"""Tests for the FastAPI HTTP endpoints (GET /health and POST /optimize-energy)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def make_valid_payload():
    return {
        "scenario_id": "TEST-API-01",
        "operator_notes": ["Facilities will wash panels from noon until 2 PM. Solar 25%."],
        "hours": [
            {"hour": h, "demand_kwh": 100.0, "solar_kwh": 30.0 if 8 <= h <= 16 else 0.0, "tariff_bdt_per_kwh": 10.0}
            for h in range(24)
        ],
        "battery": {
            "capacity_kwh": 200.0,
            "initial_energy_kwh": 100.0,
            "minimum_energy_kwh": 20.0,
            "max_charge_kwh_per_hour": 50.0,
            "max_discharge_kwh_per_hour": 50.0,
        },
    }


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_valid_optimize_energy_request():
    payload = make_valid_payload()
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["scenario_id"] == "TEST-API-01"
    assert len(data["directive_interpretation"]) == 1
    assert len(data["hourly_plan"]) == 24
    assert data["total_grid_kwh"] >= 0
    assert data["total_cost_bdt"] >= 0
    assert data["peak_grid_kwh"] >= 0
    assert isinstance(data["plan_summary"], str)


def test_missing_json_body():
    response = client.post("/optimize-energy", content="", headers={"Content-Type": "application/json"})
    assert response.status_code == 400


def test_invalid_json_syntax():
    response = client.post("/optimize-energy", content="{not valid json}", headers={"Content-Type": "application/json"})
    assert response.status_code == 400


def test_missing_top_level_fields():
    payload = make_valid_payload()
    del payload["scenario_id"]
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_wrong_field_types():
    payload = make_valid_payload()
    payload["scenario_id"] = 12345  # Not a string
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_less_than_24_hours():
    payload = make_valid_payload()
    payload["hours"] = payload["hours"][:23]  # Only 23 hours
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_more_than_24_hours():
    payload = make_valid_payload()
    payload["hours"].append({"hour": 24, "demand_kwh": 100, "solar_kwh": 0, "tariff_bdt_per_kwh": 10})
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_duplicate_hours():
    payload = make_valid_payload()
    payload["hours"][1]["hour"] = 0  # Duplicate hour 0
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_invalid_battery_negative_capacity():
    payload = make_valid_payload()
    payload["battery"]["capacity_kwh"] = -50.0
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_invalid_battery_initial_exceeds_capacity():
    payload = make_valid_payload()
    payload["battery"]["initial_energy_kwh"] = 250.0  # Capacity is 200
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_invalid_operator_notes_empty_array():
    payload = make_valid_payload()
    payload["operator_notes"] = []  # Min length 1
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_invalid_operator_notes_too_many():
    payload = make_valid_payload()
    payload["operator_notes"] = ["Note 1", "Note 2", "Note 3", "Note 4"]  # Max length 3
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400


def test_invalid_operator_notes_empty_string():
    payload = make_valid_payload()
    payload["operator_notes"] = ["   "]  # Empty/whitespace only
    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 400
