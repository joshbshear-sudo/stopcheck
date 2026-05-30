"""Data models for the StopCheck compliance engine."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class StopStatus(Enum):
    PASS = "pass"
    FAIL = "fail"
    MISSED = "missed"
    NOT_APPLICABLE = "not_applicable"
    GUARD_WAIVED = "guard_waived"


class SpeedSource(Enum):
    SENSOR = "sensor"
    GPS_DERIVED = "gps_derived"


@dataclass
class FitRecord:
    timestamp: datetime
    lat: float
    lon: float
    speed: float  # m/s
    enhanced_speed: Optional[float] = None
    speed_source: SpeedSource = SpeedSource.SENSOR


@dataclass
class StopSign:
    id: str
    event_id: str
    sequence: int
    lat: float
    lon: float
    location: Optional[str] = None
    mile_marker: Optional[float] = None
    source: str = "osm"
    crossing_guard: bool = False
    guard_confirmed_by: Optional[str] = None
    guard_confirmed_at: Optional[datetime] = None


@dataclass
class Event:
    id: str
    name: str
    event_date: str
    # Spec v2.0 §1.3 / §1.4 — required dwell at the threshold speed
    stop_duration_sec: float = 0.75
    # Spec v2.0 §1.5 — calibrated for rural-road GPS realities
    geofence_radius_m: float = 25.0
    # Spec v2.0 §1.4 — wheel-sensor base; per-event override per §1.10
    speed_threshold_mph: float = 0.5
    event_window_start: Optional[datetime] = None
    event_window_end: Optional[datetime] = None


@dataclass
class StopResult:
    stop_sign_id: str
    status: StopStatus
    min_speed_mph: float
    stop_duration_s: Optional[float] = None
    speed_source: SpeedSource = SpeedSource.SENSOR
    note: Optional[str] = None
    stripped_records: list = field(default_factory=list)


@dataclass
class RiderActivity:
    rider_id: str
    event_id: str
    activity_start: datetime
    activity_end: datetime
    fit_records: list[FitRecord] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class ComplianceSummary:
    rider_id: str
    event_id: str
    compliance_pct: float
    stops_passed: int
    stops_failed: int
    stops_missed: int
    stops_guard_waived: int
    dq_recommended: bool
    stop_results: list[StopResult] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
