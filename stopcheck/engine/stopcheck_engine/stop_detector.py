"""Stop detection algorithm — determines if a rider made a compliant stop."""

from .models import FitRecord, StopResult, StopStatus, SpeedSource

# m/s equivalents
MPH_TO_MS = 0.44704
# Spec v2.0 §1.4 — wheel-sensor base threshold
SPEED_THRESHOLD_MPH = 0.5
SPEED_THRESHOLD_MS = SPEED_THRESHOLD_MPH * MPH_TO_MS  # ~0.22 m/s
# Spec v2.0 §1.3 — GPS-only threshold (relaxed to absorb GPS noise around zero)
GPS_ONLY_THRESHOLD_MPH = 2.0
GPS_ONLY_THRESHOLD_MS = GPS_ONLY_THRESHOLD_MPH * MPH_TO_MS
# Spec v2.0 §1.3 / §1.4 — required dwell, same for both source classes
GPS_ONLY_STOP_DURATION = 0.75  # seconds — matches wheel-sensor dwell per spec

MS_TO_MPH = 2.23694


def analyze_stop(
    records: list[FitRecord],
    stop_sign_id: str,
    stop_duration_threshold: float = 0.75,
    speed_threshold_mph: float = SPEED_THRESHOLD_MPH,
) -> StopResult:
    """Analyze entry window records to determine stop compliance.

    Args:
        records: FIT records within the geofence.
        stop_sign_id: ID of the stop sign.
        stop_duration_threshold: Minimum stop duration in seconds.
        speed_threshold_mph: Speed below which rider is considered stopped.

    Returns:
        StopResult with pass/fail status.
    """
    if not records:
        return StopResult(
            stop_sign_id=stop_sign_id,
            status=StopStatus.MISSED,
            min_speed_mph=0.0,
            stop_duration_s=0.0,
            note="No GPS records found within geofence.",
        )

    sorted_records = sorted(records, key=lambda r: r.timestamp)

    # Determine if GPS-only — use relaxed thresholds
    is_gps_only = all(r.speed_source == SpeedSource.GPS_DERIVED for r in sorted_records)
    threshold_ms = GPS_ONLY_THRESHOLD_MS if is_gps_only else speed_threshold_mph * MPH_TO_MS
    required_duration = GPS_ONLY_STOP_DURATION if is_gps_only else stop_duration_threshold

    speed_source = SpeedSource.GPS_DERIVED if is_gps_only else SpeedSource.SENSOR

    # Find minimum speed
    min_speed_ms = min(r.speed for r in sorted_records)
    min_speed_mph = min_speed_ms * MS_TO_MPH

    # Find zero-speed records
    zero_speed_records = [r for r in sorted_records if r.speed <= threshold_ms]

    if not zero_speed_records:
        return StopResult(
            stop_sign_id=stop_sign_id,
            status=StopStatus.FAIL,
            min_speed_mph=min_speed_mph,
            stop_duration_s=0.0,
            speed_source=speed_source,
            note=f"Never dropped below {speed_threshold_mph} mph in geofence."
                 + (" (GPS-only: 1.0 mph threshold)" if is_gps_only else ""),
        )

    # Find longest consecutive zero-speed window
    max_duration = _longest_consecutive_window(zero_speed_records)

    # Check for dismount (>30s at zero — always compliant, per spec)
    if max_duration > 30.0:
        return StopResult(
            stop_sign_id=stop_sign_id,
            status=StopStatus.PASS,
            min_speed_mph=min_speed_mph,
            stop_duration_s=max_duration,
            speed_source=speed_source,
            note="Extended stop detected (possible dismount).",
        )

    if max_duration >= required_duration:
        return StopResult(
            stop_sign_id=stop_sign_id,
            status=StopStatus.PASS,
            min_speed_mph=min_speed_mph,
            stop_duration_s=max_duration,
            speed_source=speed_source,
        )
    else:
        return StopResult(
            stop_sign_id=stop_sign_id,
            status=StopStatus.FAIL,
            min_speed_mph=min_speed_mph,
            stop_duration_s=max_duration,
            speed_source=speed_source,
            note=f"Stop duration {max_duration:.1f}s < required {required_duration:.1f}s.",
        )


def _longest_consecutive_window(records: list[FitRecord]) -> float:
    """Find the longest consecutive window of stopped records.

    Uses timestamps: duration = last_record.timestamp - first_record.timestamp.
    Records are considered consecutive if gap between them is <= 2 seconds
    (to handle 1-second recording with minor jitter).
    """
    if not records:
        return 0.0
    if len(records) == 1:
        # Single record at zero speed — count as 1 second
        return 1.0

    sorted_recs = sorted(records, key=lambda r: r.timestamp)
    max_dur = 0.0
    window_start = 0

    for i in range(1, len(sorted_recs)):
        gap = (sorted_recs[i].timestamp - sorted_recs[i - 1].timestamp).total_seconds()
        if gap > 2.0:
            # End of consecutive window
            dur = (sorted_recs[i - 1].timestamp - sorted_recs[window_start].timestamp).total_seconds()
            # Add 1 second for the last record in the window
            dur += 1.0
            max_dur = max(max_dur, dur)
            window_start = i

    # Check the final window
    dur = (sorted_recs[-1].timestamp - sorted_recs[window_start].timestamp).total_seconds()
    dur += 1.0
    max_dur = max(max_dur, dur)

    return max_dur
