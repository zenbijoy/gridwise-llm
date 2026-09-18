"""Randomized property-based testing of feasible energy scenarios."""

import random
import pytest

from app.config import REPORT_TOL
from app.directive_compiler import compile_directives
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import Battery, DirectiveInterpretation, HourEntry


@pytest.mark.parametrize("seed", [42, 101, 2024, 9999, 12345])
def test_randomized_feasible_scenarios(seed):
    """Generate randomized feasible 24-hour configurations and verify that the LP solver

    and independent replay auditor consistently satisfy all mathematical invariants.
    """
    rng = random.Random(seed)

    # Generate hours with varying demand, solar, and tariff
    hours: list[HourEntry] = []
    for h in range(24):
        demand = rng.uniform(40.0, 200.0)
        # Solar active midday
        solar = rng.uniform(20.0, 150.0) if 7 <= h <= 17 else 0.0
        tariff = rng.uniform(4.0, 30.0)
        hours.append(
            HourEntry(
                hour=h,
                demand_kwh=round(demand, 2),
                solar_kwh=round(solar, 2),
                tariff_bdt_per_kwh=round(tariff, 2),
            )
        )

    # Battery parameters
    cap = rng.uniform(100.0, 500.0)
    init = rng.uniform(20.0, cap * 0.8)
    min_res = rng.uniform(0.0, init * 0.5)
    max_c = rng.uniform(20.0, 100.0)
    max_d = rng.uniform(20.0, 100.0)

    battery = Battery(
        capacity_kwh=round(cap, 2),
        initial_energy_kwh=round(init, 2),
        minimum_energy_kwh=round(min_res, 2),
        max_charge_kwh_per_hour=round(max_c, 2),
        max_discharge_kwh_per_hour=round(max_d, 2),
    )

    # Random directive
    directives = []
    choice = rng.choice(["solar", "reserve", "no_charge", "none"])
    if choice == "solar":
        directives.append(
            DirectiveInterpretation(
                note_index=0,
                applies=True,
                directive_type="solar_reduction",
                structured_adjustment={"hours": [12, 13], "factor": 0.5},
                explanation="Random solar curtailment",
            )
        )
    elif choice == "reserve":
        directives.append(
            DirectiveInterpretation(
                note_index=0,
                applies=True,
                directive_type="minimum_battery_reserve",
                structured_adjustment={"hours": [18, 19], "minimum_energy_kwh": round(min_res * 1.5, 2)},
                explanation="Random reserve increase",
            )
        )
    elif choice == "no_charge":
        directives.append(
            DirectiveInterpretation(
                note_index=0,
                applies=True,
                directive_type="no_charge_window",
                structured_adjustment={"hours": [14, 15]},
                explanation="Random charge restriction",
            )
        )

    constraints = compile_directives(directives, hours, battery)
    plan = solve_energy_schedule(hours, battery, constraints)

    # Full audit
    total_grid, total_cost, peak_grid = replay_and_audit_schedule(
        hourly_plan=plan,
        hours=hours,
        battery=battery,
        constraints=constraints,
    )

    assert total_grid >= 0.0
    assert total_cost >= 0.0
    assert peak_grid >= 0.0
    assert abs(plan[23].battery_energy_after_kwh - battery.initial_energy_kwh) <= REPORT_TOL
