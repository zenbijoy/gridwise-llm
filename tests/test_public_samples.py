"""Tests executing all 10 official BUP CSE Fest public sample cases."""

import json
import pytest

from app.config import BASE_DIR, REPORT_TOL
from app.directive_compiler import compile_directives
from app.guardrails import apply_guardrails
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import DirectiveInterpretation, OptimizeRequest, OptimizeResponse


def load_public_sample_cases() -> list[dict]:
    sample_file = BASE_DIR / "BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json"
    if not sample_file.exists():
        pytest.skip(f"Public sample file not found at {sample_file}")
    with open(sample_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("cases", [])


@pytest.mark.parametrize("case", load_public_sample_cases(), ids=lambda c: c["id"])
def test_public_sample_case_optimization_and_replay(case):
    """Validate that the optimizer and independent replay engine produce exact, constraint-compliant,

    cost-minimal solutions matching the official public reference cases within official tolerance.
    """
    case_id = case["id"]
    inp = case["input"]
    expected = case["expected_output"]

    # 1. Pydantic request validation
    req = OptimizeRequest(**inp)
    assert req.scenario_id == case_id
    assert len(req.hours) == 24

    # 2. Use the official expected directive interpretations
    expected_dirs = [DirectiveInterpretation(**d) for d in expected["directive_interpretation"]]

    # Ensure directives pass guardrails cleanly
    sanitized_dirs = apply_guardrails(
        [d.model_dump() for d in expected_dirs],
        num_notes=len(req.operator_notes),
        battery_capacity_kwh=req.battery.capacity_kwh,
    )
    assert len(sanitized_dirs) == len(req.operator_notes)

    # 3. Compile directives
    constraints = compile_directives(sanitized_dirs, req.hours, req.battery)

    # 4. Run PuLP + CBC optimizer
    hourly_plan = solve_energy_schedule(req.hours, req.battery, constraints)
    assert len(hourly_plan) == 24

    # 5. Independent replay audit & total recalculation
    total_grid, total_cost, peak_grid = replay_and_audit_schedule(
        hourly_plan=hourly_plan,
        hours=req.hours,
        battery=req.battery,
        constraints=constraints,
    )

    # 6. Verify against reference optimal values within official tolerance
    exp_cost = expected["total_cost_bdt"]
    exp_grid = expected["total_grid_kwh"]

    assert abs(total_cost - exp_cost) <= REPORT_TOL, (
        f"Case {case_id}: Cost mismatch. Got {total_cost:.4f}, expected {exp_cost:.4f} (diff={abs(total_cost - exp_cost)})"
    )
    assert abs(total_grid - exp_grid) <= REPORT_TOL, (
        f"Case {case_id}: Total grid mismatch. Got {total_grid:.4f}, expected {exp_grid:.4f} (diff={abs(total_grid - exp_grid)})"
    )

    # Peak grid must strictly match the maximum of the generated hourly plan
    plan_max_grid = max(p.grid_kwh for p in hourly_plan)
    assert abs(peak_grid - plan_max_grid) <= REPORT_TOL, (
        f"Case {case_id}: Peak grid internal mismatch. Got {peak_grid}, expected {plan_max_grid}"
    )

    # 7. Response schema validation
    resp = OptimizeResponse(
        scenario_id=req.scenario_id,
        directive_interpretation=sanitized_dirs,
        hourly_plan=hourly_plan,
        total_grid_kwh=total_grid,
        total_cost_bdt=total_cost,
        peak_grid_kwh=peak_grid,
        plan_summary=expected.get("plan_summary", "Plan summary"),
    )
    assert resp.scenario_id == case_id
