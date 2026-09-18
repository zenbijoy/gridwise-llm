"""Pydantic v2 schemas for GridWise LLM requests and responses."""

import math
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _check_finite(val: float, field_name: str) -> float:
    """Ensure a numeric value is finite (not NaN, inf, or -inf)."""
    if not math.isfinite(val):
        raise ValueError(f"{field_name} must be a finite number, got {val}")
    return val


class HourEntry(BaseModel):
    """Hourly campus demand, solar forecast, and grid tariff."""
    model_config = ConfigDict(extra="forbid")

    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0..23)")
    demand_kwh: float = Field(..., ge=0.0, description="Demand in kWh")
    solar_kwh: float = Field(..., ge=0.0, description="Available solar generation in kWh")
    tariff_bdt_per_kwh: float = Field(..., ge=0.0, description="Grid tariff in BDT per kWh")

    @field_validator("demand_kwh", "solar_kwh", "tariff_bdt_per_kwh")
    @classmethod
    def validate_finite_floats(cls, v: float, info) -> float:
        return _check_finite(v, info.field_name)


class Battery(BaseModel):
    """Battery energy storage system parameters."""
    model_config = ConfigDict(extra="forbid")

    capacity_kwh: float = Field(..., gt=0.0, description="Total storage capacity in kWh")
    initial_energy_kwh: float = Field(..., ge=0.0, description="Energy in battery at start of hour 0")
    minimum_energy_kwh: float = Field(..., ge=0.0, description="Base minimum energy reserve in kWh")
    max_charge_kwh_per_hour: float = Field(..., ge=0.0, description="Maximum charge rate in kWh/h")
    max_discharge_kwh_per_hour: float = Field(..., ge=0.0, description="Maximum discharge rate in kWh/h")

    @field_validator(
        "capacity_kwh",
        "initial_energy_kwh",
        "minimum_energy_kwh",
        "max_charge_kwh_per_hour",
        "max_discharge_kwh_per_hour",
    )
    @classmethod
    def validate_finite_floats(cls, v: float, info) -> float:
        return _check_finite(v, info.field_name)

    @model_validator(mode="after")
    def validate_bounds(self) -> "Battery":
        if self.initial_energy_kwh > self.capacity_kwh:
            raise ValueError(
                f"initial_energy_kwh ({self.initial_energy_kwh}) cannot exceed capacity_kwh ({self.capacity_kwh})"
            )
        if self.minimum_energy_kwh > self.capacity_kwh:
            raise ValueError(
                f"minimum_energy_kwh ({self.minimum_energy_kwh}) cannot exceed capacity_kwh ({self.capacity_kwh})"
            )
        return self


class OptimizeRequest(BaseModel):
    """Complete request payload for energy scheduling."""
    model_config = ConfigDict(extra="forbid")

    scenario_id: str = Field(..., min_length=1, description="Unique scenario identifier")
    operator_notes: list[str] = Field(..., min_length=1, max_length=3, description="1 to 3 operator notes")
    hours: list[HourEntry] = Field(..., min_length=24, max_length=24, description="Exactly 24 hourly entries")
    battery: Battery

    @field_validator("operator_notes")
    @classmethod
    def validate_notes(cls, v: list[str]) -> list[str]:
        cleaned = []
        for idx, note in enumerate(v):
            if not isinstance(note, str) or not note.strip():
                raise ValueError(f"Operator note at index {idx} must be a non-empty string")
            cleaned.append(note.strip())
        return cleaned

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: list[HourEntry]) -> list[HourEntry]:
        if len(v) != 24:
            raise ValueError(f"Expected exactly 24 hour entries, got {len(v)}")
        seen_hours = set()
        for entry in v:
            if entry.hour in seen_hours:
                raise ValueError(f"Duplicate hour entry: {entry.hour}")
            seen_hours.add(entry.hour)
        if seen_hours != set(range(24)):
            missing = sorted(set(range(24)) - seen_hours)
            raise ValueError(f"Missing hours: {missing}")
        # Return sorted by hour ascending
        return sorted(v, key=lambda x: x.hour)


# Directive Literal Type
DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
]


class DirectiveInterpretation(BaseModel):
    """Structured interpretation of a single operator note."""
    model_config = ConfigDict(extra="forbid")

    note_index: int = Field(..., ge=0, description="0-based index of corresponding operator note")
    applies: bool = Field(..., description="True if directive alters schedule, False for no_op")
    directive_type: DirectiveType = Field(..., description="One of the supported directive types")
    structured_adjustment: dict | None = Field(
        None, description="Directive parameters (hours, factor, etc.) or None for no_op"
    )
    explanation: str = Field(..., description="Short explanation of the interpretation")


BatteryAction = Literal["charge", "discharge", "idle"]


class HourlyPlanEntry(BaseModel):
    """Scheduled operating values for a single hour."""
    model_config = ConfigDict(extra="forbid")

    hour: int = Field(..., ge=0, le=23, description="Hour 0..23")
    grid_kwh: float = Field(..., ge=0.0, description="Grid energy purchased (kWh)")
    solar_used_kwh: float = Field(..., ge=0.0, description="Solar energy utilized (kWh)")
    battery_action: BatteryAction = Field(..., description="Charge, discharge, or idle")
    battery_kwh: float = Field(..., ge=0.0, description="Battery energy charged/discharged (kWh)")
    battery_energy_after_kwh: float = Field(..., ge=0.0, description="Battery state of charge at end of hour (kWh)")

    @field_validator("grid_kwh", "solar_used_kwh", "battery_kwh", "battery_energy_after_kwh")
    @classmethod
    def validate_finite_floats(cls, v: float, info) -> float:
        return _check_finite(v, info.field_name)


class OptimizeResponse(BaseModel):
    """Full optimization response matching the official BUP CSE Fest specification."""
    model_config = ConfigDict(extra="forbid")

    scenario_id: str
    directive_interpretation: list[DirectiveInterpretation]
    hourly_plan: list[HourlyPlanEntry] = Field(..., min_length=24, max_length=24)
    total_grid_kwh: float = Field(..., ge=0.0)
    total_cost_bdt: float = Field(..., ge=0.0)
    peak_grid_kwh: float = Field(..., ge=0.0)
    plan_summary: str
