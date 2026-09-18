# GridWise LLM — Smart Campus Energy Optimizer

> **BUP CSE Fest 2026 Hackathon · Preliminary Round**  
> Autonomous, constraint-safe 24-hour microgrid energy scheduling via structured LLM interpretation, deterministic guardrails, PuLP + CBC linear programming, and independent replay audit.

---

## 1. Problem Statement

GridWise schedules 24 hours of campus energy demand, rooftop solar generation, battery storage actions, and grid imports to minimize total electricity cost while obeying physical constraints and natural-language operator directives.

---

## 2. Architecture & Processing Flow

The system strictly enforces separation of concerns across four independent layers:

```text
                    OPERATOR NOTES (1–3 natural-language notes)
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │  Structured LLM           │
                         │  Interpreter              │
                         │  (ONE call / request)     │
                         └─────────────┬─────────────┘
                                       │ Raw directives
                                       ▼
                         ┌───────────────────────────┐
                         │  Deterministic Guardrails │
                         │  Pydantic v2 + bounds     │
                         └─────────────┬─────────────┘
                                       │ Sanitized directives
                                       ▼
                         ┌───────────────────────────┐
                         │  Directive Compiler       │
                         │  24-hour constraint arrays│
                         └─────────────┬─────────────┘
                                       │ Math vectors
                                       ▼
                         ┌───────────────────────────┐
                         │  LP Optimizer             │
                         │  PuLP + CBC Solver        │
                         └─────────────┬─────────────┘
                                       │ Candidate hourly plan
                                       ▼
                         ┌───────────────────────────┐
                         │  Independent Replay       │
                         │  Constraint & Math Audit  │
                         └─────────────┬─────────────┘
                                       │ Verified plan & totals
                                       ▼
                          VALIDATED HTTP 200 JSON
```

### Architectural Guarantees:
1. **The LLM is NOT the optimizer**: The LLM receives **ONLY** `note_index` and `operator_note`. It never sees campus demand, solar numbers, tariffs, or battery capacity.
2. **Deterministic Guardrails**: Untrusted LLM outputs are normalized, sorted, and range-checked. Missing or out-of-order notes are repaired; invalid numbers or unknown directives are demoted safely to `no_op`.
3. **Exact Mathematical Optimization**: PuLP + CBC finds the global cost-minimum schedule across the 24-hour horizon.
4. **Independent Replay Audit (Fail-Closed)**: Recomputes energy balance, battery state transitions, rate limits, and totals directly from the generated public plan before issuing HTTP 200. Any inconsistency triggers HTTP 500 `{"error": "internal_error"}`.

---

## 3. Supported Directives

| Directive Type | Meaning | Required `structured_adjustment` |
|---|---|---|
| `solar_reduction` | Usable solar reduced during specific hours | `{"hours": [h1, h2], "factor": float}` *(remaining fraction: 80% reduction $\rightarrow$ 0.20)* |
| `minimum_battery_reserve` | State of charge must remain $\ge$ reserve | `{"hours": [h1, h2], "minimum_energy_kwh": float}` |
| `no_charge_window` | Charging prohibited during specific hours | `{"hours": [h1, h2]}` |
| `no_discharge_window` | Discharging prohibited during specific hours | `{"hours": [h1, h2]}` |
| `max_grid_window` | Grid import capped during specific hours | `{"hours": [h1, h2], "max_grid_kwh": float}` |
| `no_op` | Note does not alter today's schedule | `null` (`applies = false`) |

*Time Convention*: Windows are start-inclusive and end-exclusive (e.g. `1 PM to 3 PM` $\rightarrow$ `[13, 14]`).

---

## 4. Local Quickstart

### Prerequisites
- Python 3.11+
- Git

### Linux / macOS
```bash
git clone <repo-url>
cd gridwise-llm

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Windows (PowerShell)
```powershell
git clone <repo-url>
cd gridwise-llm

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 5. Configuration (.env)

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

```env
# LLM Provider: gemini (default) | groq | openrouter | anthropic
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
LLM_TIMEOUT_SECONDS=18

# Only set the key for your active provider
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
```

> **Note**: Unused provider keys can remain empty. The service starts cleanly without error even if keys are absent. An emergency deterministic fallback operates if the LLM provider experiences network downtime.

