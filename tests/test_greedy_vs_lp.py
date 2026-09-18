"""Test demonstrating why the Linear Programming Optimizer is mathematically superior to a greedy heuristic."""

import pytest
from app.directive_compiler import compile_directives
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import Battery, HourEntry


def test_greedy_suboptimal_vs_lp_global_optimum():
    """Scenario demonstrating how a greedy heuristic makes suboptimal decisions:

    - Battery initial energy = 50 kWh, capacity = 50 kWh, max discharge = 50 kWh.
    - Hour 1: Tariff is 50 BDT/kWh, demand is 50 kWh.
    - Hour 2: Tariff is 100 BDT/kWh, demand is 50 kWh.
    - Hour 22..23: Cheap charging at 5 BDT/kWh to restore end-of-day neutrality.

    A greedy myopic scheduler discharges all 50 kWh at Hour 1 to avoid the 50 BDT tariff,
    leaving the battery empty for Hour 2, forcing a 100 BDT grid purchase.
    Total cost for hours 1 & 2 = (0 * 50) + (50 * 100) = 5000 BDT.

    The LP optimizer recognizes the global horizon:
    It reserves discharge for Hour 2 (avoiding 100 BDT) and buys from the grid at Hour 1 (50 BDT).
    Total cost for hours 1 & 2 = (50 * 50) + (0 * 100) = 2500 BDT.
    Cost savings = 2500 BDT (50% reduction in peak cost)!
    """
    hours = [
        HourEntry(hour=h, demand_kwh=10.0, solar_kwh=0.0, tariff_bdt_per_kwh=10.0)
        for h in range(24)
    ]
    # Set Hour 1 and Hour 2
    hours[1] = HourEntry(hour=1, demand_kwh=50.0, solar_kwh=0.0, tariff_bdt_per_kwh=50.0)
    hours[2] = HourEntry(hour=2, demand_kwh=50.0, solar_kwh=0.0, tariff_bdt_per_kwh=100.0)

    # Recharging hour
    hours[22] = HourEntry(hour=22, demand_kwh=10.0, solar_kwh=0.0, tariff_bdt_per_kwh=4.0)
    hours[23] = HourEntry(hour=23, demand_kwh=10.0, solar_kwh=0.0, tariff_bdt_per_kwh=4.0)

    battery = Battery(
        capacity_kwh=50.0,
        initial_energy_kwh=50.0,
        minimum_energy_kwh=0.0,
        max_charge_kwh_per_hour=50.0,
        max_discharge_kwh_per_hour=50.0,
    )

    constraints = compile_directives([], hours, battery)
    lp_plan = solve_energy_schedule(hours, battery, constraints)
    total_grid, total_cost, peak = replay_and_audit_schedule(lp_plan, hours, battery, constraints)

    # In the LP plan, Hour 2 MUST be discharged (battery_action == 'discharge')
    assert lp_plan[2].battery_action == "discharge"
    assert lp_plan[2].battery_kwh == 50.0
    assert lp_plan[2].grid_kwh == 0.0

    # Hour 1 should be supplied by grid at 50 BDT
    assert lp_plan[1].grid_kwh == 50.0
    assert lp_plan[1].battery_action == "idle"

    # Greedy cost for these two hours alone would be 5000 BDT
    greedy_hours_1_2_cost = (0.0 * 50.0) + (50.0 * 100.0)
    lp_hours_1_2_cost = (lp_plan[1].grid_kwh * 50.0) + (lp_plan[2].grid_kwh * 100.0)

    assert lp_hours_1_2_cost < greedy_hours_1_2_cost
    assert greedy_hours_1_2_cost - lp_hours_1_2_cost == 2500.0
