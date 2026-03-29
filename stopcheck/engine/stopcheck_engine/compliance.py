"""Compliance engine — orchestrates FIT processing, geofencing, and stop detection.

Implements the crossing guard waiver with mandatory timestamp check
and the data stripping pipeline per spec sections 10 and 11.
"""

from datetime import datetime

from .geofence import (
    find_geofence_entries,
    split_geofence_visits,
    merge_geofence_windows,
    detect_speed_sensor_dropout,
    check_course_deviation,
)
from .haversine import haversine
from .models import (
    ComplianceSummary,
    Event,
    FitRecord,
    RiderActivity,
    SpeedSource,
    StopResult,
    StopSign,
    StopStatus,
)
from .stop_detector import analyze_stop, MS_TO_MPH


def evaluate_stop(
    rider_activity: RiderActivity,
    stop_sign: StopSign,
    entry_records: list[FitRecord],
    event: Event,
) -> StopResult:
    """Evaluate a single stop sign with crossing guard waiver logic.

    CRITICAL: Crossing guard waiver requires timestamp check.
    The waiver applies ONLY when the rider's activity falls within
    the official event window.
    """
    if stop_sign.crossing_guard:
        # MANDATORY timestamp check — never skip this
        if event.event_window_start and event.event_window_end:
            within_event_window = (
                rider_activity.activity_start >= event.event_window_start
                and rider_activity.activity_end <= event.event_window_end
            )

            if within_event_window and entry_records:
                min_speed_ms = min(r.speed for r in entry_records)
                return StopResult(
                    stop_sign_id=stop_sign.id,
                    status=StopStatus.GUARD_WAIVED,
                    min_speed_mph=min_speed_ms * MS_TO_MPH,
                    stop_duration_s=None,
                    note="Crossing guard posted -- stop not required during event.",
                )
            # Outside event window — fall through to standard detection
        # No event window set — fall through to standard detection

    # Standard stop detection
    return analyze_stop(
        records=entry_records,
        stop_sign_id=stop_sign.id,
        stop_duration_threshold=event.stop_duration_sec,
        speed_threshold_mph=event.speed_threshold_mph,
    )


def strip_fit_records(
    records: list[FitRecord],
    stop_signs: list[StopSign],
    buffer_m: float = 50.0,
) -> dict[str, list[dict]]:
    """Strip FIT records per spec section 11.2 — data minimization.

    Keeps ONLY records within 50m of registered stop signs.
    Strips precise lat/lon, heart rate, power, cadence.
    Retains only: timestamp, speed, distance_from_stop.

    Returns:
        Dict mapping stop_sign_id -> list of stripped record dicts.
    """
    geofence_records: dict[str, list[dict]] = {}

    for stop in stop_signs:
        window = [
            r for r in records
            if haversine(r.lat, r.lon, stop.lat, stop.lon) <= buffer_m
        ]

        # Strip to minimal fields — no precise lat/lon, no biometrics
        geofence_records[stop.id] = [
            {
                "timestamp": r.timestamp.isoformat(),
                "speed": r.speed,
                "speed_mph": r.speed * MS_TO_MPH,
                "dist_from_stop": haversine(r.lat, r.lon, stop.lat, stop.lon),
            }
            for r in window
        ]

    return geofence_records


def process_activity(
    rider_activity: RiderActivity,
    event: Event,
    stop_signs: list[StopSign],
    course_coords: list[tuple[float, float]] | None = None,
) -> ComplianceSummary:
    """Run the full compliance pipeline on a rider's activity.

    1. Strip FIT data to stop-sign zones only (data minimization).
    2. Detect course deviations.
    3. Detect speed sensor dropouts.
    4. For each stop sign, find geofence entries and evaluate compliance.
    5. Aggregate into a compliance summary.
    """
    records = rider_activity.fit_records
    warnings = list(rider_activity.warnings)

    # Step 1: Strip data — only keep records near stop signs
    stripped_data = strip_fit_records(records, stop_signs, buffer_m=50.0)

    # Step 2: Course deviation detection
    deviated_indices: set[int] = set()
    if course_coords:
        deviations = check_course_deviation(records, course_coords)
        for start, end in deviations:
            deviated_indices.update(range(start, end + 1))
            warnings.append(
                f"COURSE_DEVIATION: Records {start}-{end} deviate >500m from course."
            )

    # Step 3: Speed sensor dropout detection
    dropouts = detect_speed_sensor_dropout(records)
    dropout_indices: set[int] = set()
    for start, end in dropouts:
        dropout_indices.update(range(start, end + 1))
        warnings.append(
            f"SPEED_DROPOUT: Gap >5s between records {start} and {end}."
        )

    # Step 4: Evaluate each stop sign
    stop_results: list[StopResult] = []

    for stop in stop_signs:
        # Find all geofence entries for this stop
        entry_records = find_geofence_entries(
            records, stop, event.geofence_radius_m
        )

        if not entry_records:
            # No records at all — MISSED
            result = StopResult(
                stop_sign_id=stop.id,
                status=StopStatus.MISSED,
                min_speed_mph=0.0,
                note="No GPS records found within geofence.",
            )
            result.stripped_records = stripped_data.get(stop.id, [])
            stop_results.append(result)
            continue

        # Split into distinct visits (30s cooldown between entries)
        # Handles out-and-back courses and prevents GPS wobble double-counting
        visits = split_geofence_visits(entry_records, cooldown_seconds=30.0)

        for visit_records in visits:
            visit_records = merge_geofence_windows(visit_records)

            # Check if stop sign is in a deviated section
            record_indices = [records.index(r) for r in visit_records if r in records]
            if record_indices and all(i in deviated_indices for i in record_indices):
                result = StopResult(
                    stop_sign_id=stop.id,
                    status=StopStatus.NOT_APPLICABLE,
                    min_speed_mph=0.0,
                    note="Stop sign in deviated section -- not applicable.",
                )
                stop_results.append(result)
                continue

            # Check for speed sensor dropout in this zone
            if record_indices and any(i in dropout_indices for i in record_indices):
                warnings.append(
                    f"DROPOUT_AT_STOP: Speed sensor dropout near stop {stop.sequence}. "
                    f"Falling back to GPS speed for this section."
                )

            # Evaluate this visit (includes crossing guard check)
            result = evaluate_stop(rider_activity, stop, visit_records, event)

            # Attach stripped records for evidence
            result.stripped_records = stripped_data.get(stop.id, [])

            stop_results.append(result)

    # Step 5: Aggregate summary
    passed = sum(1 for r in stop_results if r.status == StopStatus.PASS)
    failed = sum(1 for r in stop_results if r.status == StopStatus.FAIL)
    missed = sum(1 for r in stop_results if r.status == StopStatus.MISSED)
    guard_waived = sum(1 for r in stop_results if r.status == StopStatus.GUARD_WAIVED)

    # Compliant = pass + guard_waived + not_applicable
    total_applicable = len(stop_results) - sum(
        1 for r in stop_results if r.status == StopStatus.NOT_APPLICABLE
    )
    compliant = passed + guard_waived
    compliance_pct = (compliant / total_applicable * 100) if total_applicable > 0 else 100.0

    dq_recommended = failed > 0 or missed > 0

    return ComplianceSummary(
        rider_id=rider_activity.rider_id,
        event_id=rider_activity.event_id,
        compliance_pct=compliance_pct,
        stops_passed=passed,
        stops_failed=failed,
        stops_missed=missed,
        stops_guard_waived=guard_waived,
        dq_recommended=dq_recommended,
        stop_results=stop_results,
        warnings=warnings,
    )
