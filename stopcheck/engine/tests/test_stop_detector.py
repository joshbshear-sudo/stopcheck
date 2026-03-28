"""Tests for stop detection algorithm."""

import pytest
from datetime import datetime, timedelta

from stopcheck_engine.models import FitRecord, SpeedSource, StopStatus
from stopcheck_engine.stop_detector import analyze_stop, MS_TO_MPH, SPEED_THRESHOLD_MS


def _make_records(speed_profile: list[float], start_time=None, interval_s=1) -> list[FitRecord]:
    """Helper: create FIT records from a speed profile (m/s values)."""
    start = start_time or datetime(2026, 3, 15, 8, 0, 0)
    return [
        FitRecord(
            timestamp=start + timedelta(seconds=i * interval_s),
            lat=40.0,
            lon=-105.0,
            speed=s,
            speed_source=SpeedSource.SENSOR,
        )
        for i, s in enumerate(speed_profile)
    ]


class TestStopDetector:
    def test_clear_pass_full_stop(self):
        """Rider comes to complete stop for 4 seconds — should pass."""
        speeds = [2.0, 1.0, 0.5, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.5, 1.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.PASS
        assert result.stop_duration_s >= 3.0

    def test_clear_fail_rolling_through(self):
        """Rider slows but never stops — should fail."""
        speeds = [3.0, 2.0, 1.5, 1.0, 0.8, 0.5, 0.8, 1.5, 3.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL

    def test_fail_too_short_stop(self):
        """Rider stops for only 1 second — should fail (need 3s)."""
        speeds = [2.0, 1.0, 0.1, 0.0, 0.3, 1.0, 2.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL
        assert result.stop_duration_s < 3.0

    def test_pass_exactly_3_seconds(self):
        """Rider stops for exactly 3 seconds — should pass."""
        speeds = [1.0, 0.5, 0.0, 0.0, 0.0, 0.5, 1.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.PASS

    def test_pass_extended_stop_dismount(self):
        """Rider stops for >30 seconds (dismount) — should pass."""
        speeds = [1.0, 0.0] + [0.0] * 35 + [0.0, 1.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.PASS
        assert "dismount" in (result.note or "").lower()

    def test_fail_high_speed_through(self):
        """Rider blows through at high speed — should fail."""
        speeds = [5.0, 5.5, 6.0, 5.5, 5.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL
        assert result.min_speed_mph > 10.0

    def test_missed_no_records(self):
        """No records in geofence — should be MISSED."""
        result = analyze_stop([], "stop-1")
        assert result.status == StopStatus.MISSED

    def test_gps_only_uses_relaxed_thresholds(self):
        """GPS-only data uses 1.0 mph threshold and 4s duration."""
        # Speed just below 1.0 mph (~0.44 m/s) for 4 seconds
        speeds = [1.0, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 1.0]
        records = _make_records(speeds)
        for r in records:
            r.speed_source = SpeedSource.GPS_DERIVED
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.PASS
        assert result.speed_source == SpeedSource.GPS_DERIVED

    def test_gps_only_fails_short_duration(self):
        """GPS-only: stop for 2s at low speed — fails (needs 4s)."""
        speeds = [1.0, 0.3, 0.3, 0.5, 1.0]
        records = _make_records(speeds)
        for r in records:
            r.speed_source = SpeedSource.GPS_DERIVED
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL

    def test_speed_just_at_threshold(self):
        """Speed exactly at 0.5 mph boundary — should count as stopped."""
        threshold_ms = 0.5 * 0.44704  # exactly 0.5 mph in m/s
        speeds = [1.0, threshold_ms, threshold_ms, threshold_ms, threshold_ms, 1.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        # At threshold (<=), should count as stopped
        assert result.status == StopStatus.PASS

    def test_fail_3_9_mph_rolling_stop(self):
        """Rider records 3.9 mph minimum at stop sign — must be FAIL."""
        speed_3_9_mph = 3.9 * 0.44704  # 1.743 m/s
        speeds = [3.0, 2.5, speed_3_9_mph, speed_3_9_mph, speed_3_9_mph, 2.5, 3.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL
        assert result.min_speed_mph >= 3.8

    def test_fail_4_0_mph_rolling_stop(self):
        """Rider records 4.0 mph minimum at stop sign — must be FAIL."""
        speed_4_0_mph = 4.0 * 0.44704  # 1.788 m/s
        speeds = [3.0, 2.5, speed_4_0_mph, speed_4_0_mph, speed_4_0_mph, 2.5, 3.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        assert result.status == StopStatus.FAIL
        assert result.min_speed_mph >= 3.9

    def test_non_consecutive_zero_speed_windows(self):
        """Two separate short stops don't add up — longest window counts."""
        speeds = [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]
        records = _make_records(speeds)
        result = analyze_stop(records, "stop-1")
        # Each window is 2s (2 records + 1s = 2s at best), fails 3s requirement
        assert result.status == StopStatus.FAIL
