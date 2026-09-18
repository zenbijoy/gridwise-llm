"""Comprehensive tests for deterministic guardrails (sanitizing untrusted LLM output)."""

import pytest
from app.guardrails import apply_guardrails, sanitize_directive_entry


def test_valid_solar_reduction():
    raw = {
        "note_index": 0,
        "applies": True,
        "directive_type": "solar_reduction",
        "structured_adjustment": {"hours": [12, 13], "factor": 0.25},
        "explanation": "Solar cleaning",
    }
    res = sanitize_directive_entry(raw, 0, battery_capacity_kwh=200.0)
    assert res.applies is True
    assert res.directive_type == "solar_reduction"
    assert res.structured_adjustment == {"hours": [12, 13], "factor": 0.25}


def test_solar_reduction_factor_edge_cases():
    # factor = 0.0 (valid)
    raw = {
        "directive_type": "solar_reduction",
        "structured_adjustment": {"hours": [10], "factor": 0.0},
    }
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is True
    assert res.structured_adjustment["factor"] == 0.0

    # factor = 1.0 (valid)
    raw["structured_adjustment"]["factor"] = 1.0
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is True
    assert res.structured_adjustment["factor"] == 1.0

    # factor > 1.0 -> no_op
    raw["structured_adjustment"]["factor"] = 1.2
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"
    assert res.structured_adjustment is None

    # factor < 0.0 -> no_op
    raw["structured_adjustment"]["factor"] = -0.1
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"


def test_battery_reserve_guardrails():
    # valid reserve
    raw = {
        "directive_type": "minimum_battery_reserve",
        "structured_adjustment": {"hours": [18, 19], "minimum_energy_kwh": 50.0},
    }
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is True
    assert res.structured_adjustment["minimum_energy_kwh"] == 50.0

    # reserve > capacity -> demote to no_op
    raw["structured_adjustment"]["minimum_energy_kwh"] = 150.0
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"

    # negative reserve -> demote to no_op
    raw["structured_adjustment"]["minimum_energy_kwh"] = -10.0
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"


def test_hours_sanitization():
    # Unsorted and duplicate hours -> deduplicate and sort
    raw = {
        "directive_type": "no_charge_window",
        "structured_adjustment": {"hours": [15, 13, 14, 13]},
    }
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is True
    assert res.structured_adjustment["hours"] == [13, 14, 15]

    # Empty hours -> no_op
    raw["structured_adjustment"]["hours"] = []
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"

    # Negative hour -> no_op
    raw["structured_adjustment"]["hours"] = [-1, 2]
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False

    # Out of range hour 24 -> no_op
    raw["structured_adjustment"]["hours"] = [22, 23, 24]
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False

    # Non-integer hours (e.g. float or string) -> no_op
    raw["structured_adjustment"]["hours"] = [1.5, 2]
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False


def test_unknown_directive_coerced_to_no_op():
    raw = {
        "directive_type": "super_mega_battery_charge",
        "structured_adjustment": {"hours": [1, 2]},
    }
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"
    assert res.structured_adjustment is None


def test_no_op_normalization():
    raw = {
        "directive_type": "no_op",
        "applies": True,  # LLM erroneously set applies=True
        "structured_adjustment": {"hours": [1, 2]},  # LLM erroneously provided adjustment
    }
    res = sanitize_directive_entry(raw, 0, 100.0)
    assert res.applies is False
    assert res.directive_type == "no_op"
    assert res.structured_adjustment is None


def test_apply_guardrails_ordering_and_missing_indices():
    # 3 notes, but LLM only returned note 0 and note 2 (skipped note 1)
    raw_list = [
        {"note_index": 2, "directive_type": "no_discharge_window", "structured_adjustment": {"hours": [18, 19]}},
        {"note_index": 0, "directive_type": "solar_reduction", "structured_adjustment": {"hours": [12], "factor": 0.5}},
    ]
    results = apply_guardrails(raw_list, num_notes=3, battery_capacity_kwh=100.0)

    assert len(results) == 3
    assert [r.note_index for r in results] == [0, 1, 2]
    assert results[0].directive_type == "solar_reduction"
    assert results[1].directive_type == "no_op"
    assert results[1].applies is False
    assert results[2].directive_type == "no_discharge_window"


def test_apply_guardrails_duplicate_indices():
    # 2 notes, but LLM returned note_index 0 twice
    raw_list = [
        {"note_index": 0, "directive_type": "no_charge_window", "structured_adjustment": {"hours": [10]}},
        {"note_index": 0, "directive_type": "no_discharge_window", "structured_adjustment": {"hours": [18]}},
    ]
    results = apply_guardrails(raw_list, num_notes=2, battery_capacity_kwh=100.0)
    assert len(results) == 2
    assert results[0].note_index == 0
    assert results[0].directive_type == "no_charge_window"
    assert results[1].note_index == 1
    # Missing index 1 safely repaired
    assert results[1].applies is False or results[1].directive_type in ("no_discharge_window", "no_op")


def test_apply_guardrails_none_or_empty_input():
    results = apply_guardrails(None, num_notes=2, battery_capacity_kwh=100.0)
    assert len(results) == 2
    assert all(r.directive_type == "no_op" and not r.applies for r in results)
