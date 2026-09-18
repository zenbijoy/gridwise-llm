"""Independent Replay Engine and Constraint Auditor for GridWise schedules."""

from app.config import REPORT_TOL
from app.directive_compiler import CompiledConstraints
from app.errors import ReplayValidationError
from app.schemas import Battery, HourlyPlanEntry, HourEntry


def replay_and_audit_schedule(
    hourly_plan: list[HourlyPlanEntry],
    hours: list[HourEntry],
    battery: Battery,
    constraints: CompiledConstraints,
) -> tuple[float, float, float]:
    """Independently audit and verify the public 24-hour hourly plan.

    Verifies:
    1. Exactly 24 entries in hour order 0..23.
    2. Energy balance for every hour.
    3. Solar usage does not exceed effective solar forecast.
    4. Charge and discharge rate limits.
    5. No-charge, no-discharge, and max-grid directive compliance.
    6. Battery SOC transition equation.
    7. Battery reserve and capacity bounds.
    8. End-of-day neutrality (SOC at hour 23 == initial energy).

    Returns:
        tuple of recalculated (total_grid_kwh, total_cost_bdt, peak_grid_kwh).
    Raises:
        ReplayValidationError on any constraint violation.
    """
    if len(hourly_plan) != 24:
        raise ReplayValidationError(f"Expected 24 hourly plan entries, got {len(hourly_plan)}")

    sorted_hours = sorted(hours, key=lambda x: x.hour)
    prev_soc = battery.initial_energy_kwh

    for h in range(24):
        plan_entry = hourly_plan[h]
        hour_data = sorted_hours[h]

        if plan_entry.hour != h:
            raise ReplayValidationError(f"Expected plan entry for hour {h}, got hour {plan_entry.hour}")

        grid = plan_entry.grid_kwh
        solar = plan_entry.solar_used_kwh
        action = plan_entry.battery_action
        bat_kwh = plan_entry.battery_kwh
        soc = plan_entry.battery_energy_after_kwh

        # Check non-negativity
        if grid < -REPORT_TOL:
            raise ReplayValidationError(f"Negative grid energy at hour {h}: {grid}")
        if solar < -REPORT_TOL:
            raise ReplayValidationError(f"Negative solar energy at hour {h}: {solar}")
        if bat_kwh < -REPORT_TOL:
            raise ReplayValidationError(f"Negative battery kWh at hour {h}: {bat_kwh}")

        # Action consistency
        if action == "idle":
            if bat_kwh > REPORT_TOL:
                raise ReplayValidationError(f"Idle action with non-zero battery_kwh ({bat_kwh}) at hour {h}")
            charge_kwh = 0.0
            discharge_kwh = 0.0
        elif action == "charge":
            charge_kwh = bat_kwh
            discharge_kwh = 0.0
        elif action == "discharge":
            charge_kwh = 0.0
            discharge_kwh = bat_kwh
        else:
            raise ReplayValidationError(f"Unknown battery action '{action}' at hour {h}")

        # 1. Energy balance: grid + solar + discharge == demand + charge
        left_side = grid + solar + discharge_kwh
        right_side = hour_data.demand_kwh + charge_kwh
        if abs(left_side - right_side) > REPORT_TOL:
            raise ReplayValidationError(
                f"Energy balance mismatch at hour {h}: supply={left_side:.4f}, demand+charge={right_side:.4f} "
                f"(diff={abs(left_side - right_side):.4f} > {REPORT_TOL})"
            )

        # 2. Solar usage <= effective solar
        eff_solar = constraints.effective_solar[h]
        if solar > eff_solar + REPORT_TOL:
            raise ReplayValidationError(
                f"Solar used ({solar:.4f}) exceeds effective solar ({eff_solar:.4f}) at hour {h}"
            )

        # 3. Rate limits
        if charge_kwh > battery.max_charge_kwh_per_hour + REPORT_TOL:
            raise ReplayValidationError(
                f"Charge ({charge_kwh:.4f}) exceeds max charge ({battery.max_charge_kwh_per_hour}) at hour {h}"
            )
        if discharge_kwh > battery.max_discharge_kwh_per_hour + REPORT_TOL:
            raise ReplayValidationError(
                f"Discharge ({discharge_kwh:.4f}) exceeds max discharge ({battery.max_discharge_kwh_per_hour}) at hour {h}"
            )

        # 4. Window directives
        if not constraints.charge_allowed[h] and charge_kwh > REPORT_TOL:
            raise ReplayValidationError(f"Battery charged ({charge_kwh:.4f}) during no_charge window at hour {h}")
        if not constraints.discharge_allowed[h] and discharge_kwh > REPORT_TOL:
            raise ReplayValidationError(f"Battery discharged ({discharge_kwh:.4f}) during no_discharge window at hour {h}")
        if grid > constraints.grid_limit[h] + REPORT_TOL:
            raise ReplayValidationError(
                f"Grid purchase ({grid:.4f}) exceeds max grid limit ({constraints.grid_limit[h]:.4f}) at hour {h}"
            )

        # 5. SOC transition
        expected_soc = prev_soc + charge_kwh - discharge_kwh
        if abs(soc - expected_soc) > REPORT_TOL:
            raise ReplayValidationError(
                f"SOC transition mismatch at hour {h}: reported={soc:.4f}, expected={expected_soc:.4f}"
            )

        # 6. Battery bounds (reserve and capacity)
        req_reserve = constraints.reserve[h]
        if soc < req_reserve - REPORT_TOL:
            raise ReplayValidationError(
                f"Battery energy ({soc:.4f}) below reserve ({req_reserve:.4f}) at hour {h}"
            )
        if soc > battery.capacity_kwh + REPORT_TOL:
            raise ReplayValidationError(
                f"Battery energy ({soc:.4f}) exceeds capacity ({battery.capacity_kwh:.4f}) at hour {h}"
            )

        prev_soc = soc

    # 7. End-of-day neutrality
    final_soc = hourly_plan[23].battery_energy_after_kwh
    if abs(final_soc - battery.initial_energy_kwh) > REPORT_TOL:
        raise ReplayValidationError(
            f"End-of-day neutrality broken: final SOC={final_soc:.4f} != initial={battery.initial_energy_kwh:.4f}"
        )

    # 8. Recalculate totals directly from public hourly_plan
    total_grid = round(sum(entry.grid_kwh for entry in hourly_plan), 4)
    total_cost = round(
        sum(entry.grid_kwh * sorted_hours[h].tariff_bdt_per_kwh for h, entry in enumerate(hourly_plan)),
        4,
    )
    peak_grid = round(max(entry.grid_kwh for entry in hourly_plan), 4)

    return total_grid, total_cost, peak_grid
