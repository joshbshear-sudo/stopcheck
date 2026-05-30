"""CLI tool for StopCheck compliance engine.

Usage:
    python -m stopcheck_engine.cli --fit rider.fit --course course.gpx --output report.json
"""

import argparse
import json
import sys
from datetime import datetime, timedelta

from .compliance import process_activity
from .fit_parser import parse_fit_file, parse_gpx_course
from .models import Event, RiderActivity, StopSign


def parse_json_input(json_path: str) -> tuple[list, list]:
    """Parse a JSON file containing Strava streams or pre-processed records.

    Supports two formats:
    1. Strava streams: { "strava_streams": { "latlng": {...}, "velocity_smooth": {...}, "time": {...} } }
    2. Direct records: [ { "timestamp": "...", "lat": ..., "lon": ..., "speed": ... }, ... ]
    """
    from .models import FitRecord, SpeedSource

    with open(json_path) as f:
        data = json.load(f)

    records = []
    warnings = []

    if "strava_streams" in data:
        streams = data["strava_streams"]
        latlng = streams.get("latlng", {}).get("data", [])
        velocity = streams.get("velocity_smooth", {}).get("data", [])
        time_list = streams.get("time", {}).get("data", [])

        if not latlng or not time_list:
            warnings.append("STRAVA_STREAMS: Missing latlng or time data.")
            return records, warnings

        base_time = datetime.fromisoformat(data.get("start_date", "2026-01-01T00:00:00"))

        for i in range(len(latlng)):
            lat, lon = latlng[i]
            speed = velocity[i] if i < len(velocity) else 0.0
            ts = base_time + timedelta(seconds=time_list[i])
            records.append(FitRecord(
                timestamp=ts, lat=lat, lon=lon, speed=speed,
                speed_source=SpeedSource.GPS_DERIVED,
            ))

        warnings.append("STRAVA_SOURCE: Data from Strava streams API — GPS-derived speed only.")
    elif isinstance(data, list):
        for item in data:
            records.append(FitRecord(
                timestamp=datetime.fromisoformat(item["timestamp"]),
                lat=item["lat"], lon=item["lon"], speed=item["speed"],
                speed_source=SpeedSource(item.get("speed_source", "sensor")),
            ))
    else:
        raise ValueError("Unrecognized JSON input format")

    return records, warnings


def main():
    parser = argparse.ArgumentParser(
        description="StopCheck FIT file compliance engine"
    )
    parser.add_argument(
        "--fit", required=True, help="Path to rider FIT file"
    )
    parser.add_argument(
        "--course", default=None, help="Path to course GPX file (optional)"
    )
    parser.add_argument(
        "--stops", help="Path to JSON file with stop sign definitions"
    )
    parser.add_argument(
        "--output", default="report.json", help="Output report path"
    )
    parser.add_argument(
        "--stop-duration", type=float, default=0.75,
        help="Required stop duration in seconds (default: 0.75 per Spec v2.0 §1.3/§1.4)"
    )
    parser.add_argument(
        "--geofence-radius", type=float, default=25.0,
        help="Geofence radius in meters (default: 25.0 per Spec v2.0 §1.5)"
    )
    parser.add_argument(
        "--speed-threshold", type=float, default=0.5,
        help="Wheel-sensor speed threshold in mph (default: 0.5 per Spec v2.0 §1.4)"
    )

    parser.add_argument(
        "--json-input", action="store_true",
        help="Treat --fit as a JSON file (Strava streams format) instead of binary FIT"
    )
    parser.add_argument(
        "--event-window-start", default=None,
        help="Event window start (ISO 8601, e.g. 2026-06-15T07:00:00)"
    )
    parser.add_argument(
        "--event-window-end", default=None,
        help="Event window end (ISO 8601, e.g. 2026-06-15T16:00:00)"
    )

    args = parser.parse_args()

    # Parse input file
    if args.json_input:
        print(f"Parsing JSON input: {args.fit}")
        records, warnings = parse_json_input(args.fit)
    else:
        print(f"Parsing FIT file: {args.fit}")
        records, warnings = parse_fit_file(args.fit)
    print(f"  {len(records)} records parsed, {len(warnings)} warnings")

    # Parse course (optional)
    course_coords = []
    if args.course and args.course not in ('NUL', '/dev/null', 'none', 'None'):
        print(f"Parsing course file: {args.course}")
        course_coords = parse_gpx_course(args.course)
        print(f"  {len(course_coords)} course coordinates")
    else:
        print("No course file provided — skipping course deviation detection.")

    # Load stop signs
    if args.stops:
        with open(args.stops) as f:
            stops_data = json.load(f)
        stop_signs = [
            StopSign(
                id=s["id"],
                event_id=s.get("event_id", "cli"),
                sequence=s["sequence"],
                lat=s["lat"],
                lon=s["lon"],
                location=s.get("location"),
                crossing_guard=s.get("crossing_guard", False),
            )
            for s in stops_data
        ]
    else:
        print("No stop signs file provided. Use --stops to specify.")
        sys.exit(1)

    # Build activity
    activity = RiderActivity(
        rider_id="cli-rider",
        event_id="cli-event",
        activity_start=records[0].timestamp if records else datetime.now(),
        activity_end=records[-1].timestamp if records else datetime.now(),
        fit_records=records,
        warnings=warnings,
    )

    # Build event
    window_start = datetime.fromisoformat(args.event_window_start) if args.event_window_start else None
    window_end = datetime.fromisoformat(args.event_window_end) if args.event_window_end else None

    event = Event(
        id="cli-event",
        name="CLI Analysis",
        event_date=datetime.now().strftime("%Y-%m-%d"),
        stop_duration_sec=args.stop_duration,
        geofence_radius_m=args.geofence_radius,
        speed_threshold_mph=args.speed_threshold,
        event_window_start=window_start,
        event_window_end=window_end,
    )

    # Process
    print("Running compliance analysis...")
    summary = process_activity(activity, event, stop_signs, course_coords)

    # Output
    report = {
        "rider_id": summary.rider_id,
        "event_id": summary.event_id,
        "compliance_pct": summary.compliance_pct,
        "stops_passed": summary.stops_passed,
        "stops_failed": summary.stops_failed,
        "stops_missed": summary.stops_missed,
        "stops_guard_waived": summary.stops_guard_waived,
        "dq_recommended": summary.dq_recommended,
        "warnings": summary.warnings,
        "stop_results": [
            {
                "stop_sign_id": r.stop_sign_id,
                "status": r.status.value,
                "min_speed_mph": round(r.min_speed_mph, 2),
                "stop_duration_s": r.stop_duration_s,
                "speed_source": r.speed_source.value,
                "note": r.note,
                "evidence_records": r.stripped_records,
            }
            for r in summary.stop_results
        ],
    }

    with open(args.output, "w") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\nCompliance: {summary.compliance_pct:.1f}%")
    print(f"  Passed: {summary.stops_passed}")
    print(f"  Failed: {summary.stops_failed}")
    print(f"  Missed: {summary.stops_missed}")
    print(f"  Guard waived: {summary.stops_guard_waived}")
    print(f"  DQ recommended: {summary.dq_recommended}")
    print(f"\nReport saved to {args.output}")


if __name__ == "__main__":
    main()
