"""Domain exceptions for GridWise LLM."""


class GridWiseError(Exception):
    """Base exception for all domain errors."""
    pass


class InvalidInputError(GridWiseError):
    """Raised when request validation fails (maps to HTTP 400)."""
    pass


class OptimizerInfeasibleError(GridWiseError):
    """Raised when the LP optimizer cannot find an optimal feasible schedule (maps to HTTP 500)."""
    pass


class ReplayValidationError(GridWiseError):
    """Raised when the independent replay audit detects a constraint or math violation (maps to HTTP 500)."""
    pass


class LLMInterpretationError(GridWiseError):
    """Raised when LLM interpretation fails completely and fallback cannot proceed (maps to HTTP 500)."""
    pass
