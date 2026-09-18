"""Multi-provider LLM Interpreter for Operator Notes."""

import json
import logging
import re
from typing import Any
import httpx

from app.config import (
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    GROQ_API_KEY,
    LLM_MODEL,
    LLM_PROVIDER,
    LLM_TIMEOUT_SECONDS,
    OPENROUTER_API_KEY,
    get_active_model,
)

logger = logging.getLogger(__name__)

DIRECTIVE_SYSTEM_PROMPT = """You are an expert energy management system directive interpreter for a smart campus microgrid.
Your task is to parse operator notes and extract structured energy directives affecting the 24-hour schedule.

DIRECTIVE TYPES (use strictly these string identifiers):
1. solar_reduction
   Meaning: Usable rooftop solar is curtailed or reduced during specific hours.
   structured_adjustment: {"hours": [h1, h2, ...], "factor": float}
   CRITICAL FACTOR RULE: 'factor' represents the remaining fraction of available solar between 0.0 and 1.0.
   - "Reduce solar by 80%" -> factor = 0.20
   - "Solar available at 25% of forecast" -> factor = 0.25
   - "Drop to roughly one-fifth" -> factor = 0.20
   - "50% solar reduction" -> factor = 0.50

2. minimum_battery_reserve
   Meaning: Battery state of charge (energy) must not drop below a designated threshold during specific hours.
   structured_adjustment: {"hours": [h1, h2, ...], "minimum_energy_kwh": float}
   - Example: "Keep at least 120 kWh in reserve from 6 PM until 9 PM" -> {"hours": [18, 19, 20], "minimum_energy_kwh": 120.0}

3. no_charge_window
   Meaning: Battery charging is prohibited or isolated during specific hours.
   structured_adjustment: {"hours": [h1, h2, ...]}
   - Example: "Do not charge the battery between 2 PM and 4 PM" -> {"hours": [14, 15]}

4. no_discharge_window
   Meaning: Battery discharging is prohibited or isolated during specific hours.
   structured_adjustment: {"hours": [h1, h2, ...]}
   - Example: "No battery discharge from 8 AM to 11 AM" -> {"hours": [8, 9, 10]}

5. max_grid_window
   Meaning: Maximum grid electricity purchase is capped during specific hours.
   structured_adjustment: {"hours": [h1, h2, ...], "max_grid_kwh": float}
   - Example: "Limit grid import to 80 kWh from 17:00 to 20:00" -> {"hours": [17, 18, 19], "max_grid_kwh": 80.0}

6. no_op
   Meaning: Note does not affect the 24-hour campus energy schedule (e.g. cafeteria menus, sports events, unrelated facilities notes, or ambiguous instructions).
   applies: false
   structured_adjustment: null

TIME CONVENTION (MANDATORY):
Time windows are START-INCLUSIVE and END-EXCLUSIVE.
- "1 PM to 3 PM" maps to [13, 14] (NOT 15)
- "noon until 2 PM" maps to [12, 13]
- "6 PM until 9 PM" maps to [18, 19, 20]
- "2 AM until 5 AM" maps to [2, 3, 4]
- "00:00 to 06:00" maps to [0, 1, 2, 3, 4, 5]
- "20:00 to 24:00" maps to [20, 21, 22, 23]

OUTPUT SPECIFICATION:
Return ONLY a valid JSON array containing exactly one object per operator note in note_index order:
[
  {
    "note_index": 0,
    "applies": true,
    "directive_type": "solar_reduction",
    "structured_adjustment": {"hours": [12, 13], "factor": 0.25},
    "explanation": "Solar output reduced to 25% during panel cleaning window."
  },
  {
    "note_index": 1,
    "applies": false,
    "directive_type": "no_op",
    "structured_adjustment": null,
    "explanation": "Note does not alter today's energy schedule."
  }
]
Do NOT include markdown formatting, backticks, or explanatory text outside the JSON array."""


def _extract_json_array(text: str) -> list[dict[str, Any]]:
    """Robustly extract and parse a JSON array from LLM response text."""
    clean = text.strip()
    # Strip markdown code blocks
    clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE)
    clean = clean.strip()

    # Find array brackets
    start_idx = clean.find("[")
    end_idx = clean.rfind("]")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        clean = clean[start_idx : end_idx + 1]

    data = json.loads(clean)
    if not isinstance(data, list):
        raise ValueError("Parsed JSON is not an array")
    return data


# ── Provider Callers ─────────────────────────────────────────────────────────

