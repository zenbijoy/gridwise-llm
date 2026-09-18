"""Comprehensive tests for the Independent Replay Engine and Constraint Auditor."""

import pytest
from app.directive_compiler import compile_directives
from app.errors import ReplayValidationError
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import Battery, DirectiveInterpretation, HourlyPlanEntry, HourEntry


@pytest.fixture
def standard_setup():
    hours = [
        HourEntry(hour=h, demand_kwh=100.0, solar_kwh=20.0, tariff_bdt_per_kwh=10.0)
        for h in range(24)
    ]
    battery = Battery(
        capacity_kwh=200.0,
        initial_energy_kwh=100.0,
        minimum_energy_kwh=20.0,
        max_charge_kwh_per_hour=50.0,
        max_discharge_kwh_per_hour=50.0,
    )
    constraints = compile_directives([], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    return hours, battery, constraints, plan


def test_replay_passes_valid_plan(standard_setup):
    hours, battery, constraints, plan = standard_setup
    total_grid, total_cost, peak = replay_and_audit_schedule(plan, hours, battery, constraints)
    assert total_grid > 0
    assert total_cost > 0
    assert peak > 0


def test_replay_fails_on_energy_balance_violation(standard_setup):
    hours, battery, constraints, plan = standard_setup
    # Tamper with hour 5 grid_kwh without adjusting anything else
    tampered_plan = [p.model_copy() for p in plan]
    tampered_plan[5].grid_kwh += 10.0  # Surplus energy not absorbed

    with pytest.raises(ReplayValidationError, match="Energy balance mismatch"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_solar_overuse(standard_setup):
    hours, battery, constraints, plan = standard_setup
    tampered_plan = [p.model_copy() for p in plan]
    # Increase solar_used beyond forecast and decrease grid to keep balance
    tampered_plan[10].solar_used_kwh += 20.0
    tampered_plan[10].grid_kwh -= 20.0

    with pytest.raises(ReplayValidationError, match="exceeds effective solar"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_charge_rate_violation(standard_setup):
    hours, battery, constraints, plan = standard_setup
    tampered_plan = [p.model_copy() for p in plan]
    # Set charge to 70 kWh when max charge is 50 kWh, keeping balance
    tampered_plan[2].battery_action = "charge"
    tampered_plan[2].battery_kwh = 70.0
    tampered_plan[2].grid_kwh = hours[2].demand_kwh + 70.0 - tampered_plan[2].solar_used_kwh

    with pytest.raises(ReplayValidationError, match="exceeds max charge"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_no_charge_window_violation(standard_setup):
    hours, battery, _, plan = standard_setup
    no_charge_dir = DirectiveInterpretation(
        note_index=0, applies=True, directive_type="no_charge_window",
        structured_adjustment={"hours": [0]}, explanation=""
    )
    constraints = compile_directives([no_charge_dir], hours, battery)

    # Force hour 0 to charge while keeping energy balance
    tampered_plan = [p.model_copy() for p in plan]
    tampered_plan[0].battery_action = "charge"
    tampered_plan[0].battery_kwh = 10.0
    # Energy balance: grid + solar == demand + charge -> grid = 100 + 10 - 20 = 90
    tampered_plan[0].grid_kwh = 90.0

    with pytest.raises(ReplayValidationError, match="during no_charge window"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_max_grid_window_violation(standard_setup):
    hours, battery, _, plan = standard_setup
    grid_dir = DirectiveInterpretation(
        note_index=0, applies=True, directive_type="max_grid_window",
        structured_adjustment={"hours": [5], "max_grid_kwh": 30.0}, explanation=""
    )
    constraints = compile_directives([grid_dir], hours, battery)

    tampered_plan = [p.model_copy() for p in plan]
    # Balanced with discharge: grid (50) + solar (20) + discharge (30) = demand (100)
    tampered_plan[5].grid_kwh = 50.0
    tampered_plan[5].battery_action = "discharge"
    tampered_plan[5].battery_kwh = 30.0

    with pytest.raises(ReplayValidationError, match="exceeds max grid limit"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_soc_transition_violation(standard_setup):
    hours, battery, constraints, plan = standard_setup
    tampered_plan = [p.model_copy() for p in plan]
    # State of charge jumps out of nowhere
    tampered_plan[8].battery_energy_after_kwh += 15.0

    with pytest.raises(ReplayValidationError, match="SOC transition mismatch"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)


def test_replay_fails_on_end_of_day_neutrality_broken(standard_setup):
    hours, battery, constraints, plan = standard_setup
    tampered_plan = [p.model_copy() for p in plan]
    # At hour 23, discharge 10 kWh with valid energy balance and valid SOC transition
    prev_soc = tampered_plan[22].battery_energy_after_kwh
    tampered_plan[23].battery_action = "discharge"
    tampered_plan[23].battery_kwh = 10.0
    tampered_plan[23].grid_kwh = hours[23].demand_kwh - tampered_plan[23].solar_used_kwh - 10.0
    tampered_plan[23].battery_energy_after_kwh = prev_soc - 10.0  # Perfectly valid transition!

    with pytest.raises(ReplayValidationError, match="End-of-day neutrality broken"):
        replay_and_audit_schedule(tampered_plan, hours, battery, constraints)
