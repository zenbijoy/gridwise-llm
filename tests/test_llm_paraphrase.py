"""Tests for natural-language paraphrases across all supported directive types."""

import pytest
from app.llm_interpreter import emergency_deterministic_fallback
from app.guardrails import apply_guardrails


def test_no_charge_window_paraphrases():
    variants = [
        "Do not charge the battery between 1 PM and 3 PM.",
        "Charging must remain disabled from 13:00 until 15:00.",
        "Keep the battery from charging during the 1 PM to 3 PM period.",
    ]
    for variant in variants:
        payload = [{"note_index": 0, "operator_note": variant}]
        raw = emergency_deterministic_fallback(payload)
        sanitized = apply_guardrails(raw, num_notes=1, battery_capacity_kwh=200.0)

        assert sanitized[0].applies is True
        assert sanitized[0].directive_type == "no_charge_window"
        assert sanitized[0].structured_adjustment["hours"] == [13, 14]


def test_no_discharge_window_paraphrases():
    variants = [
        "Do not discharge the battery between 6 PM and 9 PM.",
        "Discharging disabled from 18:00 to 21:00.",
        "No battery discharge from 6 PM until 9 PM.",
    ]
    for variant in variants:
        payload = [{"note_index": 0, "operator_note": variant}]
        raw = emergency_deterministic_fallback(payload)
        sanitized = apply_guardrails(raw, num_notes=1, battery_capacity_kwh=200.0)

        assert sanitized[0].applies is True
        assert sanitized[0].directive_type == "no_discharge_window"
        assert sanitized[0].structured_adjustment["hours"] == [18, 19, 20]


def test_solar_reduction_paraphrases():
    variants = [
        ("Solar output will drop to about 20% from 1 PM to 3 PM.", [13, 14], 0.20),
        ("Panel washing from one until three will leave roughly one-fifth of normal solar output.", [13, 14], 0.20),
        ("Expect an 80% reduction in rooftop solar during the 1-3 PM maintenance window.", [13, 14], 0.20),
        ("Facilities will wash the rooftop solar panels from noon until 2 PM. Usable solar roughly 25% of forecast.", [12, 13], 0.25),
    ]
    for note, expected_hours, expected_factor in variants:
        payload = [{"note_index": 0, "operator_note": note}]
        raw = emergency_deterministic_fallback(payload)
        sanitized = apply_guardrails(raw, num_notes=1, battery_capacity_kwh=200.0)

        assert sanitized[0].applies is True
        assert sanitized[0].directive_type == "solar_reduction"
        assert sanitized[0].structured_adjustment["hours"] == expected_hours
        assert abs(sanitized[0].structured_adjustment["factor"] - expected_factor) < 1e-4


def test_minimum_reserve_paraphrases():
    variants = [
        "Keep at least 120 kWh in reserve from 6 PM until 9 PM.",
        "Maintain minimum reserve level of 120 kWh from 18:00 to 21:00.",
    ]
    for variant in variants:
        payload = [{"note_index": 0, "operator_note": variant}]
        raw = emergency_deterministic_fallback(payload)
        sanitized = apply_guardrails(raw, num_notes=1, battery_capacity_kwh=200.0)

        assert sanitized[0].applies is True
        assert sanitized[0].directive_type == "minimum_battery_reserve"
        assert sanitized[0].structured_adjustment["hours"] == [18, 19, 20]
        assert sanitized[0].structured_adjustment["minimum_energy_kwh"] == 120.0


def test_distractor_irrelevant_notes():
    distractors = [
        "The cafeteria menu changes tomorrow.",
        "The sports office moved next month's registration deadline.",
        "Weekly staff meeting is scheduled at the main auditorium.",
    ]
    for distractor in distractors:
        payload = [{"note_index": 0, "operator_note": distractor}]
        raw = emergency_deterministic_fallback(payload)
        sanitized = apply_guardrails(raw, num_notes=1, battery_capacity_kwh=200.0)

        assert sanitized[0].applies is False
        assert sanitized[0].directive_type == "no_op"
        assert sanitized[0].structured_adjustment is None
