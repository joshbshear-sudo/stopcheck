"""Tests for compliance engine — crossing guard waivers, data stripping, full pipeline."""

import pytest
from datetime import datetime, timedelta

from stopcheck_engine.models import (
    ComplianceSummary, Event, FitRecord, RiderActivity,
    SpeedSource, StopResult, StopSign, StopStatus,
)
from stopcheck_engine.compliance import (
    evaluate_stop, strip_fit_records, process_activity,
)
from stopcheck_engine.stop_detector import MS_TO_MPH


def _make_stop_sign(id="stop-1", lat=40.0, lon=-105.0, sequence=1,
                     crossing_guard=False):
    return StopSign(
        id=id, event_id="evt-1", sequence=sequence,
        lat=lat, lon=lon, crossing_guard=crossing_guard,
    )


def _make_event(window_start=None, window_end=None):
    return Event(
        id="evt-1", name="Test Event", event_date="2026-03-15",
        event_window_start=window_start, event_window_end=window_end,
    )


def _make_records_near_stop(stop_lat, stop_lon, speeds, start_time=None,
                             offset_lat=0.00005):
    """Create records near a stop sign with given speed profile."""
    start = start_time or datetime(2026, 3, 15, 9, 0, 0)
    records = []
    for i, s in enumerate(speeds):
        records.append(FitRecord(
            timestamp=start + timedelta(seconds=i),
            lat=stop_lat + offset_lat,  # ~5m from stop
            lon=stop_lon,
            speed=s,
            speed_source=SpeedSource.SENSOR,
        ))
    return records


def _make_activity(records, start=None, end=None):
    start = start or (records[0].timestamp if records else datetime(2026, 3, 15, 9, 0, 0))
    end = end or (records[-1].timestamp if records else datetime(2026, 3, 15, 10, 0, 0))
    return RiderActivity(
        rider_id="rider-1", event_id="evt-1",
        activity_start=start, activity_end=end,
        fit_records=records,
    )


class TestCrossingGuardWaiver:
    """Tests for crossing guard waiver — spec section 10."""

    def test_guard_waiver_within_event_window(self):
        """Guard-posted stop during event window — waiver applies."""
        stop = _make_stop_sign(crossing_guard=True)
        event = _make_event(
            window_start=datetime(2026, 3, 15, 7, 0, 0),
            window_end=datetime(2026, 3, 15, 16, 0, 0),
        )
        records = _make_records_near_stop(stop.lat, stop.lon, [2.0, 1.5, 1.0, 1.5])
        activity = _make_activity(records)
        result = evaluate_stop(activity, stop, records, event)
        assert result.status == StopStatus.GUARD_WAIVED

    def test_guard_waiver_outside_event_window_pre_ride(self):
        """Guard-posted stop but rider is pre-riding 2 days early — NO waiver."""
        stop = _make_stop_sign(crossing_guard=True)
        event = _make_event(
            window_start=datetime(2026, 3, 15, 7, 0, 0),
            window_end=datetime(2026, 3, 15, 16, 0, 0),
        )
        # Activity 2 days before event
        records = _make_records_near_stop(
            stop.lat, stop.lon, [2.0, 1.5, 1.0, 1.5],
            start_time=datetime(2026, 3, 13, 10, 0, 0),
        )
        activity = _make_activity(records)
        result = evaluate_stop(activity, stop, records, event)
        # Should NOT be guard_waived — standard rules apply, this should fail
        assert result.status != StopStatus.GUARD_WAIVED
        assert result.status == StopStatus.FAIL

    def test_guard_waiver_no_event_window_set(self):
        """Guard posted but no event window configured — standard rules."""
        stop = _make_stop_sign(crossing_guard=True)
        event = _make_event()  # no window
        records = _make_records_near_stop(stop.lat, stop.lon, [2.0, 0.0, 0.0, 0.0, 0.0, 1.0])
        activity = _make_activity(records)
        result = evaluate_stop(activity, stop, records, event)
        # No window set — falls through to standard detection (should pass)
        assert result.status == StopStatus.PASS

    def test_non_guard_stop_normal_rules(self):
        """Non-guarded stop — standard compliance rules always apply."""
        stop = _make_stop_sign(crossing_guard=False)
        event = _make_event(
            window_start=datetime(2026, 3, 15, 7, 0, 0),
            window_end=datetime(2026, 3, 15, 16, 0, 0),
        )
        records = _make_records_near_stop(stop.lat, stop.lon, [2.0, 1.5, 1.0, 1.5])
        activity = _make_activity(records)
        result = evaluate_stop(activity, stop, records, event)
        assert result.status == StopStatus.FAIL

    def test_guard_waiver_activity_starts_before_window(self):
        """Activity starts before event window — no waiver even if guard posted."""
        stop = _make_stop_sign(crossing_guard=True)
        event = _make_event(
            window_start=datetime(2026, 3, 15, 7, 0, 0),
            window_end=datetime(2026, 3, 15, 16, 0, 0),
        )
        records = _make_records_near_stop(
            stop.lat, stop.lon, [2.0, 1.5, 1.0],
            start_time=datetime(2026, 3, 15, 6, 50, 0),  # before window
        )
        activity = _make_activity(records)
        result = evaluate_stop(activity, stop, records, event)
        assert result.status != StopStatus.GUARD_WAIVED


