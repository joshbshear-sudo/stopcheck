"""Haversine distance calculation between GPS coordinates."""

import math

EARTH_RADIUS_M = 6_371_000  # meters


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance in meters between two GPS points.

    Args:
        lat1, lon1: First point (decimal degrees).
        lat2, lon2: Second point (decimal degrees).

    Returns:
        Distance in meters.
    """
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2
         + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_M * c
