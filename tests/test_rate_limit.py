"""Tests for in-memory API rate limiting."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.rate_limiter import SlidingWindowRateLimiter, rate_limiter

client = TestClient(app)


def make_valid_payload():
    return {
        "scenario_id": "TEST-RL-01",
        "operator_notes": ["Regular maintenance note."],
        "hours": [
            {"hour": h, "demand_kwh": 100.0, "solar_kwh": 10.0, "tariff_bdt_per_kwh": 10.0}
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


def test_rate_limiter_unit():
    limiter = SlidingWindowRateLimiter(requests_per_minute=3, enabled=True)
    ip = "192.168.1.1"

    # First 3 requests allowed
    assert limiter.is_allowed(ip)[0] is True
    assert limiter.is_allowed(ip)[0] is True
    assert limiter.is_allowed(ip)[0] is True

    # 4th request rejected
    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is False
    assert retry_after > 0

    # Other IP still allowed
    assert limiter.is_allowed("192.168.1.2")[0] is True


def test_rate_limit_integration_http_429():
    # Configure global limiter to a small quota for test
    orig_rpm = rate_limiter.requests_per_minute
    orig_enabled = rate_limiter.enabled
    try:
        rate_limiter.requests_per_minute = 2
        rate_limiter.enabled = True
        rate_limiter.reset()

        payload = make_valid_payload()

        # Request 1: 200
        r1 = client.post("/optimize-energy", json=payload)
        assert r1.status_code == 200

        # Request 2: 200
        r2 = client.post("/optimize-energy", json=payload)
        assert r2.status_code == 200

        # Request 3: Exceeded -> 429
        r3 = client.post("/optimize-energy", json=payload)
        assert r3.status_code == 429
        assert "Retry-After" in r3.headers
        assert "Rate limit exceeded" in r3.json().get("detail", "")

        # Health & Ready endpoints must NEVER be rate limited
        r_health = client.get("/health")
        assert r_health.status_code == 200

        r_ready = client.get("/ready")
        assert r_ready.status_code == 200

    finally:
        rate_limiter.requests_per_minute = orig_rpm
        rate_limiter.enabled = orig_enabled
        rate_limiter.reset()
