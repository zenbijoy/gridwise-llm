"""In-memory sliding window rate limiter for production API protection."""

import threading
import time
from collections import defaultdict
from app.config import RATE_LIMIT_ENABLED, RATE_LIMIT_REQUESTS_PER_MINUTE


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter per client identifier (e.g. IP)."""

    def __init__(self, requests_per_minute: int = 60, enabled: bool = True):
        self.requests_per_minute = requests_per_minute
        self.enabled = enabled
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, client_id: str) -> tuple[bool, int]:
        """Check if request from client_id is within quota.

        Returns:
            (True, 0) if permitted.
            (False, retry_after_seconds) if quota exceeded.
        """
        if not self.enabled:
            return True, 0

        now = time.time()
        window_start = now - 60.0

        with self._lock:
            timestamps = self._history[client_id]
            # Prune timestamps older than 60 seconds
            valid_timestamps = [t for t in timestamps if t > window_start]
            self._history[client_id] = valid_timestamps

            if len(valid_timestamps) >= self.requests_per_minute:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(60.0 - (now - oldest)))
                return False, retry_after

            # Record this request
            self._history[client_id].append(now)
            return True, 0

    def reset(self) -> None:
        """Clear all rate limit records (useful for test isolation)."""
        with self._lock:
            self._history.clear()


# Global rate limiter instance
rate_limiter = SlidingWindowRateLimiter(
    requests_per_minute=RATE_LIMIT_REQUESTS_PER_MINUTE,
    enabled=RATE_LIMIT_ENABLED,
)
