"""FastAPI application for GridWise LLM - 24-Hour Campus Energy Scheduling API."""

import logging
import time
import uuid
import pulp
from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import (
    MAX_REQUEST_BODY_SIZE_BYTES,
    RATE_LIMIT_ENABLED,
    REPORT_TOL,
)
from app.directive_compiler import compile_directives
from app.errors import InvalidInputError, OptimizerInfeasibleError, ReplayValidationError
from app.guardrails import apply_guardrails
from app.llm_interpreter import interpret_operator_notes
from app.optimizer import solve_energy_schedule
from app.rate_limiter import rate_limiter
from app.replay import replay_and_audit_schedule
from app.schemas import OptimizeRequest, OptimizeResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("gridwise")

app = FastAPI(
    title="GridWise LLM Energy Optimizer",
    version="1.0.0",
    description="Production-grade 24-Hour Campus Energy Scheduling API for BUP CSE Fest 2026.",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── Middleware: Request ID & Correlation Tracking ────────────────────────────

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    """Ensure every request has a correlation ID and attaches it to response headers."""
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id

    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ── Middleware: Body Size Limiter ────────────────────────────────────────────

@app.middleware("http")
async def body_size_limiter_middleware(request: Request, call_next):
    """Reject request bodies exceeding the maximum allowed size with HTTP 400."""
    content_length = request.headers.get("Content-Length")
    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_BODY_SIZE_BYTES:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": f"Request body exceeds limit of {MAX_REQUEST_BODY_SIZE_BYTES} bytes."},
                )
        except ValueError:
            pass

    return await call_next(request)


# ── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return HTTP 400 on malformed JSON or structurally invalid requests."""
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request body") if errors else "Validation failed"
    loc = " -> ".join(str(l) for l in errors[0].get("loc", [])) if errors else ""
    detail = f"Validation error at {loc}: {msg}" if loc else f"Validation error: {msg}"
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": detail},
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
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"[request_id={req_id}] Internal error processing request: {type(exc).__name__}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_error"},
    )


# ── Health & Readiness Endpoints ─────────────────────────────────────────────

@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Liveness Probe",
    description="Instant health readiness check. Does not invoke LLM or solver.",
)
def health_check():
    """Liveness probe. Always returns HTTP 200 when service is running."""
    return {"status": "ok"}


@app.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    summary="Readiness Probe",
    description="Verifies configuration, solver binary availability, and system readiness.",
)
def readiness_check():
    """Readiness probe. Verifies environment and optimization solver availability."""
    solver_available = pulp.PULP_CBC_CMD().available()
    if not solver_available:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "detail": "Optimizer solver backend unavailable."},
        )
    return {"status": "ready"}


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


# ── Optimization Endpoint ───────────────────────────────────────────────────

@app.post(
    "/optimize-energy",
    response_model=OptimizeResponse,
    status_code=status.HTTP_200_OK,
    summary="24-Hour Energy Scheduling & Optimization",
    responses={
        200: {"description": "Optimal feasible schedule produced and independently audited."},
        400: {"description": "Malformed request, missing fields, or invalid numerical parameters."},
        429: {"description": "Rate limit quota exceeded. See Retry-After header."},
        500: {"description": "Controlled internal error. Returns {'error': 'internal_error'}."},
    },
)
def optimize_energy(payload: OptimizeRequest, request: Request) -> OptimizeResponse:
    """Execute the full 13-stage optimization pipeline with rate limiting and independent audit."""
    request_id = getattr(request.state, "request_id", "unknown")
    start_time = time.time()
    scenario_id = payload.scenario_id

    # 0. Rate limiting check (per client IP)
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = rate_limiter.is_allowed(client_ip)
    if not allowed:
        logger.warning(
            f"[request_id={request_id}] [client_ip={client_ip}] Rate limit exceeded. Retry in {retry_after}s."
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": f"Rate limit exceeded. Try again in {retry_after} seconds."},
            headers={"Retry-After": str(retry_after)},
        )

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
        f"[request_id={request_id}] [scenario_id={scenario_id}] [duration={elapsed:.3f}s] "
        f"[notes={len(payload.operator_notes)}] [active_directives={active_count}] "
        f"[cost={total_cost_bdt:.2f} BDT] [grid={total_grid_kwh:.2f} kWh] [peak={peak_grid_kwh:.2f} kWh]"
    )

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
