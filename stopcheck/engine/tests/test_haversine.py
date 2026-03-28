"""Tests for haversine distance calculation."""

import pytest
from stopcheck_engine.haversine import haversine


class TestHaversine:
    def test_same_point_returns_zero(self):
        assert haversine(40.0, -105.0, 40.0, -105.0) == 0.0

    def test_known_distance_short(self):
        # Two points ~111m apart (0.001 degree latitude at ~40N)
        dist = haversine(40.0, -105.0, 40.001, -105.0)
        assert 110 < dist < 112

    def test_known_distance_medium(self):
        # NYC to LA approx 3940 km
        dist = haversine(40.7128, -74.0060, 34.0522, -118.2437)
        assert 3_900_000 < dist < 4_000_000

    def test_symmetry(self):
        d1 = haversine(40.0, -105.0, 41.0, -106.0)
        d2 = haversine(41.0, -106.0, 40.0, -105.0)
        assert abs(d1 - d2) < 0.001

    def test_small_distance_meters(self):
        # ~20m apart
        dist = haversine(40.0, -105.0, 40.00018, -105.0)
        assert 15 < dist < 25