def _call_gemini(notes_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Call Google Gemini API using google-genai SDK."""
    from google import genai
    from google.genai import types

    api_key = GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=api_key)
    model_name = get_active_model()
    prompt_text = f"Operator notes to interpret:\n{json.dumps(notes_payload, indent=2)}\n\nReturn the directive_interpretation JSON array."

    response = client.models.generate_content(
        model=model_name,
        contents=prompt_text,
        config=types.GenerateContentConfig(
            system_instruction=DIRECTIVE_SYSTEM_PROMPT,
            temperature=0.0,
            response_mime_type="application/json",
        ),
    )
    if not response.text:
        raise ValueError("Empty response text received from Gemini")
    return _extract_json_array(response.text)


def _call_groq(notes_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Call Groq API via HTTP."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured")

    model_name = get_active_model()
    user_content = f"Operator notes to interpret:\n{json.dumps(notes_payload, indent=2)}\n\nReturn the directive_interpretation JSON array."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": DIRECTIVE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"},
    }

    with httpx.Client(timeout=LLM_TIMEOUT_SECONDS) as client:
        resp = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        # In case wrapped in an object like {"directives": [...]}
        try:
            return _extract_json_array(content)
        except Exception:
            parsed = json.loads(content)
            for v in parsed.values():
                if isinstance(v, list):
                    return v
            raise


def _call_openrouter(notes_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Call OpenRouter API via HTTP."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    model_name = get_active_model()
    user_content = f"Operator notes to interpret:\n{json.dumps(notes_payload, indent=2)}\n\nReturn the directive_interpretation JSON array."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": DIRECTIVE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.0,
    }

    with httpx.Client(timeout=LLM_TIMEOUT_SECONDS) as client:
        resp = client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return _extract_json_array(content)


def _call_anthropic(notes_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Call Anthropic API via HTTP."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured")

    model_name = get_active_model()
    user_content = f"Operator notes to interpret:\n{json.dumps(notes_payload, indent=2)}\n\nReturn the directive_interpretation JSON array."

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    body = {
        "model": model_name,
        "system": DIRECTIVE_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_content}],
        "temperature": 0.0,
        "max_tokens": 1000,
    }

    with httpx.Client(timeout=LLM_TIMEOUT_SECONDS) as client:
        resp = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
        resp.raise_for_status()
        content = resp.json()["content"][0]["text"]
        return _extract_json_array(content)


# ── Emergency Fallback Parser ───────────────────────────────────────────────

WORD_TO_NUM = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
}


def _parse_time_window(text: str) -> list[int] | None:
    """Extract start-inclusive, end-exclusive hours from common time phrases."""
    lower = text.lower()

    # Noon / Midnight shortcuts
    if "noon" in lower and ("2 pm" in lower or "14:00" in lower or "2" in lower):
        return [12, 13]
    if "noon" in lower and ("1 pm" in lower or "13:00" in lower or "1" in lower):
        return [12]

    # Convert word numbers
    normalized = lower
    for word, num in WORD_TO_NUM.items():
        normalized = re.sub(rf"\b{word}\b", str(num), normalized)

    # 24-hour notation: HH:00 to HH:00 or between HH:00 and HH:00
    match24 = re.search(r"(\d{1,2}):00\s*(?:to|until|and|-|–)\s*(\d{1,2}):00", normalized)
    if match24:
        start = int(match24.group(1))
        end = int(match24.group(2))
        if 0 <= start < end <= 24:
            return list(range(start, end))

    # Standard format: e.g. 1 PM to 3 PM, between 1 and 3 PM, 1-3 PM, 1 until 3
    match = re.search(
        r"(\d{1,2})(?::00)?\s*(am|pm)?\s*(?:to|until|and|-|–)\s*(\d{1,2})(?::00)?\s*(am|pm)?",
        normalized,
    )
    if match:
        h1, p1, h2, p2 = match.groups()
        start = int(h1)
        end = int(h2)

        # Daytime / solar inference: e.g. "1 until 3" in solar/cleaning context means 1 PM to 3 PM (13 to 15)
        if not p1 and not p2:
            if any(w in lower for w in ["solar", "panel", "wash", "cleaning", "pv", "sun", "afternoon"]):
                if 1 <= start < end <= 7:
                    start += 12
                    end += 12

        if not p1 and p2 == "pm" and start < 12 and end <= 12:
            start += 12
        elif p1 == "pm" and start < 12:
            start += 12
        elif p1 == "am" and start == 12:
            start = 0

        if p2 == "pm" and end < 12:
            end += 12
        elif p2 == "am" and end == 12:
            end = 0

        if 0 <= start < end <= 24:
            return list(range(start, end))

    return None


def emergency_deterministic_fallback(notes_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deterministic emergency fallback for standard natural language notes when the LLM is unreachable.

    Only applies to high-confidence recognizable phrasing. Defaults safely to no_op.
    Never invents numbers or values.
    """
    directives: list[dict[str, Any]] = []

    for item in notes_payload:
        idx = item["note_index"]
        note = item["operator_note"].strip()
        lower = note.lower()

        neg_words = ["no", "not", "disable", "prohibit", "isolate", "zero", "stop", "prevent", "keep", "without"]

        # 1. No discharging (checked before charging since 'discharge' contains 'charge')
        if "discharg" in lower and any(w in lower for w in neg_words):
            hours = _parse_time_window(lower)
            if hours:
                directives.append({
                    "note_index": idx,
                    "applies": True,
                    "directive_type": "no_discharge_window",
                    "structured_adjustment": {"hours": hours},
                    "explanation": f"Discharging disabled for hours {hours}.",
                })
                continue

        # 2. No charging
        if "charg" in lower and any(w in lower for w in neg_words):
            hours = _parse_time_window(lower)
            if hours:
                directives.append({
                    "note_index": idx,
                    "applies": True,
                    "directive_type": "no_charge_window",
                    "structured_adjustment": {"hours": hours},
                    "explanation": f"Charging disabled for hours {hours}.",
                })
                continue

        # 3. Minimum reserve
        if any(w in lower for w in ["reserve", "reserve level", "keep at least", "maintain at least"]):
            hours = _parse_time_window(lower)
            kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*kwh", lower)
            if hours and kwh_match:
                min_kwh = float(kwh_match.group(1))
                directives.append({
                    "note_index": idx,
                    "applies": True,
                    "directive_type": "minimum_battery_reserve",
                    "structured_adjustment": {"hours": hours, "minimum_energy_kwh": min_kwh},
                    "explanation": f"Minimum reserve of {min_kwh} kWh required for hours {hours}.",
                })
                continue

        # 4. Solar reduction
        if any(w in lower for w in ["solar", "cleaning", "wash", "panel", "pv production", "rooftop solar", "pv"]):
            hours = _parse_time_window(lower)
            factor = None
            if "25%" in lower or "roughly 25%" in lower or "one-fourth" in lower or "1/4" in lower:
                factor = 0.25
            elif "20%" in lower or "one-fifth" in lower or "1/5" in lower:
                factor = 0.20
            elif "80% reduction" in lower or "reduce solar by 80%" in lower or "reduced by 80%" in lower or "80%" in lower:
                factor = 0.20
            elif "50%" in lower or "half" in lower:
                factor = 0.50
            elif "30%" in lower:
                if "reduction" in lower or "reduce" in lower:
                    factor = 0.70
                else:
                    factor = 0.30

            if hours and factor is not None:
                directives.append({
                    "note_index": idx,
                    "applies": True,
                    "directive_type": "solar_reduction",
                    "structured_adjustment": {"hours": hours, "factor": factor},
                    "explanation": f"Solar reduced to factor {factor} for hours {hours}.",
                })
                continue

        # 5. Grid cap
        if any(w in lower for w in ["grid import", "grid cap", "cap grid", "limit grid", "grid purchase"]):
            hours = _parse_time_window(lower)
            kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*kwh", lower)
            if hours and kwh_match:
                max_grid = float(kwh_match.group(1))
                directives.append({
                    "note_index": idx,
                    "applies": True,
                    "directive_type": "max_grid_window",
                    "structured_adjustment": {"hours": hours, "max_grid_kwh": max_grid},
                    "explanation": f"Grid capped at {max_grid} kWh for hours {hours}.",
                })
                continue

        # Default fallback: safe no_op
        directives.append({
            "note_index": idx,
            "applies": False,
            "directive_type": "no_op",
            "structured_adjustment": None,
            "explanation": "No supported scheduling constraint was identified.",
        })

    return directives


# ── Main Entrypoint ─────────────────────────────────────────────────────────

def interpret_operator_notes(operator_notes: list[str]) -> list[dict[str, Any]]:
    """Interpret operator notes using the configured LLM provider.

    Executes:
    1. Prepares payload containing ONLY note_index and operator_note.
    2. Makes at most 1 LLM call + 1 retry on transient failure.
    3. If provider fails completely, falls back to deterministic emergency fallback.
    """
    notes_payload = [
        {"note_index": idx, "operator_note": note}
        for idx, note in enumerate(operator_notes)
    ]

    provider = LLM_PROVIDER.lower()
    caller_map = {
        "gemini": _call_gemini,
        "groq": _call_groq,
        "openrouter": _call_openrouter,
        "anthropic": _call_anthropic,
    }

    caller = caller_map.get(provider)
    if caller is None:
        logger.warning(f"Unknown LLM provider '{provider}', using emergency fallback")
        return emergency_deterministic_fallback(notes_payload)

    # Attempt call with at most 1 retry
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            return caller(notes_payload)
        except Exception as exc:
            last_error = exc
            logger.warning(f"LLM call attempt {attempt + 1} failed: {type(exc).__name__}: {exc}")

    # If provider fails after retry, use deterministic emergency fallback
    logger.error(f"LLM provider failed after 2 attempts ({last_error}). Triggering emergency fallback.")
    return emergency_deterministic_fallback(notes_payload)