class TestDataStripping:
    """Tests for FIT data stripping — spec section 11."""

    def test_only_records_within_50m_retained(self):
        """Only records within 50m of a stop sign are kept."""
        stop = _make_stop_sign(lat=40.0, lon=-105.0)
        records = [
            # Near stop (~5m)
            FitRecord(datetime(2026, 3, 15, 9, 0, 0), 40.00005, -105.0, 1.0),
            # Far from stop (~1km)
            FitRecord(datetime(2026, 3, 15, 9, 0, 30), 40.01, -105.0, 5.0),
            # Near stop (~10m)
            FitRecord(datetime(2026, 3, 15, 9, 0, 1), 40.0001, -105.0, 0.5),
        ]
        stripped = strip_fit_records(records, [stop])
        assert len(stripped[stop.id]) == 2  # only 2 records within 50m

    def test_stripped_records_have_no_lat_lon(self):
        """Stripped records must not contain precise lat/lon."""
        stop = _make_stop_sign(lat=40.0, lon=-105.0)
        records = [
            FitRecord(datetime(2026, 3, 15, 9, 0, 0), 40.00005, -105.0, 1.0),
        ]
        stripped = strip_fit_records(records, [stop])
        for rec in stripped[stop.id]:
            assert "lat" not in rec
            assert "lon" not in rec
            assert "timestamp" in rec
            assert "speed" in rec
            assert "dist_from_stop" in rec

    def test_stripped_records_no_biometrics(self):
        """Heart rate, power, cadence must never appear in stripped data."""
        stop = _make_stop_sign(lat=40.0, lon=-105.0)
        records = [
            FitRecord(datetime(2026, 3, 15, 9, 0, 0), 40.00005, -105.0, 1.0),
        ]
        stripped = strip_fit_records(records, [stop])
        for rec in stripped[stop.id]:
            assert "heart_rate" not in rec
            assert "power" not in rec
            assert "cadence" not in rec


class TestFullPipeline:
    """End-to-end compliance pipeline tests."""

    def test_all_stops_pass(self):
        """Rider stops correctly at all stops — 100% compliance."""
        stops = [
            _make_stop_sign("s1", 40.0, -105.0, 1),
            _make_stop_sign("s2", 40.001, -105.0, 2),
        ]
        event = _make_event()

        # Records near stop 1: full stop
        r1 = _make_records_near_stop(40.0, -105.0, [2.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 2.0])
        # Records near stop 2: full stop
        r2 = _make_records_near_stop(40.001, -105.0, [2.0, 0.0, 0.0, 0.0, 0.0, 2.0],
                                      start_time=datetime(2026, 3, 15, 9, 5, 0))
        # Records in between (far from both stops)
        mid = [FitRecord(datetime(2026, 3, 15, 9, 2, i), 40.0005, -105.0, 5.0)
               for i in range(10)]

        all_records = r1 + mid + r2
        activity = _make_activity(all_records)

        summary = process_activity(activity, event, stops)
        assert summary.compliance_pct == 100.0
        assert summary.stops_passed == 2
        assert summary.stops_failed == 0
        assert summary.dq_recommended is False

    def test_one_stop_failed_dq_recommended(self):
        """Rider fails one stop — DQ recommended."""
        stops = [
            _make_stop_sign("s1", 40.0, -105.0, 1),
            _make_stop_sign("s2", 40.001, -105.0, 2),
        ]
        event = _make_event()

        # Stop 1: pass
        r1 = _make_records_near_stop(40.0, -105.0, [2.0, 0.0, 0.0, 0.0, 0.0, 2.0])
        # Stop 2: fail (rolling through)
        r2 = _make_records_near_stop(40.001, -105.0, [3.0, 2.0, 1.5, 2.0, 3.0],
                                      start_time=datetime(2026, 3, 15, 9, 5, 0))
        mid = [FitRecord(datetime(2026, 3, 15, 9, 2, i), 40.0005, -105.0, 5.0)
               for i in range(10)]

        all_records = r1 + mid + r2
        activity = _make_activity(all_records)

        summary = process_activity(activity, event, stops)
        assert summary.compliance_pct == 50.0
        assert summary.stops_passed == 1
        assert summary.stops_failed == 1
        assert summary.dq_recommended is True

    def test_guard_waived_counts_as_compliant(self):
        """Guard-waived stop counts toward compliance percentage."""
        stops = [
            _make_stop_sign("s1", 40.0, -105.0, 1),
            _make_stop_sign("s2", 40.001, -105.0, 2, crossing_guard=True),
        ]
        event = _make_event(
            window_start=datetime(2026, 3, 15, 7, 0, 0),
            window_end=datetime(2026, 3, 15, 16, 0, 0),
        )

        # Stop 1: pass
        r1 = _make_records_near_stop(40.0, -105.0, [2.0, 0.0, 0.0, 0.0, 0.0, 2.0])
        # Stop 2: rolling through but guard posted
        r2 = _make_records_near_stop(40.001, -105.0, [3.0, 2.0, 1.5, 2.0, 3.0],
                                      start_time=datetime(2026, 3, 15, 9, 5, 0))
        mid = [FitRecord(datetime(2026, 3, 15, 9, 2, i), 40.0005, -105.0, 5.0)
               for i in range(10)]

        all_records = r1 + mid + r2
        activity = _make_activity(all_records)

        summary = process_activity(activity, event, stops)
        assert summary.compliance_pct == 100.0
        assert summary.stops_guard_waived == 1
        assert summary.dq_recommended is False
