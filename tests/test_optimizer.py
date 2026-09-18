"""Comprehensive unit tests for PuLP + CBC linear programming optimization engine."""

import pytest
from app.directive_compiler import compile_directives
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import Battery, DirectiveInterpretation, HourEntry


def make_flat_hours(demand=100.0, solar=0.0, tariff=10.0) -> list[HourEntry]:
    """Helper to generate 24 identical hours."""
    return [
        HourEntry(hour=h, demand_kwh=demand, solar_kwh=solar, tariff_bdt_per_kwh=tariff)
        for h in range(24)
    ]


def default_battery(
    capacity=200.0,
    initial=100.0,
    minimum=20.0,
    max_charge=50.0,
    max_discharge=50.0,
) -> Battery:
    return Battery(
        capacity_kwh=capacity,
        initial_energy_kwh=initial,
        minimum_energy_kwh=minimum,
        max_charge_kwh_per_hour=max_charge,
        max_discharge_kwh_per_hour=max_discharge,
    )


def test_solar_only_scenario():
    # Solar generation is equal to demand across all hours
    hours = [
        HourEntry(hour=h, demand_kwh=80.0, solar_kwh=80.0, tariff_bdt_per_kwh=10.0)
        for h in range(24)
    ]
    battery = default_battery()
    constraints = compile_directives([], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    total_grid, total_cost, peak = replay_and_audit_schedule(plan, hours, battery, constraints)

    assert total_grid == 0.0
    assert total_cost == 0.0
    assert peak == 0.0
    for p in plan:
        assert p.grid_kwh == 0.0
        assert p.solar_used_kwh == 80.0
        assert p.battery_action == "idle"


def test_grid_only_scenario():
    # Zero solar, zero battery movement possible
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=8.0)
    battery = default_battery(capacity=100.0, initial=20.0, minimum=20.0, max_charge=0.0, max_discharge=0.0)
    constraints = compile_directives([], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    total_grid, total_cost, peak = replay_and_audit_schedule(plan, hours, battery, constraints)

    assert total_grid == 2400.0
    assert total_cost == 2400.0 * 8.0
    assert peak == 100.0


def test_battery_arbitrage_cheap_charge_expensive_discharge():
    # Tariff is 5 BDT during hours 0..3, 25 BDT during hours 18..21, 10 BDT elsewhere
    hours = make_flat_hours(demand=50.0, solar=0.0, tariff=10.0)
    for h in range(0, 4):
        hours[h] = HourEntry(hour=h, demand_kwh=50.0, solar_kwh=0.0, tariff_bdt_per_kwh=5.0)
    for h in range(18, 22):
        hours[h] = HourEntry(hour=h, demand_kwh=50.0, solar_kwh=0.0, tariff_bdt_per_kwh=25.0)

    battery = default_battery(capacity=200.0, initial=100.0, minimum=20.0, max_charge=50.0, max_discharge=50.0)
    constraints = compile_directives([], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    total_grid, total_cost, peak = replay_and_audit_schedule(plan, hours, battery, constraints)

    # Optimizer should discharge during expensive hours 18..21 to avoid grid
    expensive_grid = sum(plan[h].grid_kwh for h in range(18, 22))
    assert expensive_grid < 4 * 50.0  # Successfully shaved peak
    # And battery must end at initial 100 kWh
    assert plan[23].battery_energy_after_kwh == 100.0


def test_no_charge_window_constraint():
    # Hour 2 is very cheap, but no_charge_window is enforced on hours [2, 3]
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=15.0)
    hours[2] = HourEntry(hour=2, demand_kwh=100.0, solar_kwh=0.0, tariff_bdt_per_kwh=2.0)
    hours[3] = HourEntry(hour=3, demand_kwh=100.0, solar_kwh=0.0, tariff_bdt_per_kwh=2.0)

    battery = default_battery()
    no_charge_directive = DirectiveInterpretation(
        note_index=0,
        applies=True,
        directive_type="no_charge_window",
        structured_adjustment={"hours": [2, 3]},
        explanation="Maintenance",
    )
    constraints = compile_directives([no_charge_directive], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[2].battery_action != "charge"
    assert plan[2].battery_kwh == 0.0
    assert plan[3].battery_action != "charge"
    assert plan[3].battery_kwh == 0.0


def test_no_discharge_window_constraint():
    # Hours 18..20 are very expensive, but no_discharge_window is enforced on [18, 19, 20]
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=10.0)
    for h in [18, 19, 20]:
        hours[h] = HourEntry(hour=h, demand_kwh=100.0, solar_kwh=0.0, tariff_bdt_per_kwh=30.0)

    battery = default_battery()
    no_discharge_directive = DirectiveInterpretation(
        note_index=0,
        applies=True,
        directive_type="no_discharge_window",
        structured_adjustment={"hours": [18, 19, 20]},
        explanation="Grid requirement",
    )
    constraints = compile_directives([no_discharge_directive], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    for h in [18, 19, 20]:
        assert plan[h].battery_action != "discharge"


def test_max_grid_window_constraint():
    # Demand is 100, but grid is capped at 40 during hour 15
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=10.0)
    battery = default_battery(capacity=200.0, initial=100.0, max_discharge=70.0)
    max_grid_directive = DirectiveInterpretation(
        note_index=0,
        applies=True,
        directive_type="max_grid_window",
        structured_adjustment={"hours": [15], "max_grid_kwh": 40.0},
        explanation="Transformer limit",
    )
    constraints = compile_directives([max_grid_directive], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[15].grid_kwh <= 40.0 + 1e-4
    assert plan[15].battery_action == "discharge"
    assert plan[15].battery_kwh >= 59.9


def test_solar_reduction_curtailment():
    # Base solar is 100 kWh, factor is 0.20 -> effective solar is 20 kWh
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=10.0)
    hours[12] = HourEntry(hour=12, demand_kwh=100.0, solar_kwh=100.0, tariff_bdt_per_kwh=10.0)
    battery = default_battery()
    solar_dir = DirectiveInterpretation(
        note_index=0,
        applies=True,
        directive_type="solar_reduction",
        structured_adjustment={"hours": [12], "factor": 0.20},
        explanation="Dust storm",
    )
    constraints = compile_directives([solar_dir], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[12].solar_used_kwh <= 20.0 + 1e-4


def test_minimum_battery_reserve_constraint():
    # High reserve required at evening hours
    hours = make_flat_hours(demand=80.0, solar=0.0, tariff=10.0)
    hours[19] = HourEntry(hour=19, demand_kwh=80.0, solar_kwh=0.0, tariff_bdt_per_kwh=50.0)
    battery = default_battery(capacity=200.0, initial=100.0, minimum=20.0)
    reserve_dir = DirectiveInterpretation(
        note_index=0,
        applies=True,
        directive_type="minimum_battery_reserve",
        structured_adjustment={"hours": [19], "minimum_energy_kwh": 90.0},
        explanation="Emergency backup",
    )
    constraints = compile_directives([reserve_dir], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[19].battery_energy_after_kwh >= 90.0 - 1e-4


def test_overlapping_directives():
    # Multiple overlapping directives in the same hour
    hours = make_flat_hours(demand=100.0, solar=100.0, tariff=15.0)
    battery = default_battery(capacity=200.0, initial=100.0, minimum=20.0)

    # Two solar reductions: 0.8 and 0.5 -> effective = 100 * 0.8 * 0.5 = 40
    d1 = DirectiveInterpretation(
        note_index=0, applies=True, directive_type="solar_reduction",
        structured_adjustment={"hours": [12], "factor": 0.8}, explanation="Note 1"
    )
    d2 = DirectiveInterpretation(
        note_index=1, applies=True, directive_type="solar_reduction",
        structured_adjustment={"hours": [12], "factor": 0.5}, explanation="Note 2"
    )
    d3 = DirectiveInterpretation(
        note_index=2, applies=True, directive_type="minimum_battery_reserve",
        structured_adjustment={"hours": [12], "minimum_energy_kwh": 80.0}, explanation="Note 3"
    )

    constraints = compile_directives([d1, d2, d3], hours, battery)
    assert constraints.effective_solar[12] == 40.0
    assert constraints.reserve[12] == 80.0

    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)
    assert plan[12].solar_used_kwh <= 40.0 + 1e-4
    assert plan[12].battery_energy_after_kwh >= 80.0 - 1e-4


def test_no_charge_and_no_discharge_forces_idle():
    # Hour 10 has both no_charge and no_discharge
    hours = make_flat_hours(demand=100.0, solar=0.0, tariff=10.0)
    battery = default_battery()
    d1 = DirectiveInterpretation(
        note_index=0, applies=True, directive_type="no_charge_window",
        structured_adjustment={"hours": [10]}, explanation=""
    )
    d2 = DirectiveInterpretation(
        note_index=1, applies=True, directive_type="no_discharge_window",
        structured_adjustment={"hours": [10]}, explanation=""
    )
    constraints = compile_directives([d1, d2], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[10].battery_action == "idle"
    assert plan[10].battery_kwh == 0.0


def test_end_of_day_neutrality():
    hours = make_flat_hours(demand=120.0, solar=20.0, tariff=12.0)
    battery = default_battery(capacity=300.0, initial=150.0, minimum=30.0)
    constraints = compile_directives([], hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)
    replay_and_audit_schedule(plan, hours, battery, constraints)

    assert plan[23].battery_energy_after_kwh == 150.0
