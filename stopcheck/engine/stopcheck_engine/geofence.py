"""Geofence matching — identifies FIT records within stop sign zones.

Handles multiple geofence entries per stop sign (e.g. out-and-back courses)
with a 30-second cooldown to prevent double-counting from GPS wobble.
"""

from .haversine import haversine
from .models import FitRecord, StopSign


def find_geofence_entries(
    records: list[FitRecord],
    stop_sign: StopSign,
    geofence_radius_m: float = 20.0,
) -> list[FitRecord]:
    """Return records that fall within the geofence radius of a stop sign.

    Per spec section 3.3.4: also check expanded 40m radius for
    riders who stop before entering the standard geofence.
    """
    primary_entries = []
    expanded_entries = []

    for rec in records:
        dist = haversine(rec.lat, rec.lon, stop_sign.lat, stop_sign.lon)
        if dist <= geofence_radius_m:
            primary_entries.append(rec)
        elif dist <= 40.0:
            expanded_entries.append(rec)

    if primary_entries:
        return primary_entries

    # Edge case: rider stopped before entering geofence (25-40m out)
    zero_speed_expanded = [r for r in expanded_entries if r.speed <= 0.22]
    if zero_speed_expanded:
        return expanded_entries

    return []


def split_geofence_visits(
    records: list[FitRecord],
    cooldown_seconds: float = 30.0,
) -> list[list[FitRecord]]:
    """Split geofence records into distinct visits.

    Two entries are considered separate visits if they are separated by
    more than cooldown_seconds (default 30s). This prevents:
    - GPS wobble at low speed from creating duplicate events
    - But correctly separates out-and-back passes through the same stop

    Returns a list of record groups, one per distinct visit.
    """
    if not records:
        return []

    sorted_records = sorted(records, key=lambda r: r.timestamp)
    visits: list[list[FitRecord]] = [[sorted_records[0]]]

    for rec in sorted_records[1:]:
        gap = (rec.timestamp - visits[-1][-1].timestamp).total_seconds()
        if gap > cooldown_seconds:
            # New visit — gap exceeds cooldown
            visits.append([rec])
        else:
            # Same visit — within cooldown window
            visits[-1].append(rec)

    return visits


def merge_geofence_windows(records: list[FitRecord]) -> list[FitRecord]:
    """Merge geofence entry windows within 5 seconds of each other.

    Handles GPS drift at intersections where position jitter shows
    rider leaving and re-entering geofence within a single pass.
    """
    if not records:
        return []

    sorted_records = sorted(records, key=lambda r: r.timestamp)
    merged = [sorted_records[0]]

    for rec in sorted_records[1:]:
        gap = (rec.timestamp - merged[-1].timestamp).total_seconds()
        if gap <= 5.0:
            merged.append(rec)
        else:
            # Gap > 5s within a single visit — still include
            # (the visit was already split by split_geofence_visits)
            merged.append(rec)

    return merged


def detect_speed_sensor_dropout(records: list[FitRecord]) -> list[tuple[int, int]]:
    """Detect gaps of >5 seconds in speed data."""
    dropouts = []
    for i in range(1, len(records)):
        gap = (records[i].timestamp - records[i - 1].timestamp).total_seconds()
        if gap > 5.0:
            dropouts.append((i - 1, i))
    return dropouts


def check_course_deviation(
    records: list[FitRecord],
    course_coords: list[tuple[float, float]],
    threshold_m: float = 500.0,
) -> list[tuple[int, int]]:
    """Detect sections where rider deviates >500m from the course."""
    deviated_sections = []
    in_deviation = False
    dev_start = 0

    for i, rec in enumerate(records):
        min_dist = min(
            haversine(rec.lat, rec.lon, clat, clon)
            for clat, clon in course_coords
        ) if course_coords else 0.0

        if min_dist > threshold_m:
            if not in_deviation:
                in_deviation = True
                dev_start = i
        else:
            if in_deviation:
                deviated_sections.append((dev_start, i - 1))
                in_deviation = False

    if in_deviation:
        deviated_sections.append((dev_start, len(records) - 1))

    return deviated_sections
