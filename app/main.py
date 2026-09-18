"""FastAPI application for GridWise LLM - 24-Hour Campus Energy Scheduling API."""

import logging
import time
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import REPORT_TOL
from app.directive_compiler import compile_directives
from app.errors import InvalidInputError, OptimizerInfeasibleError, ReplayValidationError
from app.guardrails import apply_guardrails
from app.llm_interpreter import interpret_operator_notes
from app.optimizer import solve_energy_schedule
from app.replay import replay_and_audit_schedule
from app.schemas import OptimizeRequest, OptimizeResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gridwise")

app = FastAPI(
    title="GridWise LLM Energy Optimizer",
    version="1.0.0",
    description="BUP CSE Fest 2026 Preliminary Hackathon Solution",
)


# ── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return HTTP 400 on malformed JSON or structurally invalid requests."""
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request body") if errors else "Validation failed"
    loc = " -> ".join(str(l) for l in errors[0].get("loc", [])) if errors else ""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Validation error at {loc}: {msg}" if loc else f"Validation error: {msg}"},
    )


@app.exception_handler(InvalidInputError)
async def invalid_input_handler(request: Request, exc: InvalidInputError):
    """Return HTTP 400 on domain input validation errors."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def catch_all_exception_handler(request: Request, exc: Exception):
    """Fail-closed error handler returning controlled HTTP 500 without exposing internals."""
    logger.error(f"Internal error processing request: {type(exc).__name__}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_error"},
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Readiness endpoint. Returns fast response without invoking LLM or solver."""
    return {"status": "ok"}


def _build_plan_summary(
    total_grid_kwh: float,
    total_cost_bdt: float,
    peak_grid_kwh: float,
    num_active_directives: int,
) -> str:
    """Deterministically construct a factual plan summary without a second LLM call."""
    if num_active_directives == 0:
        directive_phrase = "No special operational constraints were active."
    elif num_active_directives == 1:
        directive_phrase = "1 operational directive was applied to the schedule."
    else:
        directive_phrase = f"{num_active_directives} operational directives were applied to the schedule."

    return (
        f"24-hour energy plan optimized successfully. {directive_phrase} "
        f"Total grid energy: {total_grid_kwh:.2f} kWh. Total cost: {total_cost_bdt:.2f} BDT. "
        f"Peak grid import: {peak_grid_kwh:.2f} kWh. Battery returns to its initial energy level."
    )


@app.post("/optimize-energy", response_model=OptimizeResponse, status_code=status.HTTP_200_OK)
def optimize_energy(payload: OptimizeRequest) -> OptimizeResponse:
    """Execute the full 13-stage optimization pipeline."""
    start_time = time.time()
    scenario_id = payload.scenario_id

    # 1. Interpret operator notes with LLM (sends ONLY notes, zero scenario data)
    raw_directives = interpret_operator_notes(payload.operator_notes)

    # 2. Apply deterministic guardrails to sanitize untrusted LLM output
    sanitized_directives = apply_guardrails(
        raw_directives=raw_directives,
        num_notes=len(payload.operator_notes),
        battery_capacity_kwh=payload.battery.capacity_kwh,
    )

    # 3. Compile sanitized directives into 24-hour mathematical constraint arrays
    compiled_constraints = compile_directives(
        directives=sanitized_directives,
        hours=payload.hours,
        battery=payload.battery,
    )

    # 4. Formulate and solve PuLP + CBC Linear Program
    hourly_plan = solve_energy_schedule(
        hours=payload.hours,
        battery=payload.battery,
        constraints=compiled_constraints,
    )

    # 5. Independent Replay & Constraint Audit
    total_grid_kwh, total_cost_bdt, peak_grid_kwh = replay_and_audit_schedule(
        hourly_plan=hourly_plan,
        hours=payload.hours,
        battery=payload.battery,
        constraints=compiled_constraints,
    )

    # 6. Construct deterministic plan summary
    active_count = sum(1 for d in sanitized_directives if d.applies)
    summary = _build_plan_summary(
        total_grid_kwh=total_grid_kwh,
        total_cost_bdt=total_cost_bdt,
        peak_grid_kwh=peak_grid_kwh,
        num_active_directives=active_count,
    )

    # 7. Construct and validate response schema
    response = OptimizeResponse(
        scenario_id=scenario_id,
        directive_interpretation=sanitized_directives,
        hourly_plan=hourly_plan,
        total_grid_kwh=total_grid_kwh,
        total_cost_bdt=total_cost_bdt,
        peak_grid_kwh=peak_grid_kwh,
        plan_summary=summary,
    )

    elapsed = time.time() - start_time
    logger.info(
        f"Scenario {scenario_id} completed in {elapsed:.3f}s: "
        f"cost={total_cost_bdt:.2f} BDT, grid={total_grid_kwh:.2f} kWh, peak={peak_grid_kwh:.2f} kWh"
    )

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