---

## 6. Running the Service

### Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Endpoints

| Method | Endpoint | Description | Auth / Rate Limit |
|---|---|---|---|
| `GET` | `/health` | Liveness probe returning `{"status": "ok"}` | No rate limit |
| `GET` | `/ready` | Readiness probe returning `{"status": "ready"}` | No rate limit |
| `GET` | `/docs` | Interactive Swagger API documentation | No rate limit |
| `GET` | `/redoc` | ReDoc API documentation | No rate limit |
| `POST` | `/optimize-energy` | Full 24-hour microgrid energy optimization pipeline | Rate limited (60 req/min) |

#### Liveness & Readiness Probes
```bash
curl http://localhost:8000/health
# {"status": "ok"}

curl http://localhost:8000/ready
# {"status": "ready"}
```

---

## 7. Rate Limiting & Safety Guardrails

- **Sliding-Window Rate Limiter**: `POST /optimize-energy` is protected by a thread-safe in-memory sliding-window limiter (default `60` requests/minute per client IP).
  - Health (`/health`) and readiness (`/ready`) endpoints are strictly exempt from rate limiting.
  - When the threshold is exceeded, the server responds with **HTTP 429 Too Many Requests**, a `Retry-After: <seconds>` header, and a JSON body:
    ```json
    {
      "error": "rate_limit_exceeded",
      "message": "Rate limit exceeded. Try again in 42 seconds."
    }
    ```
- **Request Body Size Limit**: Incoming request bodies are capped at 1 MB (`MAX_REQUEST_BODY_SIZE_BYTES=1048576`). Payloads exceeding this limit receive **HTTP 413 Payload Too Large**.
- **Correlation ID Tracking**: All incoming requests accept or automatically receive a unique `X-Request-ID` header, which is propagated through all structured log records and returned in HTTP responses.

---

## 8. Optimization API Example (SAMPLE-01)

```bash
curl -X POST http://localhost:8000/optimize-energy \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "SAMPLE-01",
    "operator_notes": [
      "Facilities will wash the rooftop solar panels from noon until 2 PM. During cleaning, usable solar should be treated as roughly 25% of the forecast.",
      "The sports office moved next month'\''s registration deadline."
    ],
    "hours": [
      {"hour": 0, "demand_kwh": 90, "solar_kwh": 0, "tariff_bdt_per_kwh": 6},
      {"hour": 1, "demand_kwh": 85, "solar_kwh": 0, "tariff_bdt_per_kwh": 6},
      {"hour": 2, "demand_kwh": 80, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 3, "demand_kwh": 80, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 4, "demand_kwh": 85, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 5, "demand_kwh": 95, "solar_kwh": 0, "tariff_bdt_per_kwh": 6},
      {"hour": 6, "demand_kwh": 110, "solar_kwh": 5, "tariff_bdt_per_kwh": 8},
      {"hour": 7, "demand_kwh": 130, "solar_kwh": 20, "tariff_bdt_per_kwh": 10},
      {"hour": 8, "demand_kwh": 150, "solar_kwh": 50, "tariff_bdt_per_kwh": 12},
      {"hour": 9, "demand_kwh": 165, "solar_kwh": 90, "tariff_bdt_per_kwh": 14},
      {"hour": 10, "demand_kwh": 175, "solar_kwh": 140, "tariff_bdt_per_kwh": 16},
      {"hour": 11, "demand_kwh": 190, "solar_kwh": 200, "tariff_bdt_per_kwh": 18},
      {"hour": 12, "demand_kwh": 200, "solar_kwh": 250, "tariff_bdt_per_kwh": 22},
      {"hour": 13, "demand_kwh": 200, "solar_kwh": 250, "tariff_bdt_per_kwh": 22},
      {"hour": 14, "demand_kwh": 195, "solar_kwh": 200, "tariff_bdt_per_kwh": 20},
      {"hour": 15, "demand_kwh": 200, "solar_kwh": 125, "tariff_bdt_per_kwh": 22},
      {"hour": 16, "demand_kwh": 210, "solar_kwh": 80, "tariff_bdt_per_kwh": 25},
      {"hour": 17, "demand_kwh": 220, "solar_kwh": 30, "tariff_bdt_per_kwh": 28},
      {"hour": 18, "demand_kwh": 235, "solar_kwh": 5, "tariff_bdt_per_kwh": 32},
      {"hour": 19, "demand_kwh": 225, "solar_kwh": 0, "tariff_bdt_per_kwh": 30},
      {"hour": 20, "demand_kwh": 205, "solar_kwh": 0, "tariff_bdt_per_kwh": 26},
      {"hour": 21, "demand_kwh": 175, "solar_kwh": 0, "tariff_bdt_per_kwh": 18},
      {"hour": 22, "demand_kwh": 135, "solar_kwh": 0, "tariff_bdt_per_kwh": 10},
      {"hour": 23, "demand_kwh": 105, "solar_kwh": 0, "tariff_bdt_per_kwh": 7}
    ],
    "battery": {
      "capacity_kwh": 220,
      "initial_energy_kwh": 110,
      "minimum_energy_kwh": 40,
      "max_charge_kwh_per_hour": 50,
      "max_discharge_kwh_per_hour": 50
    }
  }'
```

