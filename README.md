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

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Health Check
```bash
curl http://localhost:8000/health
```
Response:
```json
{"status": "ok"}
```

---

## 7. Optimization API Example (SAMPLE-01)

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

## 8. Running the Automated Test Suite

Run all unit, integration, optimizer, and sample tests:
```bash
pytest -v
```

### Verified Test Suites:
1. `tests/test_guardrails.py` — Sanitization, hours validation, reserve bounds, and index repair.
2. `tests/test_optimizer.py` — All 14 LP operational cases (arbitrage, restrictions, bounds, neutrality).
3. `tests/test_replay.py` — Fail-closed rejection of tampered energy balances or limits.
4. `tests/test_greedy_vs_lp.py` — Demonstration of mathematical cost superiority of LP over greedy heuristics.
5. `tests/test_public_samples.py` — All 10 official public sample cases matching reference costs within $\pm 0.01$ BDT.
6. `tests/test_llm_paraphrase.py` — Robustness across natural language phrasings.
7. `tests/test_api.py` — HTTP contract, Pydantic validation, and error code verification.
8. `tests/test_randomized.py` — Property-based stress testing under randomized inputs.

---

## 9. Docker Deployment

### Build Image
```bash
docker build -t gridwise-llm:latest .
```

### Run Container
```bash
docker run -d \
  -p 8000:8000 \
  -e LLM_PROVIDER=gemini \
  -e GEMINI_API_KEY=YOUR_API_KEY \
  --name gridwise-service \
  gridwise-llm:latest
```

Check logs and health:
```bash
curl http://localhost:8000/health
```

---

## 10. Security & Compliance

- **No Secrets in Code or Logs**: API keys, tokens, and authorization headers are never logged or returned in responses.
- **Fail-Closed Design**: Malformed requests return HTTP 400. Internal or solver errors return HTTP 500 `{"error": "internal_error"}` without exposing tracebacks.
- **Dependency Credit**: Built with FastAPI, Uvicorn, Pydantic v2, PuLP, and COIN-OR CBC solver.
