"""Tests for geofence matching."""

import pytest
from datetime import datetime, timedelta

from stopcheck_engine.models import FitRecord, SpeedSource, StopSign
from stopcheck_engine.geofence import (
    find_geofence_entries,
    merge_geofence_windows,
    detect_speed_sensor_dropout,
)


def _make_stop(lat=40.0, lon=-105.0):
    return StopSign(id="s1", event_id="e1", sequence=1, lat=lat, lon=lon)


def _rec(ts_offset, lat, lon, speed=1.0):
    return FitRecord(
        timestamp=datetime(2026, 3, 15, 9, 0, 0) + timedelta(seconds=ts_offset),
        lat=lat, lon=lon, speed=speed,
    )


class TestGeofenceMatching:
    def test_records_inside_geofence(self):
        """Records within 20m should be returned."""
        stop = _make_stop()
        records = [
            _rec(0, 40.00005, -105.0),   # ~5m
            _rec(1, 40.0001, -105.0),     # ~11m
            _rec(2, 40.00015, -105.0),    # ~17m
        ]
        entries = find_geofence_entries(records, stop, 20.0)
        assert len(entries) == 3

    def test_records_outside_geofence(self):
        """Records >40m away should not be returned."""
        stop = _make_stop()
        records = [
            _rec(0, 40.005, -105.0),   # ~500m
            _rec(1, 40.01, -105.0),    # ~1km
        ]
        entries = find_geofence_entries(records, stop, 20.0)
        assert len(entries) == 0

    def test_expanded_radius_for_early_stop(self):
        """Rider stops 25-40m before stop sign — expanded search catches it."""
        stop = _make_stop()
        records = [
            _rec(0, 40.0003, -105.0, speed=0.0),   # ~33m, stopped
            _rec(1, 40.00032, -105.0, speed=0.0),   # ~35m, stopped
            _rec(2, 40.00034, -105.0, speed=0.1),   # ~38m
        ]
        entries = find_geofence_entries(records, stop, 20.0)
        assert len(entries) > 0  # Should use expanded radius

    def test_merge_windows_within_5_seconds(self):
        """GPS jitter: windows within 5s should merge."""
        records = [
            _rec(0, 40.0, -105.0),
            _rec(1, 40.0, -105.0),
            _rec(4, 40.0, -105.0),  # 3s gap — within 5s
            _rec(5, 40.0, -105.0),
        ]
        merged = merge_geofence_windows(records)
        assert len(merged) == 4

    def test_speed_sensor_dropout_detected(self):
        """Gaps >5s in records should be flagged."""
        records = [
            _rec(0, 40.0, -105.0),
            _rec(1, 40.0, -105.0),
            _rec(10, 40.0, -105.0),  # 9s gap
            _rec(11, 40.0, -105.0),
        ]
        dropouts = detect_speed_sensor_dropout(records)
        assert len(dropouts) == 1
        assert dropouts[0] == (1, 2)