---

## 9. Running the Automated Test Suite

Run the full verification suite (68 tests across all modules):
```bash
pytest -v
```

### Verified Test Suites:
1. `tests/test_guardrails.py` — Sanitization, hours validation, reserve bounds, and index repair.
2. `tests/test_optimizer.py` — All 14 LP operational cases (arbitrage, restrictions, bounds, neutrality).
3. `tests/test_replay.py` — Fail-closed rejection of tampered energy balances or limits.
4. `tests/test_greedy_vs_lp.py` — Mathematical proof of cost superiority of LP over greedy heuristics.
5. `tests/test_public_samples.py` — All 10 official public sample cases matching reference costs within $\pm 0.01$ BDT.
6. `tests/test_llm_paraphrase.py` — Robustness across natural language phrasings.
7. `tests/test_rate_limit.py` — Unit & integration tests for rate limiting, retry headers, and health/ready exemptions.
8. `tests/test_api.py` — HTTP contract, Pydantic validation, error codes, request ID, and body size limits.
9. `tests/test_randomized.py` — Property-based stress testing under randomized inputs.

---

## 10. Docker & Compose Deployment

The service is packaged using a multi-stage, hardened Docker image based on `python:3.11-slim`:
- Non-root user execution (`appuser:appuser`, UID 10001).
- Native COIN-OR CBC linear programming solver installed.
- Integrated Docker `HEALTHCHECK` querying `/health`.
- Dynamic `PORT` environment variable support.

### Running with Docker Compose (Recommended)
```bash
# 1. Prepare environment
cp .env.example .env
nano .env  # configure GEMINI_API_KEY

# 2. Build and start service in background
docker compose up -d --build

# 3. View real-time logs
docker compose logs -f

# 4. Check service health
docker compose ps
curl http://localhost:8000/health
```

---

## 11. Linux VPS Production Deployment (Nginx + SSL)

For complete end-to-end instructions on provisioning an Ubuntu/Debian Linux VPS, see the [VPS Runbook](deploy/README.md).

### Quick Summary:
1. **Automated Host Setup**: Run the idempotent setup script to install Docker, Docker Compose, Nginx, and configure UFW firewall:
   ```bash
   sudo bash deploy/setup.sh
   ```
2. **Reverse Proxy Configuration**: Copy `deploy/nginx/gridwise.conf` to `/etc/nginx/sites-available/gridwise.conf`, substitute your domain name, and symlink to `sites-enabled/`.
3. **Free HTTPS via Certbot**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```
4. **Launch Application**:
   ```bash
   docker compose up -d --build
   ```

---

## 12. Security & Compliance

- **No Secrets in Code or Logs**: API keys, tokens, and authorization headers are never logged or returned in responses.
- **Fail-Closed Design**: Malformed requests return HTTP 400. Internal or solver errors return HTTP 500 `{"error": "internal_error"}` without exposing tracebacks.
- **Defense in Depth**: Non-root container process, internal loopback binding (`127.0.0.1:8000`), Nginx reverse proxy with TLS 1.2/1.3, rate limiting, and request payload bounds.
- **Dependency Credit**: Built with FastAPI, Uvicorn, Pydantic v2, PuLP, and COIN-OR CBC solver.
