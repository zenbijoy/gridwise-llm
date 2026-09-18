"""Compile normalized directives into 24-hour mathematical constraint vectors."""

from dataclasses import dataclass
from app.schemas import DirectiveInterpretation, HourEntry, Battery


@dataclass(frozen=True)
class CompiledConstraints:
    """Compiled hourly constraint vectors for the 24-hour planning horizon."""
    effective_solar: list[float]
    reserve: list[float]
    charge_allowed: list[bool]
    discharge_allowed: list[bool]
    grid_limit: list[float]  # math.inf indicates no grid limit


def compile_directives(
    directives: list[DirectiveInterpretation],
    hours: list[HourEntry],
    battery: Battery,
) -> CompiledConstraints:
    """Transform sanitized directives into 24 hourly constraint arrays.

    Handles overlapping directives deterministically:
    - Multiple solar reductions: multiplicative cumulative factor (base * f1 * f2 ...).
    - Multiple minimum reserves: max(base_min, r1, r2, ...).
    - Multiple charge prohibitions: logical OR (charge disabled if ANY applies).
    - Multiple discharge prohibitions: logical OR (discharge disabled if ANY applies).
    - Multiple grid caps: min(g1, g2, ...).
    """
    num_hours = 24
    sorted_hours = sorted(hours, key=lambda x: x.hour)

    # Initialize baseline vectors
    effective_solar = [entry.solar_kwh for entry in sorted_hours]
    reserve = [battery.minimum_energy_kwh for _ in range(num_hours)]
    charge_allowed = [True for _ in range(num_hours)]
    discharge_allowed = [True for _ in range(num_hours)]
    grid_limit = [float("inf") for _ in range(num_hours)]

    # Apply directives
    for directive in directives:
        if not directive.applies or directive.directive_type == "no_op":
            continue

        adj = directive.structured_adjustment or {}
        target_hours: list[int] = adj.get("hours", [])

        if directive.directive_type == "solar_reduction":
            factor = float(adj.get("factor", 1.0))
            for h in target_hours:
                if 0 <= h < num_hours:
                    effective_solar[h] *= factor

        elif directive.directive_type == "minimum_battery_reserve":
            min_kwh = float(adj.get("minimum_energy_kwh", battery.minimum_energy_kwh))
            for h in target_hours:
                if 0 <= h < num_hours:
                    reserve[h] = max(reserve[h], min_kwh)

        elif directive.directive_type == "no_charge_window":
            for h in target_hours:
                if 0 <= h < num_hours:
                    charge_allowed[h] = False

        elif directive.directive_type == "no_discharge_window":
            for h in target_hours:
                if 0 <= h < num_hours:
                    discharge_allowed[h] = False

        elif directive.directive_type == "max_grid_window":
            max_kwh = float(adj.get("max_grid_kwh", float("inf")))
            for h in target_hours:
                if 0 <= h < num_hours:
                    grid_limit[h] = min(grid_limit[h], max_kwh)

    # Clean floating point precision on effective solar
    effective_solar = [round(max(0.0, s), 6) for s in effective_solar]
    reserve = [round(min(battery.capacity_kwh, max(battery.minimum_energy_kwh, r)), 6) for r in reserve]

    return CompiledConstraints(
        effective_solar=effective_solar,
        reserve=reserve,
        charge_allowed=charge_allowed,
        discharge_allowed=discharge_allowed,
        grid_limit=grid_limit,
    )
