"""PuLP + CBC Linear Programming Optimizer for 24-Hour Campus Energy Scheduling."""

import pulp
from app.config import EPS, SOLVER_TIMEOUT_SECONDS
from app.directive_compiler import CompiledConstraints
from app.errors import OptimizerInfeasibleError
from app.schemas import Battery, HourlyPlanEntry, HourEntry


def solve_energy_schedule(
    hours: list[HourEntry],
    battery: Battery,
    constraints: CompiledConstraints,
) -> list[HourlyPlanEntry]:
    """Formulate and solve the 24-hour energy scheduling LP problem.

    Accepts ONLY 'Optimal' solver status.
    Returns a list of 24 HourlyPlanEntry objects.
    """
    sorted_hours = sorted(hours, key=lambda x: x.hour)
    num_hours = len(sorted_hours)

    prob = pulp.LpProblem("GridWiseEnergyOptimization", pulp.LpMinimize)

    # Decision variables
    grid = [pulp.LpVariable(f"grid_{h}", lowBound=0.0) for h in range(num_hours)]
    solar_used = [pulp.LpVariable(f"solar_used_{h}", lowBound=0.0) for h in range(num_hours)]
    charge = [pulp.LpVariable(f"charge_{h}", lowBound=0.0) for h in range(num_hours)]
    discharge = [pulp.LpVariable(f"discharge_{h}", lowBound=0.0) for h in range(num_hours)]
    soc = [pulp.LpVariable(f"soc_{h}", lowBound=0.0) for h in range(num_hours)]

    # Objective function: minimize total grid electricity cost.
    # A negligible tie-breaker (1e-6) on charge/discharge prevents degenerate simultaneous
    # charging and discharging at zero marginal cost without altering the primary grid cost.
    prob += pulp.lpSum(
        grid[h] * sorted_hours[h].tariff_bdt_per_kwh + 1e-6 * (charge[h] + discharge[h])
        for h in range(num_hours)
    )

    # Add constraints for each hour
    for h in range(num_hours):
        demand = sorted_hours[h].demand_kwh
        eff_solar = constraints.effective_solar[h]
        active_reserve = constraints.reserve[h]
        max_grid = constraints.grid_limit[h]

        # 1. Energy balance equation
        prob += grid[h] + solar_used[h] + discharge[h] == demand + charge[h]

        # 2. Solar usage limit
        prob += solar_used[h] <= eff_solar

        # 3. Battery charge rate limit and prohibition window
        if constraints.charge_allowed[h]:
            prob += charge[h] <= battery.max_charge_kwh_per_hour
        else:
            prob += charge[h] == 0.0

        # 4. Battery discharge rate limit and prohibition window
        if constraints.discharge_allowed[h]:
            prob += discharge[h] <= battery.max_discharge_kwh_per_hour
        else:
            prob += discharge[h] == 0.0

        # 5. Grid import limit
        if max_grid < float("inf"):
            prob += grid[h] <= max_grid

        # 6. Battery state of charge transition
        if h == 0:
            prob += soc[0] == battery.initial_energy_kwh + charge[0] - discharge[0]
        else:
            prob += soc[h] == soc[h - 1] + charge[h] - discharge[h]

        # 7. Battery state of charge bounds
        prob += soc[h] >= active_reserve
        prob += soc[h] <= battery.capacity_kwh

    # 8. End-of-day neutrality: final SOC must equal initial SOC
    prob += soc[num_hours - 1] == battery.initial_energy_kwh

    # Solve using CBC solver
    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=SOLVER_TIMEOUT_SECONDS)
    prob.solve(solver)
    status_str = pulp.LpStatus.get(prob.status, "Unknown")

    if status_str != "Optimal":
        raise OptimizerInfeasibleError(
            f"LP optimization did not achieve Optimal status (status={status_str})"
        )

    # Extract and clean variable values
    hourly_plan: list[HourlyPlanEntry] = []

    for h in range(num_hours):
        raw_grid = float(pulp.value(grid[h]) or 0.0)
        raw_solar = float(pulp.value(solar_used[h]) or 0.0)
        raw_charge = float(pulp.value(charge[h]) or 0.0)
        raw_discharge = float(pulp.value(discharge[h]) or 0.0)
        raw_soc = float(pulp.value(soc[h]) or 0.0)

        # Eliminate floating-point dust
        g_val = 0.0 if raw_grid < EPS else raw_grid
        s_val = 0.0 if raw_solar < EPS else raw_solar
        c_val = 0.0 if raw_charge < EPS else raw_charge
        d_val = 0.0 if raw_discharge < EPS else raw_discharge
        soc_val = 0.0 if raw_soc < EPS else raw_soc

        # Eliminate any simultaneous degenerate charge/discharge
        if c_val > EPS and d_val > EPS:
            net = c_val - d_val
            if net > EPS:
                c_val = net
                d_val = 0.0
            elif net < -EPS:
                c_val = 0.0
                d_val = -net
            else:
                c_val = 0.0
                d_val = 0.0

        # Determine battery action and magnitude
        if c_val > EPS:
            action = "charge"
            bat_kwh = c_val
        elif d_val > EPS:
            action = "discharge"
            bat_kwh = d_val
        else:
            action = "idle"
            bat_kwh = 0.0

        hourly_plan.append(
            HourlyPlanEntry(
                hour=h,
                grid_kwh=round(g_val, 4),
                solar_used_kwh=round(s_val, 4),
                battery_action=action,
                battery_kwh=round(bat_kwh, 4),
                battery_energy_after_kwh=round(soc_val, 4),
            )
        )

    return hourly_plan
