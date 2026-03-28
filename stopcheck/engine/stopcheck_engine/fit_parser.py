"""FIT file parser — extracts GPS and speed records.

Applies speed field priority: enhanced_speed > speed > GPS-derived.
Validates 1-second recording rate.
"""

from datetime import datetime, timedelta
from typing import Optional

from .models import FitRecord, SpeedSource

# Garmin FIT semicircle to degrees
SEMICIRCLE_TO_DEG = 180.0 / (2 ** 31)


def parse_fit_file(fit_file_path: str) -> tuple[list[FitRecord], list[str]]:
    """Parse a FIT file and return records + warnings.

    Returns:
        Tuple of (records, warnings).
    """
    import fitparse

    fitfile = fitparse.FitFile(fit_file_path)
    records: list[FitRecord] = []
    warnings: list[str] = []

    for record in fitfile.get_messages("record"):
        fields = {f.name: f.value for f in record.fields}

        timestamp = fields.get("timestamp")
        if not isinstance(timestamp, datetime):
            continue

        lat_semi = fields.get("position_lat")
        lon_semi = fields.get("position_long")
        if lat_semi is None or lon_semi is None:
            continue

        # Convert from semicircles if values are large integers
        if isinstance(lat_semi, (int, float)) and abs(lat_semi) > 180:
            lat = lat_semi * SEMICIRCLE_TO_DEG
            lon = lon_semi * SEMICIRCLE_TO_DEG
        else:
            lat = float(lat_semi)
            lon = float(lon_semi)

        # Speed priority: enhanced_speed > speed > GPS-derived
        enhanced = fields.get("enhanced_speed")
        raw_speed = fields.get("speed")
        speed_source = SpeedSource.SENSOR

        if enhanced is not None:
            speed = float(enhanced)
        elif raw_speed is not None:
            speed = float(raw_speed)
        else:
            speed = None
            speed_source = SpeedSource.GPS_DERIVED

        # GPS-derived speed calculated later if needed
        if speed is None:
            speed = 0.0  # placeholder; derived below if possible

        records.append(FitRecord(
            timestamp=timestamp,
            lat=lat,
            lon=lon,
            speed=speed,
            enhanced_speed=enhanced,
            speed_source=speed_source,
        ))

    # Derive GPS speed for records that lack sensor data
    _derive_gps_speeds(records, warnings)

    # Validate recording rate
    _check_recording_rate(records, warnings)

    return records, warnings


def _derive_gps_speeds(records: list[FitRecord], warnings: list[str]) -> None:
    """Fill in GPS-derived speed for records missing sensor speed."""
    from .haversine import haversine

    gps_derived_count = 0
    for i, rec in enumerate(records):
        if rec.speed_source == SpeedSource.GPS_DERIVED:
            gps_derived_count += 1
            if i > 0:
                prev = records[i - 1]
                dt = (rec.timestamp - prev.timestamp).total_seconds()
                if dt > 0:
                    dist = haversine(prev.lat, prev.lon, rec.lat, rec.lon)
                    rec.speed = dist / dt  # m/s

    if gps_derived_count > 0 and gps_derived_count == len(records):
        warnings.append(
            "GPS_ONLY: No wheel speed sensor data found. "
            "Using GPS-derived speed only — reduced accuracy."
        )


def _check_recording_rate(records: list[FitRecord], warnings: list[str]) -> None:
    """Flag files with average recording gap > 2 seconds."""
    if len(records) < 2:
        warnings.append("INSUFFICIENT_DATA: File contains fewer than 2 records.")
        return

    total_gap = (records[-1].timestamp - records[0].timestamp).total_seconds()
    avg_gap = total_gap / (len(records) - 1)

    if avg_gap > 2.0:
        warnings.append(
            f"SMART_RECORDING: Average recording interval is {avg_gap:.1f}s "
            f"(>2s). Stop detection accuracy may be reduced. "
            f"Linear interpolation will be used."
        )


def parse_gpx_course(gpx_file_path: str) -> list[tuple[float, float]]:
    """Parse a GPX file and return list of (lat, lon) course coordinates."""
    import gpxpy

    with open(gpx_file_path, "r") as f:
        gpx = gpxpy.parse(f)

    coords = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                coords.append((point.latitude, point.longitude))

    if not coords:
        for route in gpx.routes:
            for point in route.points:
                coords.append((point.latitude, point.longitude))

    return coords
