"""Central configuration and constants for GridWise LLM."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Project Paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Numerical Tolerances
EPS = 1e-7
REPORT_TOL = 0.01

# Solver Configuration
SOLVER_TIMEOUT_SECONDS = int(os.getenv("SOLVER_TIMEOUT_SECONDS", "15"))

# LLM Provider Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
LLM_MODEL = os.getenv("LLM_MODEL", "").strip()
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "18.0"))

# Provider API Keys (None are mandatory on startup; only the active provider's key is needed)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_API_KEYS_RAW = os.getenv("OPENROUTER_API_KEYS", "").strip()
OPENROUTER_API_KEYS: list[str] = [
    k.strip() for k in OPENROUTER_API_KEYS_RAW.split(",") if k.strip()
]
if OPENROUTER_API_KEY and OPENROUTER_API_KEY not in OPENROUTER_API_KEYS:
    OPENROUTER_API_KEYS.insert(0, OPENROUTER_API_KEY)
if OPENROUTER_API_KEYS and not OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = OPENROUTER_API_KEYS[0]

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()

# Default model identifiers if LLM_MODEL is not explicitly set
DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "groq": "llama-3.3-70b-versatile",
    "openrouter": OPENROUTER_MODEL or "deepseek/deepseek-v4-flash-0731:free",
    "anthropic": "claude-3-5-haiku-20241022",
}

# Production Rate Limiting & Safety
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").strip().lower() == "true"
RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
MAX_REQUEST_BODY_SIZE_BYTES = int(os.getenv("MAX_REQUEST_BODY_SIZE_BYTES", "1048576"))  # 1 MB

# CORS Configuration
CORS_ALLOWED_ORIGINS_RAW = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,https://gridwise.duckdns.org,http://gridwise.duckdns.org",
)
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in CORS_ALLOWED_ORIGINS_RAW.split(",") if origin.strip()
]

# Live testing flag
RUN_LIVE_LLM_TESTS = os.getenv("RUN_LIVE_LLM_TESTS", "0").strip() == "1"


def get_active_model() -> str:
    """Return the configured model name or the recommended default for the provider."""
    if LLM_MODEL:
        return LLM_MODEL
    return DEFAULT_MODELS.get(LLM_PROVIDER, "gemini-2.5-flash")

