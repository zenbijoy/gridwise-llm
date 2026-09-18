"""Deterministic guardrails for sanitizing untrusted LLM directive interpretations."""

import math
from typing import Any
from app.schemas import DirectiveInterpretation, DirectiveType

VALID_DIRECTIVE_TYPES: set[str] = {
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
}


def _is_finite_number(val: Any) -> bool:
    """Check if value is a real finite float/int."""
    if not isinstance(val, (int, float)) or isinstance(val, bool):
        return False
    return math.isfinite(float(val))


def _sanitize_hours(raw_hours: Any) -> list[int] | None:
    """Validate and normalize hours list: unique ints 0..23, sorted ascending, non-empty."""
    if not isinstance(raw_hours, list) or len(raw_hours) == 0:
        return None

    cleaned_hours: set[int] = set()
    for h in raw_hours:
        # Reject booleans, floats, strings, None
        if not isinstance(h, int) or isinstance(h, bool):
            return None
        if h < 0 or h > 23:
            return None
        cleaned_hours.add(h)

    if not cleaned_hours:
        return None

    return sorted(cleaned_hours)


def _make_no_op(note_index: int, explanation: str = "No supported scheduling constraint was identified.") -> DirectiveInterpretation:
    """Create a standardized, compliant no_op directive entry."""
    return DirectiveInterpretation(
        note_index=note_index,
        applies=False,
        directive_type="no_op",
        structured_adjustment=None,
        explanation=explanation or "No supported scheduling constraint was identified.",
    )


def sanitize_directive_entry(
    entry: dict[str, Any],
    expected_index: int,
    battery_capacity_kwh: float,
) -> DirectiveInterpretation:
    """Sanitize a single raw directive dictionary into a guaranteed-valid DirectiveInterpretation."""
    if not isinstance(entry, dict):
        return _make_no_op(expected_index, "Malformed entry received from interpreter.")

    raw_type = entry.get("directive_type")
    explanation = str(entry.get("explanation") or "").strip()

    if raw_type not in VALID_DIRECTIVE_TYPES or raw_type == "no_op":
        return _make_no_op(expected_index, explanation or "No supported scheduling constraint was identified.")

    raw_adj = entry.get("structured_adjustment")
    if not isinstance(raw_adj, dict):
        return _make_no_op(expected_index, "Missing structured adjustment.")

    # Validate hours array
    hours = _sanitize_hours(raw_adj.get("hours"))
    if hours is None:
        return _make_no_op(expected_index, "Invalid or missing hours in directive.")

    directive_type: DirectiveType = raw_type

    if directive_type == "solar_reduction":
        raw_factor = raw_adj.get("factor")
        if not _is_finite_number(raw_factor):
            return _make_no_op(expected_index, "Invalid solar factor (non-numeric or non-finite).")
        factor = float(raw_factor)
        if factor < 0.0 or factor > 1.0:
            return _make_no_op(expected_index, f"Solar factor out of bounds [0, 1]: {factor}")
        return DirectiveInterpretation(
            note_index=expected_index,
            applies=True,
            directive_type="solar_reduction",
            structured_adjustment={"hours": hours, "factor": round(factor, 6)},
            explanation=explanation or f"Usable solar reduced to factor {factor} for hours {hours}.",
        )

    elif directive_type == "minimum_battery_reserve":
        raw_min = raw_adj.get("minimum_energy_kwh")
        if not _is_finite_number(raw_min):
            return _make_no_op(expected_index, "Invalid reserve energy (non-numeric or non-finite).")
        min_kwh = float(raw_min)
        if min_kwh < 0.0 or min_kwh > battery_capacity_kwh:
            return _make_no_op(
                expected_index,
                f"Reserve energy out of bounds [0, {battery_capacity_kwh}]: {min_kwh}",
            )
        return DirectiveInterpretation(
            note_index=expected_index,
            applies=True,
            directive_type="minimum_battery_reserve",
            structured_adjustment={"hours": hours, "minimum_energy_kwh": round(min_kwh, 6)},
            explanation=explanation or f"Minimum battery reserve of {min_kwh} kWh required for hours {hours}.",
        )

    elif directive_type == "no_charge_window":
        return DirectiveInterpretation(
            note_index=expected_index,
            applies=True,
            directive_type="no_charge_window",
            structured_adjustment={"hours": hours},
            explanation=explanation or f"Battery charging prohibited during hours {hours}.",
        )

    elif directive_type == "no_discharge_window":
        return DirectiveInterpretation(
            note_index=expected_index,
            applies=True,
            directive_type="no_discharge_window",
            structured_adjustment={"hours": hours},
            explanation=explanation or f"Battery discharging prohibited during hours {hours}.",
        )

    elif directive_type == "max_grid_window":
        raw_max = raw_adj.get("max_grid_kwh")
        if not _is_finite_number(raw_max):
            return _make_no_op(expected_index, "Invalid max grid limit (non-numeric or non-finite).")
        max_kwh = float(raw_max)
        if max_kwh < 0.0:
            return _make_no_op(expected_index, f"Negative grid limit not permitted: {max_kwh}")
        return DirectiveInterpretation(
            note_index=expected_index,
            applies=True,
            directive_type="max_grid_window",
            structured_adjustment={"hours": hours, "max_grid_kwh": round(max_kwh, 6)},
            explanation=explanation or f"Grid import capped at {max_kwh} kWh for hours {hours}.",
        )

    return _make_no_op(expected_index, "Unhandled directive condition.")


def apply_guardrails(
    raw_directives: list[Any] | None,
    num_notes: int,
    battery_capacity_kwh: float,
) -> list[DirectiveInterpretation]:
    """Sanitize, normalize, and repair raw LLM output into a strict list of DirectiveInterpretation.

    Guarantees:
    1. Returns exactly num_notes entries.
    2. note_index values are strictly [0, 1, ..., num_notes - 1].
    3. Every entry adheres to Pydantic validation.
    4. Applies semantics: True for non-no_op, False for no_op.
    5. Missing, malformed, or out-of-bounds directives are safely demoted to no_op.
    """
    if not isinstance(raw_directives, list):
        raw_directives = []

    # Map candidate entries by their stated note_index
    candidates_by_index: dict[int, dict[str, Any]] = {}
    unindexed_entries: list[dict[str, Any]] = []

    for item in raw_directives:
        if not isinstance(item, dict):
            continue
        idx = item.get("note_index")
        if isinstance(idx, int) and not isinstance(idx, bool) and 0 <= idx < num_notes:
            if idx not in candidates_by_index:
                candidates_by_index[idx] = item
        else:
            unindexed_entries.append(item)

    # For any missing index, check if an unindexed entry can fill the slot
    for i in range(num_notes):
        if i not in candidates_by_index and unindexed_entries:
            candidates_by_index[i] = unindexed_entries.pop(0)

    # Now construct and sanitize each entry strictly for index 0..num_notes-1
    result: list[DirectiveInterpretation] = []
    for i in range(num_notes):
        raw_entry = candidates_by_index.get(i, {})
        sanitized = sanitize_directive_entry(
            entry=raw_entry,
            expected_index=i,
            battery_capacity_kwh=battery_capacity_kwh,
        )
        result.append(sanitized)

    return result
